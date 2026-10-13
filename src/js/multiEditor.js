
/*
 * StoryForge Multi-Level Editor
 *
 * Continuous editing for books and chapters.
 *
 * Features:
 * - One shared TipTap instance
 * - Shared sticky formatting toolbar
 * - Manuscript outline navigation
 * - Chapter and scene navigation by document position
 * - Per-scene autosaving
 * - Mobile navigation
 */

import { createContinuousEditor } from "./continuousEditor.js";
import { updateSceneContent } from "./projects.js";
import { renderManuscriptOutline } from "./manuscriptOutline.js";


// ============================================================
// HTML SAFETY
// ============================================================

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}


// ============================================================
// SHARED TOOLBAR
// ============================================================

function createToolbar() {
    const toolbar = document.createElement("div");

    toolbar.className =
        "storyforge-continuous-toolbar " +
        "d-flex flex-wrap align-items-center gap-2 mb-3";

    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute(
        "aria-label",
        "Manuscript formatting"
    );

    toolbar.innerHTML = `
        <button type="button" id="editor-bold"
            class="btn btn-sm btn-outline-secondary"
            title="Bold">
            <strong>B</strong>
        </button>

        <button type="button" id="editor-italic"
            class="btn btn-sm btn-outline-secondary"
            title="Italic">
            <em>I</em>
        </button>

        <button type="button" id="editor-underline"
            class="btn btn-sm btn-outline-secondary"
            title="Underline">
            <u>U</u>
        </button>

        <span class="storyforge-toolbar-divider"></span>

        <button type="button" id="editor-align-left"
            class="btn btn-sm btn-outline-secondary">
            Left
        </button>

        <button type="button" id="editor-align-center"
            class="btn btn-sm btn-outline-secondary">
            Centre
        </button>

        <button type="button" id="editor-align-right"
            class="btn btn-sm btn-outline-secondary">
            Right
        </button>

        <button type="button" id="editor-align-justify"
            class="btn btn-sm btn-outline-secondary">
            Justify
        </button>

        <span class="storyforge-toolbar-divider"></span>

        <button type="button" id="editor-first-line-indent"
            class="btn btn-sm btn-outline-secondary">
            First-line indent
        </button>

        <button type="button" id="editor-indent"
            class="btn btn-sm btn-outline-secondary">
            Indent
        </button>

        <button type="button" id="editor-outdent"
            class="btn btn-sm btn-outline-secondary">
            Outdent
        </button>

        <select id="editor-line-spacing"
            class="form-select form-select-sm w-auto"
            aria-label="Line spacing">
            <option value="">Default spacing</option>
            <option value="1">Single</option>
            <option value="1.5">1.5 lines</option>
            <option value="2">Double</option>
        </select>

        <span class="storyforge-toolbar-divider"></span>

        <button type="button" id="editor-undo"
            class="btn btn-sm btn-outline-secondary">
            Undo
        </button>

        <button type="button" id="editor-redo"
            class="btn btn-sm btn-outline-secondary">
            Redo
        </button>
    `;

    return toolbar;
}


// ============================================================
// FORMATTING CONTROLS
// ============================================================

function connectToolbar(toolbar, editor) {
    const listeners = [];

    function listen(element, eventName, handler) {
        if (!element) return;

        element.addEventListener(eventName, handler);

        listeners.push(() => {
            element.removeEventListener(eventName, handler);
        });
    }

    function button(id, command) {
        const element = toolbar.querySelector(`#${id}`);

        if (!element) return;

        listen(element, "click", () => {
            command();
            updateToolbarState();
        });
    }

    // --------------------------------------------------------
    // INLINE FORMATTING
    // --------------------------------------------------------

    button("editor-bold", () => {
        editor.chain().focus().toggleBold().run();
    });

    button("editor-italic", () => {
        editor.chain().focus().toggleItalic().run();
    });

    button("editor-underline", () => {
        editor.chain().focus().toggleUnderline().run();
    });

    // --------------------------------------------------------
    // TEXT ALIGNMENT
    // --------------------------------------------------------

    for (const alignment of [
        "left",
        "center",
        "right",
        "justify"
    ]) {
        button(`editor-align-${alignment}`, () => {
            editor.chain()
                .focus()
                .setTextAlign(alignment)
                .run();
        });
    }

    // --------------------------------------------------------
    // PARAGRAPH FORMATTING
    // --------------------------------------------------------

    function getParagraphAttributes() {
        return editor.getAttributes("paragraph");
    }

    function updateParagraph(attributes) {
        editor.chain()
            .focus()
            .updateAttributes("paragraph", attributes)
            .run();
    }

    function getIndentValue(value) {
        const parsed = Number.parseFloat(value);

        return Number.isFinite(parsed)
            ? parsed
            : 0;
    }

    button("editor-first-line-indent", () => {
        const attrs = getParagraphAttributes();

        const current = getIndentValue(
            attrs.textIndent
        );

        updateParagraph({
            textIndent: current > 0
                ? null
                : "2em"
        });
    });

    button("editor-indent", () => {
        const attrs = getParagraphAttributes();

        const current = getIndentValue(
            attrs.marginLeft
        );

        updateParagraph({
            marginLeft: `${current + 2}em`
        });
    });

    button("editor-outdent", () => {
        const attrs = getParagraphAttributes();

        const current = getIndentValue(
            attrs.marginLeft
        );

        updateParagraph({
            marginLeft:
                current <= 2
                    ? null
                    : `${current - 2}em`
        });
    });

    const lineSpacing = toolbar.querySelector(
        "#editor-line-spacing"
    );

    listen(lineSpacing, "change", () => {
        updateParagraph({
            lineHeight: lineSpacing.value || null
        });
    });

    // --------------------------------------------------------
    // HISTORY
    // --------------------------------------------------------

    button("editor-undo", () => {
        editor.chain().focus().undo().run();
    });

    button("editor-redo", () => {
        editor.chain().focus().redo().run();
    });

    // --------------------------------------------------------
    // TOOLBAR STATE
    // --------------------------------------------------------

    function setButtonState(id, active) {
        const element = toolbar.querySelector(`#${id}`);

        if (!element) return;

        element.classList.toggle("active", active);

        element.setAttribute(
            "aria-pressed",
            String(active)
        );
    }

    function updateToolbarState() {
        if (editor.isDestroyed) return;

        setButtonState(
            "editor-bold",
            editor.isActive("bold")
        );

        setButtonState(
            "editor-italic",
            editor.isActive("italic")
        );

        setButtonState(
            "editor-underline",
            editor.isActive("underline")
        );

        for (const alignment of [
            "left",
            "center",
            "right",
            "justify"
        ]) {
            setButtonState(
                `editor-align-${alignment}`,
                editor.isActive({
                    textAlign: alignment
                })
            );
        }

        const attrs = getParagraphAttributes();

        if (lineSpacing) {
            lineSpacing.value =
                attrs.lineHeight || "";
        }

        const undoButton = toolbar.querySelector(
            "#editor-undo"
        );

        const redoButton = toolbar.querySelector(
            "#editor-redo"
        );

        if (undoButton) {
            undoButton.disabled =
                !editor.can().undo();
        }

        if (redoButton) {
            redoButton.disabled =
                !editor.can().redo();
        }
    }

    editor.on(
        "selectionUpdate",
        updateToolbarState
    );

    editor.on(
        "transaction",
        updateToolbarState
    );

    updateToolbarState();

    return {
        destroy() {
            editor.off(
                "selectionUpdate",
                updateToolbarState
            );

            editor.off(
                "transaction",
                updateToolbarState
            );

            listeners.forEach(remove => remove());
        }
    };
}


// ============================================================
// FIND ACTIVE SCENE
// ============================================================

function getActiveScene(editor) {
    const { $from } = editor.state.selection;

    for (
        let depth = $from.depth;
        depth >= 0;
        depth--
    ) {
        const node = $from.node(depth);

        if (node.type.name === "manuscriptScene") {
            return {
                chapterId: node.attrs.chapterId,
                sceneId: node.attrs.sceneId
            };
        }
    }

    return null;
}


// ============================================================
// MULTI-LEVEL EDITOR
// ============================================================

export function renderMultiEditor(
    container,
    project,
    {
        mode = "book",
        chapterId = null,
        onBack = () => {}
    } = {}
) {
    const allChapters = project.chapters || [];

    const chapters = mode === "chapter"
        ? allChapters.filter(
            chapter => chapter.id === chapterId
        )
        : allChapters;

    const chapterNumbers = new Map(
        allChapters.map((chapter, index) => [
            chapter.id,
            index + 1
        ])
    );

    const currentChapter = chapters[0];

    const heading = mode === "book"
        ? project.title
        : currentChapter?.title || "Chapter Editor";

    // --------------------------------------------------------
    // PAGE LAYOUT
    // --------------------------------------------------------

    container.innerHTML = `
        <div class="
            container-fluid py-4 px-3 px-lg-4
            storyforge-multi-editor
        ">
            <div class="
                d-flex justify-content-between
                align-items-center mb-4 gap-3
            ">
                <div>
                    <h2 class="mb-1">
                        ${escapeHTML(heading)}
                    </h2>

                    <p class="text-muted mb-0">
                        ${mode === "book"
                            ? "Book Editor"
                            : "Chapter Editor"}
                    </p>
                </div>

                <button
                    type="button"
                    class="btn btn-outline-secondary"
                    id="back-from-multi-editor"
                >
                    Back
                </button>
            </div>

            <button
                type="button"
                class="
                    btn btn-outline-secondary
                    d-lg-none mb-3
                "
                id="toggle-manuscript-outline"
                aria-expanded="false"
                aria-controls="multi-editor-sidebar"
            >
                ☰ Manuscript Navigation
            </button>

            <div class="row g-4">
                <aside
                    class="col-12 col-lg-3 d-none d-lg-block"
                    id="multi-editor-sidebar"
                >
                    <div
                        id="multi-editor-outline"
                        class="storyforge-outline-container"
                    ></div>
                </aside>

                <main class="col-12 col-lg-9">
                    <div id="multi-editor-toolbar"></div>

                    <div class="storyforge-manuscript-paper">
                        <div id="multi-editor-content"></div>
                    </div>

                    <div class="
                        d-flex justify-content-end
                        align-items-center mt-3
                    ">
                        <span
                            id="multi-editor-save-status"
                            class="small text-muted"
                            role="status"
                            aria-live="polite"
                        >
                            Saved
                        </span>
                    </div>
                </main>
            </div>
        </div>
    `;

    const content = container.querySelector(
        "#multi-editor-content"
    );

    const toolbarContainer = container.querySelector(
        "#multi-editor-toolbar"
    );

    const sidebar = container.querySelector(
        "#multi-editor-sidebar"
    );

    const outlineContainer = container.querySelector(
        "#multi-editor-outline"
    );

    const mobileToggle = container.querySelector(
        "#toggle-manuscript-outline"
    );

    const saveStatus = container.querySelector(
        "#multi-editor-save-status"
    );

    const backButton = container.querySelector(
        "#back-from-multi-editor"
    );

    // --------------------------------------------------------
    // SAVING
    // --------------------------------------------------------

    const pendingScenes = new Map();

    let saveTimeout = null;
    let destroyed = false;
    let saving = false;

    function sceneKey(chapterId, sceneId) {
        return JSON.stringify([
            chapterId,
            sceneId
        ]);
    }

    function setSaveStatus(message, isError = false) {
        saveStatus.textContent = message;

        saveStatus.classList.toggle(
            "text-danger",
            isError
        );
    }

    function savePendingScenes() {
        if (
            saving ||
            pendingScenes.size === 0
        ) {
            return;
        }

        saving = true;
        setSaveStatus("Saving...");

        try {
            for (const [key, scene] of pendingScenes) {
                const saved = updateSceneContent(
                    project.id,
                    scene.chapterId,
                    scene.sceneId,
                    scene.html
                );

                if (saved === false) {
                    throw new Error(
                        `Could not save scene ${scene.sceneId}`
                    );
                }

                if (pendingScenes.get(key) === scene) {
                    pendingScenes.delete(key);
                }
            }

            setSaveStatus(
                pendingScenes.size === 0
                    ? "Saved"
                    : "Unsaved changes"
            );
        } catch (error) {
            console.error(
                "StoryForge manuscript save failed:",
                error
            );

            setSaveStatus(
                "Save failed",
                true
            );

            throw error;
        } finally {
            saving = false;
        }
    }

    function scheduleSave() {
        clearTimeout(saveTimeout);

        saveTimeout = setTimeout(() => {
            saveTimeout = null;

            try {
                savePendingScenes();
            } catch {
                // Keep changes queued for another attempt.
            }
        }, 1000);
    }

    function queueChangedScenes(changedScenes) {
        for (const scene of changedScenes) {
            const key = sceneKey(
                scene.chapterId,
                scene.sceneId
            );

            pendingScenes.set(key, scene);
        }

        if (changedScenes.length > 0) {
            setSaveStatus("Unsaved changes");
            scheduleSave();
        }
    }

    // --------------------------------------------------------
    // CREATE CONTINUOUS EDITOR
    // --------------------------------------------------------

    let continuousInstance = null;

    if (chapters.length > 0) {
        continuousInstance = createContinuousEditor({
            element: content,
            chapters,
            chapterNumbers,

            onUpdate({ changedScenes }) {
                queueChangedScenes(changedScenes);
            }
        });
    } else {
        content.innerHTML = `
            <p class="text-muted text-center">
                No chapters available to edit.
            </p>
        `;
    }

    const editor = continuousInstance?.editor || null;

    // --------------------------------------------------------
    // SHARED TOOLBAR
    // --------------------------------------------------------

    let toolbarConnection = null;

    if (editor) {
        const toolbar = createToolbar();

        toolbarContainer.appendChild(toolbar);

        toolbarConnection = connectToolbar(
            toolbar,
            editor
        );
    }

    // --------------------------------------------------------
    // MANUSCRIPT NAVIGATION
    // --------------------------------------------------------

    function findChapterElement(targetChapterId) {
        return Array.from(
            content.querySelectorAll(
                "[data-manuscript-chapter]"
            )
        ).find(
            element =>
                element.dataset.chapterId ===
                targetChapterId
        ) || null;
    }

    function findSceneElement(
        targetChapterId,
        targetSceneId
    ) {
        return Array.from(
            content.querySelectorAll(
                "[data-manuscript-scene]"
            )
        ).find(
            element =>
                element.dataset.chapterId ===
                    targetChapterId &&
                element.dataset.sceneId ===
                    targetSceneId
        ) || null;
    }

    /*
     * Resolve a navigation target using both:
     *
     * 1. TipTap document position
     * 2. Rendered HTML element
     *
     * Document positions provide an independent way
     * to find chapters and scenes if a selector fails.
     */

    function findNavigationPosition(selection) {
        if (!continuousInstance) {
            return null;
        }

        if (selection.type === "scene") {
            return continuousInstance.findScenePosition(
                selection.chapterId,
                selection.sceneId
            );
        }

        return continuousInstance.findChapterPosition(
            selection.chapterId
        );
    }

    function findNavigationElement(selection) {
        if (selection.type === "scene") {
            return findSceneElement(
                selection.chapterId,
                selection.sceneId
            );
        }

        return findChapterElement(
            selection.chapterId
        );
    }

    function scrollToSection(selection) {
        if (
            !editor ||
            editor.isDestroyed ||
            !selection
        ) {
            return;
        }

        const position =
            findNavigationPosition(selection);

        const target =
            findNavigationElement(selection);

        if (position === null && !target) {
            console.warn(
                "StoryForge: Navigation target not found.",
                selection
            );

            return;
        }

        /*
         * Scroll to the rendered section if possible.
         *
         * Otherwise, use TipTap's document position
         * to calculate its screen coordinates.
         */

        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        } else if (position !== null) {
            try {
                const coords = editor.view.coordsAtPos(
                    Math.min(
                        position + 1,
                        editor.state.doc.content.size
                    )
                );

                const scrollTop =
                    window.scrollY +
                    coords.top -
                    100;

                window.scrollTo({
                    top: Math.max(0, scrollTop),
                    behavior: "smooth"
                });
            } catch (error) {
                console.warn(
                    "StoryForge: Could not scroll to section.",
                    error
                );
            }
        }

        /*
         * Highlight the clicked outline item.
         *
         * We deliberately don't force editor focus:
         * sidebar navigation should not move the
         * author's text cursor unnecessarily.
         */

        if (selection.type === "scene") {
            outline.setActiveScene(
                selection.chapterId,
                selection.sceneId
            );
        } else {
            outline.setActiveChapter(
                selection.chapterId
            );
        }

        // Close the mobile outline after navigation.

        if (window.innerWidth < 992) {
            sidebar.classList.add("d-none");

            mobileToggle.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

    const outline = renderManuscriptOutline(
        outlineContainer,
        project,
        {
            mode,
            chapterId,

            onNavigate(selection) {
                scrollToSection(selection);
            }
        }
    );

    // --------------------------------------------------------
    // ACTIVE SCENE HIGHLIGHTING
    // --------------------------------------------------------

    function updateActiveScene() {
        if (
            !editor ||
            editor.isDestroyed
        ) {
            return;
        }

        const active = getActiveScene(editor);

        if (!active) {
            return;
        }

        outline.setActiveScene(
            active.chapterId,
            active.sceneId
        );
    }

    if (editor) {
        editor.on(
            "selectionUpdate",
            updateActiveScene
        );

        editor.on(
            "focus",
            updateActiveScene
        );
    }

    const firstChapterWithScenes = chapters.find(
        chapter => chapter.scenes?.length > 0
    );

    if (firstChapterWithScenes) {
        outline.setActiveScene(
            firstChapterWithScenes.id,
            firstChapterWithScenes.scenes[0].id
        );
    } else if (chapters.length > 0) {
        outline.setActiveChapter(
            chapters[0].id
        );
    }

    // --------------------------------------------------------
    // MOBILE NAVIGATION
    // --------------------------------------------------------

    function toggleMobileOutline() {
        const isHidden = sidebar.classList.contains(
            "d-none"
        );

        sidebar.classList.toggle(
            "d-none",
            !isHidden
        );

        mobileToggle.setAttribute(
            "aria-expanded",
            String(isHidden)
        );
    }

    mobileToggle.addEventListener(
        "click",
        toggleMobileOutline
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    function destroy() {
        if (destroyed) {
            return;
        }

        clearTimeout(saveTimeout);
        saveTimeout = null;

        /*
         * Preserve pending changes before leaving.
         *
         * If saving fails, do not destroy the editor.
         */

        savePendingScenes();

        if (pendingScenes.size > 0) {
            throw new Error(
                "Manuscript has unsaved changes."
            );
        }

        if (editor) {
            editor.off(
                "selectionUpdate",
                updateActiveScene
            );

            editor.off(
                "focus",
                updateActiveScene
            );
        }

        toolbarConnection?.destroy();
        continuousInstance?.destroy();

        outline.destroy();

        mobileToggle.removeEventListener(
            "click",
            toggleMobileOutline
        );

        backButton.removeEventListener(
            "click",
            handleBack
        );

        destroyed = true;
    }

    // --------------------------------------------------------
    // BACK NAVIGATION
    // --------------------------------------------------------

    function handleBack() {
        try {
            destroy();
            onBack();
        } catch (error) {
            console.error(
                "StoryForge editor navigation blocked:",
                error
            );

            window.alert(
                "Your manuscript has unsaved changes. " +
                "Please check the console before leaving."
            );
        }
    }

    backButton.addEventListener(
        "click",
        handleBack
    );

    return {
        destroy
    };
}
