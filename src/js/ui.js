
/*
 * StoryForge User Interface
 *
 * Builds the HTML views used throughout the application.
 *
 * Views:
 * - Project creation
 * - Project dashboard
 * - Project details and manuscript actions
 * - Chapter details
 * - Scene editor
 *
 * Manuscript viewing and DOCX export are connected in app.js.
 */

import {
    countSceneWords,
    countChapterWords,
    countProjectWords
} from "./wordCount.js";

import headingLogo from "../images/heading-logo.png";


// ============================================================
// DISPLAY HELPERS
// ============================================================

/*
 * Format word counts for display.
 *
 * 1    -> 1 word
 * 2500 -> 2,500 words
 */
function formatWordCount(count) {
    const label = count === 1 ? "word" : "words";

    return `${count.toLocaleString()} ${label}`;
}

/*
 * Escape user-provided text before inserting it into HTML.
 * This protects titles and attributes from HTML injection.
 */
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
// APPLICATION NAVIGATION
// ============================================================

/*
 * Shared navigation bar.
 *
 * app.js handles clicks on .storyforge-home.
 */
function renderNavbar() {
    return `
        <nav class="storyforge-nav">
            <div class="container">

                <button
                    class="storyforge-home"
                    type="button"
                    aria-label="Return to StoryForge dashboard"
                    title="StoryForge Dashboard"
                >
                    <img
                        class="storyforge-nav-logo"
                        src="${headingLogo}"
                        alt="StoryForge"
                    >
                </button>

            </div>
        </nav>
    `;
}


// ============================================================
// REUSABLE ACTION MENU
// ============================================================

/*
 * Build a Rename/Delete menu.
 *
 * The original action classes and data attributes are
 * preserved so existing app.js listeners continue working.
 */
function renderActionMenu(type, id) {
    const safeId = escapeHTML(id);
    const safeType = escapeHTML(type);

    return `
        <details class="position-relative">

            <summary
                class="btn btn-sm btn-outline-secondary"
                title="${safeType} actions"
                aria-label="${safeType} actions"
            >
                ⋮
            </summary>

            <div
                class="
                    position-absolute
                    end-0
                    mt-2
                    p-2
                    bg-body
                    border
                    rounded
                    shadow-sm
                "
                style="min-width: 10rem; z-index: 10;"
            >

                <!-- Rename the selected item. -->
                <button
                    class="
                        btn btn-sm btn-outline-secondary
                        w-100 text-start mb-2
                        rename-${safeType}
                    "
                    type="button"
                    data-${safeType}-id="${safeId}"
                >
                    Rename
                </button>

                <!-- Delete the selected item. -->
                <button
                    class="
                        btn btn-sm btn-outline-danger
                        w-100 text-start
                        delete-${safeType}
                    "
                    type="button"
                    data-${safeType}-id="${safeId}"
                >
                    Delete
                </button>

            </div>
        </details>
    `;
}


// ============================================================
// PROJECT CREATION VIEW
// ============================================================

/*
 * Render the form used to create a new project.
 */
export function renderCreateProjectForm(container) {
    container.innerHTML = `
        ${renderNavbar()}

        <div class="container mt-4">

            <form id="create-project-form">

                <div class="mb-3">

                    <label
                        for="project-title"
                        class="form-label"
                    >
                        Project Title
                    </label>

                    <input
                        type="text"
                        id="project-title"
                        class="form-control"
                        placeholder="Enter project title"
                        required
                    >

                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Create Project
                </button>

            </form>

            <!-- Project cards are rendered here. -->
            <div id="project-list"></div>

        </div>
    `;
}


// ============================================================
// PROJECT LIST VIEW
// ============================================================

/*
 * Render all projects on the dashboard.
 *
 * Each project includes:
 * - Title
 * - Chapter count
 * - Word count
 * - Rename/Delete menu
 */
export function renderProjectList(container, projects) {
    if (projects.length === 0) {
        container.innerHTML = `
            <p class="text-muted mt-4">
                No projects yet. Create your first project above.
            </p>
        `;

        return;
    }

    container.innerHTML = `
        <div class="mt-5">

            <h2>Your Projects</h2>

            <div class="row g-3 mt-2">

                ${projects.map(project => {
                    const wordCount = countProjectWords(project);

                    return `
                        <div class="col-md-6 col-lg-4">

                            <div class="card h-100">

                                <div class="card-body">

                                    <div
                                        class="
                                            d-flex
                                            justify-content-between
                                            align-items-start
                                            gap-3
                                        "
                                    >

                                        <!-- Open the project. -->
                                        <button
                                            class="
                                                btn p-0 border-0
                                                bg-transparent text-start
                                                flex-grow-1 project-card
                                            "
                                            data-project-id="${escapeHTML(project.id)}"
                                            type="button"
                                        >

                                            <h3 class="card-title h5">
                                                ${escapeHTML(project.title)}
                                            </h3>

                                            <p class="card-text text-muted mb-1">
                                                ${project.chapters.length} chapters
                                            </p>

                                            <p class="card-text text-muted mb-0">
                                                ${formatWordCount(wordCount)}
                                            </p>

                                        </button>

                                        ${renderActionMenu(
                                            "project",
                                            project.id
                                        )}

                                    </div>

                                </div>

                            </div>

                        </div>
                    `;
                }).join("")}

            </div>

        </div>
    `;
}


// ============================================================
// PROJECT VIEW
// ============================================================

/*
 * Render the selected project.
 *
 * Includes:
 * - Project information
 * - Full manuscript viewing button
 * - DOCX manuscript download button
 * - Chapter creation form
 * - Existing chapter cards and actions
 *
 * app.js connects the manuscript buttons to their functions.
 */
export function renderProjectView(container, project) {
    const projectWordCount = countProjectWords(project);

    container.innerHTML = `
        ${renderNavbar()}

        <div class="container mt-4">

            <!-- Return to the project dashboard. -->
            <button
                id="back-to-projects"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to Projects
            </button>


            <!-- PROJECT INFORMATION -->

            <h1>${escapeHTML(project.title)}</h1>

            <p class="text-muted">
                ${project.chapters.length} chapters
                •
                ${formatWordCount(projectWordCount)}
            </p>


            <!-- ============================================== -->
            <!-- MANUSCRIPT ACTIONS -->
            <!-- ============================================== -->

            <!--
                These controls use the same project data.

                View Full Manuscript:
                Displays all chapters and scenes together.

                Download Manuscript:
                Exports the complete manuscript as DOCX.

                Neither action modifies localStorage.
            -->

            <div class="d-flex flex-wrap gap-2 mb-4">

                <button
                    id="view-manuscript"
                    class="btn btn-primary"
                    type="button"
                >
                    View Full Manuscript
                </button>

                <button
                    id="download-manuscript"
                    class="btn btn-outline-primary"
                    type="button"
                >
                    Download Manuscript (.docx)
                </button>

            </div>

            <hr>


            <!-- ============================================== -->
            <!-- CHAPTER CREATION -->
            <!-- ============================================== -->

            <form
                id="create-chapter-form"
                class="mt-4"
            >

                <div class="mb-3">

                    <label
                        for="chapter-title"
                        class="form-label"
                    >
                        Chapter Title
                    </label>

                    <input
                        type="text"
                        id="chapter-title"
                        class="form-control"
                        placeholder="Enter chapter title"
                        required
                    >

                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Add Chapter
                </button>

            </form>


            <!-- ============================================== -->
            <!-- CHAPTER LIST -->
            <!-- ============================================== -->

            <div class="mt-5">

                <h2>Chapters</h2>

                ${
                    project.chapters.length === 0

                        ? `
                            <p class="text-muted">
                                No chapters yet. Add your first chapter above.
                            </p>
                        `

                        : `
                            <div class="row g-3 mt-2">

                                ${project.chapters.map(chapter => {
                                    const chapterWordCount =
                                        countChapterWords(chapter);

                                    return `
                                        <div class="col-12">

                                            <div class="card">

                                                <div class="card-body">

                                                    <div
                                                        class="
                                                            d-flex
                                                            justify-content-between
                                                            align-items-start
                                                            gap-3
                                                        "
                                                    >

                                                        <!-- Open the chapter. -->
                                                        <button
                                                            class="
                                                                btn p-0 border-0
                                                                bg-transparent
                                                                text-start
                                                                flex-grow-1
                                                                chapter-card
                                                            "
                                                            data-chapter-id="${escapeHTML(chapter.id)}"
                                                            type="button"
                                                        >

                                                            <h3 class="card-title h5">
                                                                ${escapeHTML(chapter.title)}
                                                            </h3>

                                                            <p class="card-text text-muted mb-1">
                                                                ${chapter.scenes.length} scenes
                                                            </p>

                                                            <p class="card-text text-muted mb-0">
                                                                ${formatWordCount(
                                                                    chapterWordCount
                                                                )}
                                                            </p>

                                                        </button>

                                                        ${renderActionMenu(
                                                            "chapter",
                                                            chapter.id
                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    `;
                                }).join("")}

                            </div>
                        `
                }

            </div>

        </div>
    `;
}


// ============================================================
// CHAPTER VIEW
// ============================================================

/*
 * Render the selected chapter and its scenes.
 *
 * Includes:
 * - Chapter information
 * - Scene creation form
 * - Scene cards
 * - Rename/Delete actions
 */
export function renderChapterView(container, project, chapter) {
    const chapterWordCount = countChapterWords(chapter);

    container.innerHTML = `
        ${renderNavbar()}

        <div class="container mt-4">

            <!-- Return to the containing project. -->
            <button
                id="back-to-project"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to ${escapeHTML(project.title)}
            </button>


            <!-- CHAPTER INFORMATION -->

            <h1>${escapeHTML(chapter.title)}</h1>

            <p class="text-muted">
                ${chapter.scenes.length} scenes
                •
                ${formatWordCount(chapterWordCount)}
            </p>

            <hr>


            <!-- SCENE CREATION -->

            <form
                id="create-scene-form"
                class="mt-4"
            >

                <div class="mb-3">

                    <label
                        for="scene-title"
                        class="form-label"
                    >
                        Scene Title
                    </label>

                    <input
                        type="text"
                        id="scene-title"
                        class="form-control"
                        placeholder="Enter scene title"
                        required
                    >

                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    Add Scene
                </button>

            </form>


            <!-- SCENE LIST -->

            <div class="mt-5">

                <h2>Scenes</h2>

                ${
                    chapter.scenes.length === 0

                        ? `
                            <p class="text-muted">
                                No scenes yet. Add your first scene above.
                            </p>
                        `

                        : `
                            <div class="row g-3 mt-2">

                                ${chapter.scenes.map(scene => {
                                    const sceneWordCount =
                                        countSceneWords(scene.content);

                                    return `
                                        <div class="col-12">

                                            <div class="card">

                                                <div class="card-body">

                                                    <div
                                                        class="
                                                            d-flex
                                                            justify-content-between
                                                            align-items-start
                                                            gap-3
                                                        "
                                                    >

                                                        <!-- Open the scene editor. -->
                                                        <button
                                                            class="
                                                                btn p-0 border-0
                                                                bg-transparent
                                                                text-start
                                                                flex-grow-1
                                                                scene-card
                                                            "
                                                            data-scene-id="${escapeHTML(scene.id)}"
                                                            type="button"
                                                        >

                                                            <h3 class="card-title h5">
                                                                ${escapeHTML(scene.title)}
                                                            </h3>

                                                            <p class="card-text text-muted mb-0">
                                                                ${formatWordCount(
                                                                    sceneWordCount
                                                                )}
                                                            </p>

                                                        </button>

                                                        ${renderActionMenu(
                                                            "scene",
                                                            scene.id
                                                        )}

                                                    </div>

                                                </div>

                                            </div>

                                        </div>
                                    `;
                                }).join("")}

                            </div>
                        `
                }

            </div>

        </div>
    `;
}


// ============================================================
// SCENE EDITOR SIDEBAR
// ============================================================

/*
 * Render the desktop chapter/scene navigation.
 *
 * Existing classes and IDs are retained so app.js can
 * handle navigation between scenes and chapters.
 */
function renderEditorSidebar(project, chapter, scene) {
    return `
        <aside
            class="col-lg-3 d-none d-lg-block"
            id="editor-sidebar"
        >

            <div class="card">

                <div class="card-body">

                    <h2 class="h5 mb-1">
                        ${escapeHTML(project.title)}
                    </h2>

                    <p class="text-muted small mb-4">
                        ${formatWordCount(countProjectWords(project))}
                    </p>

                    <div id="editor-sidebar-navigation">

                        ${project.chapters.map(sidebarChapter => {
                            const chapterWordCount =
                                countChapterWords(sidebarChapter);

                            const isCurrentChapter =
                                sidebarChapter.id === chapter.id;

                            return `
                                <div class="mb-4">

                                    <!-- Chapter navigation. -->
                                    <button
                                        class="
                                            btn btn-sm w-100 text-start
                                            editor-sidebar-chapter
                                            ${isCurrentChapter ? "fw-bold" : ""}
                                        "
                                        type="button"
                                        data-chapter-id="${escapeHTML(sidebarChapter.id)}"
                                    >
                                        ${escapeHTML(sidebarChapter.title)}
                                    </button>

                                    <div class="text-muted small px-2 mb-2">
                                        ${formatWordCount(chapterWordCount)}
                                    </div>

                                    ${
                                        sidebarChapter.scenes.length === 0

                                            ? `
                                                <p
                                                    class="
                                                        text-muted small
                                                        fst-italic px-2 mb-0
                                                    "
                                                >
                                                    No scenes
                                                </p>
                                            `

                                            : `
                                                <div
                                                    class="
                                                        list-group
                                                        list-group-flush
                                                    "
                                                >

                                                    ${sidebarChapter.scenes.map(
                                                        sidebarScene => {
                                                            const isCurrentScene =
                                                                sidebarScene.id === scene.id;

                                                            const wordCount =
                                                                countSceneWords(
                                                                    sidebarScene.content
                                                                );

                                                            return `
                                                                <button
                                                                    class="
                                                                        list-group-item
                                                                        list-group-item-action
                                                                        editor-sidebar-scene
                                                                        ${
                                                                            isCurrentScene
                                                                                ? "active"
                                                                                : ""
                                                                        }
                                                                    "
                                                                    type="button"
                                                                    data-chapter-id="${escapeHTML(sidebarChapter.id)}"
                                                                    data-scene-id="${escapeHTML(sidebarScene.id)}"
                                                                    ${
                                                                        isCurrentScene
                                                                            ? 'aria-current="true"'
                                                                            : ""
                                                                    }
                                                                >

                                                                    <div>
                                                                        ${escapeHTML(sidebarScene.title)}
                                                                    </div>

                                                                    <small
                                                                        class="${
                                                                            isCurrentScene
                                                                                ? ""
                                                                                : "text-muted"
                                                                        }"
                                                                    >
                                                                        ${formatWordCount(wordCount)}
                                                                    </small>

                                                                </button>
                                                            `;
                                                        }
                                                    ).join("")}

                                                </div>
                                            `
                                    }

                                </div>
                            `;
                        }).join("")}

                    </div>

                </div>

            </div>

        </aside>
    `;
}


// ============================================================
// SCENE EDITOR TOOLBAR
// ============================================================

/*
 * Build the rich-text formatting toolbar.
 *
 * All existing button IDs are preserved for the TipTap
 * editor event handlers.
 */
function renderEditorToolbar() {
    return `
        <div
            id="scene-editor-toolbar"
            class="d-flex flex-wrap gap-2 mb-3"
            role="toolbar"
            aria-label="Scene formatting toolbar"
        >

            <!-- BASIC TEXT FORMATTING -->

            <div
                class="btn-group"
                role="group"
                aria-label="Text formatting"
            >

                <button
                    id="editor-bold"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Bold"
                    aria-label="Bold"
                >
                    <strong>B</strong>
                </button>

                <button
                    id="editor-italic"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Italic"
                    aria-label="Italic"
                >
                    <em>I</em>
                </button>

                <button
                    id="editor-underline"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Underline"
                    aria-label="Underline"
                >
                    <u>U</u>
                </button>

            </div>


            <!-- TEXT ALIGNMENT -->

            <div
                class="btn-group"
                role="group"
                aria-label="Text alignment"
            >

                <button
                    id="editor-align-left"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Align Left"
                >
                    Left
                </button>

                <button
                    id="editor-align-center"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Align Centre"
                >
                    Centre
                </button>

                <button
                    id="editor-align-right"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Align Right"
                >
                    Right
                </button>

                <button
                    id="editor-align-justify"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Justify"
                >
                    Justify
                </button>

            </div>


            <!-- PARAGRAPH INDENTATION -->

            <div
                class="btn-group"
                role="group"
                aria-label="Paragraph indentation"
            >

                <button
                    id="editor-first-line-indent"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="First-line indent"
                >
                    First Line
                </button>

                <button
                    id="editor-indent"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Increase paragraph indent"
                >
                    Indent
                </button>

                <button
                    id="editor-outdent"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Decrease paragraph indent"
                >
                    Outdent
                </button>

            </div>


            <!-- LINE SPACING -->

            <div
                class="input-group"
                style="width: auto;"
            >

                <label
                    class="input-group-text"
                    for="editor-line-spacing"
                >
                    Line Spacing
                </label>

                <select
                    id="editor-line-spacing"
                    class="form-select"
                    aria-label="Line spacing"
                >

                    <option value="">Normal</option>
                    <option value="1">1.0</option>
                    <option value="1.15">1.15</option>
                    <option value="1.5">1.5</option>
                    <option value="2">2.0</option>

                </select>

            </div>


            <!-- UNDO AND REDO -->

            <div
                class="btn-group"
                role="group"
                aria-label="Editor history"
            >

                <button
                    id="editor-undo"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Undo"
                >
                    Undo
                </button>

                <button
                    id="editor-redo"
                    class="btn btn-outline-secondary"
                    type="button"
                    title="Redo"
                >
                    Redo
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// SCENE EDITOR VIEW
// ============================================================

/*
 * Render the scene editor.
 *
 * Includes:
 * - Back navigation
 * - Desktop chapter/scene sidebar
 * - Scene title and actions
 * - Rich-text formatting toolbar
 * - TipTap editor mount
 * - Autosave status
 * - Live word count
 * - Manual save button
 *
 * Editor creation and saving remain the responsibility of app.js.
 */
export function renderSceneView(
    container,
    project,
    chapter,
    scene
) {
    const sceneWordCount = countSceneWords(scene.content);

    container.innerHTML = `
        ${renderNavbar()}

        <div class="container-fluid mt-4 px-3 px-lg-4">

            <!-- BACK NAVIGATION -->

            <button
                id="back-to-chapter"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to ${escapeHTML(chapter.title)}
            </button>


            <!-- EDITOR LAYOUT -->

            <div class="row g-4">

                ${renderEditorSidebar(project, chapter, scene)}


                <!-- MAIN EDITOR COLUMN -->

                <main class="col-12 col-lg-9">

                    <!-- SCENE INFORMATION -->

                    <div
                        class="
                            d-flex
                            justify-content-between
                            align-items-start
                            gap-3
                        "
                    >

                        <div>

                            <h1>${escapeHTML(scene.title)}</h1>

                            <p class="text-muted">
                                ${escapeHTML(project.title)}
                                /
                                ${escapeHTML(chapter.title)}
                            </p>

                        </div>

                        ${renderActionMenu("scene", scene.id)}

                    </div>

                    <hr>


                    <!-- RICH-TEXT TOOLBAR -->

                    ${renderEditorToolbar()}


                    <!-- TIPTAP WRITING AREA -->

                    <div
                        id="scene-editor"
                        class="form-control"
                        style="min-height: 500px;"
                    ></div>


                    <!-- EDITOR FOOTER -->

                    <div
                        class="
                            d-flex
                            justify-content-between
                            align-items-center
                            mt-2
                        "
                    >

                        <!-- Autosave status. -->
                        <small
                            id="scene-save-status"
                            class="text-muted"
                        >
                            Saved
                        </small>

                        <!-- Live word count. -->
                        <small
                            id="scene-word-count"
                            class="text-muted"
                        >
                            ${formatWordCount(sceneWordCount)}
                        </small>

                    </div>


                    <!-- MANUAL SAVE -->

                    <button
                        id="save-scene"
                        class="btn btn-primary mt-3"
                        type="button"
                    >
                        Save Scene
                    </button>

                </main>

            </div>

        </div>
    `;
}
