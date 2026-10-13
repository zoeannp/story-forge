
import { createStoryForgeEditor } from "./editor.js";
import { updateSceneContent } from "./projects.js";


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

function createToolbar() {
    const toolbar = document.createElement("div");

    toolbar.className =
        "storyforge-multi-toolbar d-flex flex-wrap gap-2 mb-2";

    toolbar.innerHTML = `
        <button type="button" id="editor-bold"
            class="btn btn-sm btn-outline-secondary"
            title="Bold">B</button>

        <button type="button" id="editor-italic"
            class="btn btn-sm btn-outline-secondary"
            title="Italic"><em>I</em></button>

        <button type="button" id="editor-underline"
            class="btn btn-sm btn-outline-secondary"
            title="Underline"><u>U</u></button>

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
    sceneIndex,
    instances
}) {
    const section = document.createElement("section");

    section.className = "storyforge-editable-scene mb-4";

    section.dataset.sceneId = scene.id;

    // Scene titles are internal navigation labels.
    // They are not inserted into the manuscript itself.
    section.innerHTML = `
        <div class="d-flex justify-content-between
                    align-items-center mb-2">
            <span class="text-muted small">
                ${escapeHTML(scene.title || "Untitled Scene")}
            </span>

            <span class="small text-muted"
                  data-save-status>Saved</span>
        </div>

        <div data-toolbar></div>

        <div class="border rounded bg-white text-dark"
             data-editor></div>

        <div class="d-flex justify-content-between
                    align-items-center mt-2">
            <span class="small text-muted"
                  data-word-count></span>

            <button type="button"
                    class="btn btn-sm btn-outline-primary"
                    data-save-button>
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

/*
 * mode: "book" or "chapter"
 *
 * Book mode displays every chapter.
 * Chapter mode displays one selected chapter.
 *
 * Both modes save to the existing scene records.
 */
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

    container.innerHTML = `
        <div class="container py-4
                    storyforge-multi-editor">

            <div class="d-flex justify-content-between
                        align-items-center mb-4 gap-3">

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

                <button type="button"
                        class="btn btn-outline-secondary"
                        id="back-from-multi-editor">
                    Back
                </button>
            </div>

            <div id="multi-editor-content"></div>
        </div>
    `;

    const content = container.querySelector(
        "#multi-editor-content"
    );

    for (const chapter of chapters) {
        const chapterSection =
            document.createElement("section");

        chapterSection.className =
            "storyforge-editable-chapter mb-5";

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

        scenes.forEach((scene, index) => {
            // Display a manuscript scene separator.
            // It is not part of either scene's saved HTML.
            if (index > 0) {
                const separator =
                    document.createElement("div");

                separator.className =
                    "text-center my-4";

                separator.textContent = "* * *";

                chapterSection.appendChild(separator);
            }

            const sceneSection = createSceneSection({
                projectId: project.id,
                chapter,
                scene,
                sceneIndex: index,
                instances
            });

            chapterSection.appendChild(sceneSection);
        });

        content.appendChild(chapterSection);
    }

    // ========================================================
    // CLEANUP
    // ========================================================

    let destroyed = false;

    function destroy() {
        if (destroyed) return;

        // Each editor saves pending changes before destruction.
        // Keep the instances available if saving throws.
        for (const instance of instances) {
            instance.destroy();
        }

        destroyed = true;
    }

    container.querySelector("#back-from-multi-editor")
        .addEventListener("click", () => {
            try {
                destroy();
                onBack();
            } catch (error) {
                console.error("Editor save failed:", error);
                window.alert(
                    "A scene could not be saved. " +
                    "Please check the console before leaving."
                );
            }
        });

    return { destroy };
}
