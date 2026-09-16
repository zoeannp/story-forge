// Builds the HTML views used by the StoryForge application.

import {
    countSceneWords,
    countChapterWords,
    countProjectWords
} from "./wordCount.js";


// ============================================================
// WORD COUNT DISPLAY HELPER
// ============================================================

/*
 * Format a word count for display in the interface.
 *
 * Examples:
 * 1      -> "1 word"
 * 2500   -> "2,500 words"
 */
function formatWordCount(count) {

    // Use the singular form when the count is exactly one.
    const label = count === 1
        ? "word"
        : "words";

    return `${count.toLocaleString()} ${label}`;
}


// ============================================================
// PROJECT CREATION VIEW
// ============================================================

// Render the form used to create a new project.
export function renderCreateProjectForm(container) {

    container.innerHTML = `
        <div class="container mt-5">

            <!-- Main StoryForge heading. -->
            <h1>StoryForge</h1>

            <!-- Form used to create a new writing project. -->
            <form id="create-project-form" class="mt-4">

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

            <!-- Project cards are rendered inside this container. -->
            <div id="project-list"></div>

        </div>
    `;
}


// ============================================================
// PROJECT LIST VIEW
// ============================================================

// Render project cards, or an empty state when no projects exist.
export function renderProjectList(container, projects) {

    // Show a message instead of project cards if storage is empty.
    if (projects.length === 0) {

        container.innerHTML = `
            <p class="text-muted mt-4">
                No projects yet. Create your first project above.
            </p>
        `;

        return;
    }


    /*
     * Each project card stores its project ID in a data attribute.
     * app.js uses this ID to determine which project was clicked.
     */
    container.innerHTML = `
        <div class="mt-5">

            <h2>Your Projects</h2>

            <div class="row g-3 mt-2">

                ${projects.map(project => {

                    // Calculate the total words across the entire project.
                    const wordCount = countProjectWords(project);

                    return `
                        <div class="col-md-6 col-lg-4">

                            <button
                                class="card h-100 w-100 text-start project-card"
                                data-project-id="${project.id}"
                                type="button"
                            >

                                <div class="card-body">

                                    <h3 class="card-title h5">
                                        ${project.title}
                                    </h3>

                                    <!-- Display project structure information. -->
                                    <p class="card-text text-muted mb-1">
                                        ${project.chapters.length} chapters
                                    </p>

                                    <!-- Display the project's total word count. -->
                                    <p class="card-text text-muted mb-0">
                                        ${formatWordCount(wordCount)}
                                    </p>

                                </div>

                            </button>

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

// Render the selected project, its chapters, and the chapter creation form.
export function renderProjectView(container, project) {

    // Calculate the total words across all chapters in this project.
    const projectWordCount = countProjectWords(project);

    container.innerHTML = `
        <div class="container mt-5">

            <!-- Return to the main project dashboard. -->
            <button
                id="back-to-projects"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to Projects
            </button>


            <!-- Display the selected project's information. -->
            <h1>${project.title}</h1>

            <p class="text-muted">
                ${project.chapters.length} chapters
                •
                ${formatWordCount(projectWordCount)}
            </p>

            <hr>


            <!-- Form used to create a new chapter inside this project. -->
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


            <!-- Chapter list section. -->
            <div class="mt-5">

                <h2>Chapters</h2>

                ${
                    project.chapters.length === 0

                        ? `
                            <!-- Show an empty state if the project has no chapters. -->
                            <p class="text-muted">
                                No chapters yet. Add your first chapter above.
                            </p>
                        `

                        : `
                            <!-- Render one clickable card for each chapter. -->
                            <div class="row g-3 mt-2">

                                ${project.chapters.map(chapter => {

                                    // Calculate the total words inside this chapter.
                                    const chapterWordCount =
                                        countChapterWords(chapter);

                                    return `
                                        <div class="col-12">

                                            <!--
                                                Store the chapter ID on the button so app.js
                                                knows which chapter the user selected.
                                            -->
                                            <button
                                                class="card h-100 w-100 text-start chapter-card"
                                                data-chapter-id="${chapter.id}"
                                                type="button"
                                            >

                                                <div class="card-body">

                                                    <h3 class="card-title h5">
                                                        ${chapter.title}
                                                    </h3>

                                                    <!-- Display scene count. -->
                                                    <p class="card-text text-muted mb-1">
                                                        ${chapter.scenes.length} scenes
                                                    </p>

                                                    <!-- Display chapter word count. -->
                                                    <p class="card-text text-muted mb-0">
                                                        ${formatWordCount(chapterWordCount)}
                                                    </p>

                                                </div>

                                            </button>

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

// Render the selected chapter, its scene creation form, and its scenes.
export function renderChapterView(container, project, chapter) {

    // Calculate the total words across every scene in this chapter.
    const chapterWordCount = countChapterWords(chapter);

    container.innerHTML = `
        <div class="container mt-5">

            <!-- Return to the project that contains this chapter. -->
            <button
                id="back-to-project"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to ${project.title}
            </button>


            <!-- Display the selected chapter's information. -->
            <h1>${chapter.title}</h1>

            <p class="text-muted">
                ${chapter.scenes.length} scenes
                •
                ${formatWordCount(chapterWordCount)}
            </p>

            <hr>


            <!-- Form used to create a new scene inside this chapter. -->
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


            <!-- Scene list section. -->
            <div class="mt-5">

                <h2>Scenes</h2>

                ${
                    chapter.scenes.length === 0

                        ? `
                            <!-- Show an empty state if the chapter has no scenes. -->
                            <p class="text-muted">
                                No scenes yet. Add your first scene above.
                            </p>
                        `

                        : `
                            <!-- Render one clickable card for each scene. -->
                            <div class="row g-3 mt-2">

                                ${chapter.scenes.map(scene => {

                                    // Calculate the word count for this scene.
                                    const sceneWordCount =
                                        countSceneWords(scene.content);

                                    return `
                                        <div class="col-12">

                                            <!--
                                                Store the scene ID on the button so app.js
                                                knows which scene the user selected.
                                            -->
                                            <button
                                                class="card h-100 w-100 text-start scene-card"
                                                data-scene-id="${scene.id}"
                                                type="button"
                                            >

                                                <div class="card-body">

                                                    <h3 class="card-title h5">
                                                        ${scene.title}
                                                    </h3>

                                                    <!-- Display the scene word count. -->
                                                    <p class="card-text text-muted mb-0">
                                                        ${formatWordCount(sceneWordCount)}
                                                    </p>

                                                </div>

                                            </button>

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
// SCENE EDITOR VIEW
// ============================================================

// Render the selected scene and provide a rich-text editor interface.
export function renderSceneView(container, project, chapter, scene) {

    // Calculate the word count currently stored in the scene.
    const sceneWordCount = countSceneWords(scene.content);

    container.innerHTML = `
        <div class="container-fluid mt-4 px-3 px-lg-4">


            <!-- ====================================================== -->
            <!-- MOBILE / GENERAL BACK NAVIGATION -->
            <!-- ====================================================== -->

            <!--
                Keep the existing Back button available on all screen sizes.
                Mobile users rely on this because the sidebar is hidden.
            -->
            <button
                id="back-to-chapter"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to ${chapter.title}
            </button>


            <!-- ====================================================== -->
            <!-- EDITOR LAYOUT -->
            <!-- ====================================================== -->

            <div class="row g-4">


                <!-- ================================================== -->
                <!-- DESKTOP SIDEBAR -->
                <!-- ================================================== -->

                <!--
                    The sidebar is hidden on small and medium screens.

                    Bootstrap's d-none d-lg-block classes mean:
                    - mobile/tablet: hidden
                    - large desktop screens and above: visible
                -->
                <aside
                    class="col-lg-3 d-none d-lg-block"
                    id="editor-sidebar"
                >

                    <div class="card">

                        <div class="card-body">

                            <!-- Display the current project at the top. -->
                            <h2 class="h5 mb-1">
                                ${project.title}
                            </h2>

                            <p class="text-muted small mb-4">
                                ${formatWordCount(countProjectWords(project))}
                            </p>


                            <!--
                                Render every chapter in the project so the
                                author can navigate without leaving the editor.
                            -->
                            <div id="editor-sidebar-navigation">

                                ${project.chapters.map(sidebarChapter => {

                                    const chapterWordCount =
                                        countChapterWords(sidebarChapter);

                                    const isCurrentChapter =
                                        sidebarChapter.id === chapter.id;

                                    return `
                                        <div class="mb-4">

                                            <!--
                                                Clicking a chapter returns the
                                                author to that chapter view.

                                                app.js wires this button.
                                            -->
                                            <button
                                                class="
                                                    btn
                                                    btn-sm
                                                    w-100
                                                    text-start
                                                    editor-sidebar-chapter
                                                    ${
                                                        isCurrentChapter
                                                            ? "fw-bold"
                                                            : ""
                                                    }
                                                "
                                                type="button"
                                                data-chapter-id="${sidebarChapter.id}"
                                            >
                                                ${sidebarChapter.title}
                                            </button>


                                            <!-- Chapter word count. -->
                                            <div class="text-muted small px-2 mb-2">
                                                ${formatWordCount(chapterWordCount)}
                                            </div>


                                            <!-- Render the scenes belonging to this chapter. -->
                                            ${
                                                sidebarChapter.scenes.length === 0

                                                    ? `
                                                        <p
                                                            class="
                                                                text-muted
                                                                small
                                                                fst-italic
                                                                px-2
                                                                mb-0
                                                            "
                                                        >
                                                            No scenes
                                                        </p>
                                                    `

                                                    : `
                                                        <div class="list-group list-group-flush">

                                                            ${sidebarChapter.scenes.map(
                                                                sidebarScene => {

                                                                    const isCurrentScene =
                                                                        sidebarScene.id === scene.id;

                                                                    const sidebarSceneWordCount =
                                                                        countSceneWords(
                                                                            sidebarScene.content
                                                                        );

                                                                    return `
                                                                        <!--
                                                                            Each scene stores both its own ID
                                                                            and its parent chapter ID.

                                                                            This allows app.js to jump directly
                                                                            between scenes across chapters.
                                                                        -->
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
                                                                            data-chapter-id="${sidebarChapter.id}"
                                                                            data-scene-id="${sidebarScene.id}"
                                                                            ${
                                                                                isCurrentScene
                                                                                    ? 'aria-current="true"'
                                                                                    : ""
                                                                            }
                                                                        >

                                                                            <!-- Scene title. -->
                                                                            <div>
                                                                                ${sidebarScene.title}
                                                                            </div>

                                                                            <!-- Scene word count. -->
                                                                            <small
                                                                                class="${
                                                                                    isCurrentScene
                                                                                        ? ""
                                                                                        : "text-muted"
                                                                                }"
                                                                            >
                                                                                ${formatWordCount(
                                                                                    sidebarSceneWordCount
                                                                                )}
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


                <!-- ================================================== -->
                <!-- MAIN EDITOR COLUMN -->
                <!-- ================================================== -->

                <!--
                    On mobile the editor takes the full width.
                    On desktop it occupies the remaining space beside
                    the navigation sidebar.
                -->
                <main class="col-12 col-lg-9">


                    <!-- Display the selected scene's title. -->
                    <h1>${scene.title}</h1>

                    <!-- Show the scene's location inside the project structure. -->
                    <p class="text-muted">
                        ${project.title} / ${chapter.title}
                    </p>

                    <hr>


                    <!-- ================================================== -->
                    <!-- RICH-TEXT TOOLBAR -->
                    <!-- ================================================== -->

                    <!--
                        Formatting toolbar for the TipTap editor.
                        app.js connects these controls to TipTap commands.
                    -->
                    <div
                        id="scene-editor-toolbar"
                        class="d-flex flex-wrap gap-2 mb-3"
                        role="toolbar"
                        aria-label="Scene formatting toolbar"
                    >


                        <!-- ============================================== -->
                        <!-- BASIC TEXT FORMATTING -->
                        <!-- ============================================== -->

                        <div
                            class="btn-group"
                            role="group"
                            aria-label="Text formatting"
                        >

                            <!-- Toggle bold formatting. -->
                            <button
                                id="editor-bold"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="Bold"
                                aria-label="Bold"
                            >
                                <strong>B</strong>
                            </button>


                            <!-- Toggle italic formatting. -->
                            <button
                                id="editor-italic"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="Italic"
                                aria-label="Italic"
                            >
                                <em>I</em>
                            </button>


                            <!-- Toggle underline formatting. -->
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


                        <!-- ============================================== -->
                        <!-- TEXT ALIGNMENT -->
                        <!-- ============================================== -->

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


                        <!-- ============================================== -->
                        <!-- MANUSCRIPT INDENTATION -->
                        <!-- ============================================== -->

                        <div
                            class="btn-group"
                            role="group"
                            aria-label="Paragraph indentation"
                        >

                            <!-- Toggle a manuscript-style first-line indent. -->
                            <button
                                id="editor-first-line-indent"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="First-line indent"
                            >
                                First Line
                            </button>


                            <!-- Increase whole-paragraph indentation. -->
                            <button
                                id="editor-indent"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="Increase paragraph indent"
                            >
                                Indent
                            </button>


                            <!-- Decrease whole-paragraph indentation. -->
                            <button
                                id="editor-outdent"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="Decrease paragraph indent"
                            >
                                Outdent
                            </button>

                        </div>


                        <!-- ============================================== -->
                        <!-- LINE SPACING -->
                        <!-- ============================================== -->

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

                                <option value="">
                                    Normal
                                </option>

                                <option value="1">
                                    1.0
                                </option>

                                <option value="1.15">
                                    1.15
                                </option>

                                <option value="1.5">
                                    1.5
                                </option>

                                <option value="2">
                                    2.0
                                </option>

                            </select>

                        </div>


                        <!-- ============================================== -->
                        <!-- HISTORY CONTROLS -->
                        <!-- ============================================== -->

                        <div
                            class="btn-group"
                            role="group"
                            aria-label="Editor history"
                        >

                            <!-- Undo the previous editor change. -->
                            <button
                                id="editor-undo"
                                class="btn btn-outline-secondary"
                                type="button"
                                title="Undo"
                            >
                                Undo
                            </button>


                            <!-- Redo the previous undone change. -->
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


                    <!-- ================================================== -->
                    <!-- TIPTAP WRITING AREA -->
                    <!-- ================================================== -->

                    <!--
                        TipTap mounts its editable document inside this element.
                        Proper StoryForge CSS will replace the temporary
                        Bootstrap styling later.
                    -->
                    <div
                        id="scene-editor"
                        class="form-control"
                        style="min-height: 500px;"
                    ></div>


                    <!-- ================================================== -->
                    <!-- EDITOR FOOTER -->
                    <!-- ================================================== -->

                    <!--
                        Display the autosave status on the left and the live
                        scene word count on the right.

                        The final colours and styling will be handled later
                        in the StoryForge CSS.
                    -->
                    <div
                        class="
                            d-flex
                            justify-content-between
                            align-items-center
                            mt-2
                        "
                    >

                        <!--
                            app.js updates this message while autosave runs.

                            Possible states include:
                            Saved
                            Unsaved changes
                            Saving...
                        -->
                        <small
                            id="scene-save-status"
                            class="text-muted"
                        >
                            Saved
                        </small>


                        <!--
                            app.js updates this count live while the
                            author writes or deletes text.
                        -->
                        <small
                            id="scene-word-count"
                            class="text-muted"
                        >
                            ${formatWordCount(sceneWordCount)}
                        </small>

                    </div>


                    <!-- ================================================== -->
                    <!-- SAVE CONTROLS -->
                    <!-- ================================================== -->

                    <!--
                        Keep a manual save option even though StoryForge
                        will now autosave the scene.

                        This acts as an immediate manual override.
                    -->
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