
/*
 * StoryForge Multi-Level Editor
 *
 * Supports:
 * - Book editing
 * - Chapter editing
 * - Manuscript outline navigation
 * - Independent scene autosaving
 * - Scene separators
 * - Mobile navigation
 */

import { createStoryForgeEditor } from "./editor.js";
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
// EDITOR TOOLBAR
// ============================================================

/*
 * Keep the toolbar IDs expected by editor.js.
 * Each editor receives its own toolbar element.
 */
function createToolbar() {
    const toolbar = document.createElement("div");

    toolbar.className =
        "storyforge-multi-toolbar d-flex flex-wrap gap-2 mb-2";

    toolbar.setAttribute("role", "toolbar");
    toolbar.setAttribute("aria-label", "Scene formatting");

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
// CREATE ONE EDITABLE SCENE
// ============================================================

function createSceneSection({
    projectId,
    chapter,
    scene,
    instances
}) {
    const section = document.createElement("section");

    section.className = "storyforge-editable-scene mb-4";

    section.dataset.sceneId = scene.id;
    section.dataset.chapterId = chapter.id;

    // The scene title is a navigation label.
    // It is not saved as part of the manuscript text.
    section.innerHTML = `
        <div class="
            d-flex justify-content-between
            align-items-center mb-2 gap-2
        ">
            <span class="text-muted small">
                ${escapeHTML(scene.title || "Untitled Scene")}
            </span>

            <span class="small text-muted"
                data-save-status>
                Saved
            </span>
        </div>

        <div data-toolbar></div>

        <div
            class="border rounded bg-white text-dark"
            data-editor
        ></div>

        <div class="
            d-flex justify-content-between
            align-items-center mt-2 gap-2
        ">
            <span class="small text-muted"
                data-word-count>
            </span>

            <button
                type="button"
                class="btn btn-sm btn-outline-primary"
                data-save-button
            >
                Save Scene
            </button>
        </div>
    `;

    const toolbar = createToolbar();

    section.querySelector("[data-toolbar]")
        .appendChild(toolbar);

    const instance = createStoryForgeEditor({
        element: section.querySelector("[data-editor]"),

        content: scene.content || "<p></p>",

        toolbar,

        wordCountElement:
            section.querySelector("[data-word-count]"),

        saveStatusElement:
            section.querySelector("[data-save-status]"),

        saveButton:
            section.querySelector("[data-save-button]"),

        onSave(html) {
            const saved = updateSceneContent(
                projectId,
                chapter.id,
                scene.id,
                html
            );

            if (saved === false) {
                throw new Error(
                    `Could not save scene: ${scene.title}`
                );
            }
        }
    });

    instances.push(instance);

    return section;
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
    const instances = [];

    const chapters = mode === "chapter"
        ? project.chapters.filter(
            chapter => chapter.id === chapterId
        )
        : project.chapters;

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

            <!-- EDITOR HEADER -->

            <div class="
                d-flex justify-content-between
                align-items-center mb-4 gap-3
            ">
                <div>
                    <h2 class="mb-1">
                        ${escapeHTML(heading)}
                    </h2>

                    <p class="text-muted mb-0">
                        ${
                            mode === "book"
                                ? "Book Editor"
                                : "Chapter Editor"
                        }
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

            <!-- MOBILE NAVIGATION TOGGLE -->

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

            <!-- MAIN LAYOUT -->

            <div class="row g-4">

                <!-- MANUSCRIPT OUTLINE -->

                <aside
                    class="col-12 col-lg-3 d-none d-lg-block"
                    id="multi-editor-sidebar"
                >
                    <div
                        id="multi-editor-outline"
                        class="storyforge-outline-container"
                    ></div>
                </aside>

                <!-- EDITABLE MANUSCRIPT -->

                <main class="col-12 col-lg-9">
                    <div id="multi-editor-content"></div>
                </main>

            </div>
        </div>
    `;

    const content = container.querySelector(
        "#multi-editor-content"
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

    // --------------------------------------------------------
    // BUILD MANUSCRIPT
    // --------------------------------------------------------

    for (const chapter of chapters) {
        const chapterSection =
            document.createElement("section");

        chapterSection.className =
            "storyforge-editable-chapter mb-5";

        chapterSection.dataset.chapterId = chapter.id;

        const chapterHeading =
            document.createElement("h3");

        chapterHeading.className =
            "text-center mb-4";

        chapterHeading.textContent =
            chapter.title || "Untitled Chapter";

        chapterSection.appendChild(chapterHeading);

        const scenes = chapter.scenes || [];

        if (scenes.length === 0) {
            const emptyMessage =
                document.createElement("p");

            emptyMessage.className =
                "text-muted text-center";

            emptyMessage.textContent =
                "No scenes in this chapter yet.";

            chapterSection.appendChild(emptyMessage);
        }

        scenes.forEach(scene => {
            // Scene separators are display-only.
            // They are never saved into scene content.
            if (chapterSection.querySelector(
                ".storyforge-editable-scene"
            )) {
                const separator =
                    document.createElement("div");

                separator.className =
                    "text-center my-4 storyforge-scene-separator";

                separator.textContent = "* * *";

                chapterSection.appendChild(separator);
            }

            const sceneSection = createSceneSection({
                projectId: project.id,
                chapter,
                scene,
                instances
            });

            chapterSection.appendChild(sceneSection);
        });

        content.appendChild(chapterSection);
    }

    // --------------------------------------------------------
    // SCROLL NAVIGATION
    // --------------------------------------------------------

    function scrollToSection({
        type,
        chapterId: targetChapterId,
        sceneId: targetSceneId
    }) {
        const chapterSection = Array.from(
            content.querySelectorAll(
                ".storyforge-editable-chapter"
            )
        ).find(
            element =>
                element.dataset.chapterId === targetChapterId
        );

        if (!chapterSection) return;

        let target = chapterSection;

        if (type === "scene") {
            target = Array.from(
                chapterSection.querySelectorAll(
                    ".storyforge-editable-scene"
                )
            ).find(
                element =>
                    element.dataset.sceneId === targetSceneId
            );

            if (!target) return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        // Close the navigation panel on mobile.
        if (window.innerWidth < 992) {
            sidebar.classList.add("d-none");
            mobileToggle.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

    // --------------------------------------------------------
    // INITIALISE MANUSCRIPT OUTLINE
    // --------------------------------------------------------

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

    // Highlight the first scene initially.
    const firstChapterWithScenes = chapters.find(
        chapter => chapter.scenes?.length > 0
    );

    if (firstChapterWithScenes) {
        outline.setActiveScene(
            firstChapterWithScenes.id,
            firstChapterWithScenes.scenes[0].id
        );
    }

    // --------------------------------------------------------
    // ACTIVE SCENE WHEN EDITING
    // --------------------------------------------------------

    /*
     * When the author focuses a scene editor,
     * update the sidebar selection.
     *
     * Event delegation avoids adding one listener
     * to every individual scene section.
     */
    function handleEditorFocus(event) {
        const sceneSection = event.target.closest(
            ".storyforge-editable-scene"
        );

        if (!sceneSection || !content.contains(sceneSection)) {
            return;
        }

        outline.setActiveScene(
            sceneSection.dataset.chapterId,
            sceneSection.dataset.sceneId
        );
    }

    content.addEventListener(
        "focusin",
        handleEditorFocus
    );

    // --------------------------------------------------------
    // MOBILE SIDEBAR
    // --------------------------------------------------------

    function toggleMobileOutline() {
        const isHidden = sidebar.classList.contains(
            "d-none"
        );

        sidebar.classList.toggle("d-none", !isHidden);

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

    let destroyed = false;

    function destroy() {
        if (destroyed) return;

        // Save pending changes before removing listeners.
        for (const instance of instances) {
            instance.destroy();
        }

        outline.destroy();

        content.removeEventListener(
            "focusin",
            handleEditorFocus
        );

        mobileToggle.removeEventListener(
            "click",
            toggleMobileOutline
        );

        destroyed = true;
    }

    // --------------------------------------------------------
    // BACK NAVIGATION
    // --------------------------------------------------------

    container.querySelector("#back-from-multi-editor")
        .addEventListener("click", () => {
            try {
                destroy();
                onBack();
            } catch (error) {
                console.error(
                    "Editor save failed:",
                    error
                );

                window.alert(
                    "A scene could not be saved. " +
                    "Please check the console before leaving."
                );
            }
        });

    return {
        destroy
    };
}
