// Coordinates the dashboard, project view, chapter view, scene editor,
// autosave behaviour, record management, global navigation,
// and user interactions.


// ============================================================
// TIPTAP EDITOR IMPORTS
// ============================================================

// Core TipTap editor.
import { Editor } from "@tiptap/core";

// StarterKit provides common formatting features.
import StarterKit from "@tiptap/starter-kit";

// Adds paragraph and heading alignment controls.
import TextAlign from "@tiptap/extension-text-align";

// Adds StoryForge's custom manuscript paragraph formatting.
import { ParagraphFormatting } from "./editorExtensions.js";


// ============================================================
// STORYFORGE IMPORTS
// ============================================================

import {
    addProject,
    getProjectById,
    addChapterToProject,
    addSceneToChapter,
    updateSceneContent,
    renameProject,
    deleteProject,
    renameChapter,
    deleteChapter,
    renameScene,
    deleteScene
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView,
    renderChapterView,
    renderSceneView
} from "./ui.js";

import { countSceneWords } from "./wordCount.js";


// Main application container from index.html.
const app = document.querySelector("#app");


/*
 * Stores a cleanup function while a scene editor is active.
 *
 * This lets global navigation safely save and destroy the
 * current TipTap editor before replacing the page.
 */
let activeSceneCleanup = null;


// ============================================================
// GLOBAL NAVIGATION
// ============================================================

/*
 * Handle clicks on the StoryForge logo from any application view.
 *
 * Event delegation means this keeps working even though ui.js
 * repeatedly replaces the contents of #app.
 */
app.addEventListener("click", (event) => {

    // Check whether the StoryForge logo/home button was clicked.
    const homeButton =
        event.target.closest(".storyforge-home");

    // Ignore unrelated clicks.
    if (!homeButton) {
        return;
    }


    /*
     * If a scene editor is currently open, save any pending
     * changes and destroy TipTap before leaving.
     */
    if (activeSceneCleanup) {
        activeSceneCleanup();
    }


    // Return to the main StoryForge dashboard.
    showDashboard();
});


// ============================================================
// DASHBOARD
// ============================================================

// Render the dashboard and attach handlers for project management.
function showDashboard() {

    // Build the dashboard interface.
    renderCreateProjectForm(app);

    // Get references to dashboard elements.
    const form =
        document.querySelector("#create-project-form");

    const titleInput =
        document.querySelector("#project-title");

    const projectList =
        document.querySelector("#project-list");


    // Re-read storage so the project list always shows current data.
    function refreshProjectList() {

        const projects = getProjects();

        renderProjectList(
            projectList,
            projects
        );
    }


    // Display existing projects.
    refreshProjectList();


    // ========================================================
    // PROJECT CREATION
    // ========================================================

    form.addEventListener("submit", (event) => {

        // Stop the browser from refreshing the page.
        event.preventDefault();

        // Clean up the entered title.
        const title =
            titleInput.value.trim();

        // Do not create an empty project title.
        if (!title) {
            return;
        }

        // Create and save the project.
        addProject(title);

        // Clear the input.
        titleInput.value = "";

        // Display the updated project collection.
        refreshProjectList();
    });


    // ========================================================
    // PROJECT ACTIONS
    // ========================================================

    /*
     * Use one listener for the project list.
     *
     * This continues working after the project cards are
     * re-rendered following creation, rename, or deletion.
     */
    projectList.addEventListener("click", (event) => {

        // ----------------------------------------------------
        // RENAME PROJECT
        // ----------------------------------------------------

        const renameButton =
            event.target.closest(".rename-project");

        if (renameButton) {

            const projectId =
                renameButton.dataset.projectId;

            const project =
                getProjectById(projectId);

            // Stop if the project no longer exists.
            if (!project) {
                return;
            }


            // Ask for the replacement title.
            const newTitle =
                window.prompt(
                    "Rename project:",
                    project.title
                );


            // Cancel was selected.
            if (newTitle === null) {
                return;
            }


            // Rename the project.
            const renamedProject =
                renameProject(
                    projectId,
                    newTitle
                );


            // Refresh if the rename succeeded.
            if (renamedProject) {
                refreshProjectList();
            }

            return;
        }


        // ----------------------------------------------------
        // DELETE PROJECT
        // ----------------------------------------------------

        const deleteButton =
            event.target.closest(".delete-project");

        if (deleteButton) {

            const projectId =
                deleteButton.dataset.projectId;

            const project =
                getProjectById(projectId);

            // Stop if the project no longer exists.
            if (!project) {
                return;
            }


            // Warn that everything nested inside will disappear.
            const confirmed =
                window.confirm(
                    `Delete "${project.title}"?\n\n` +
                    "This will permanently delete the project, " +
                    "including all chapters, scenes, and written content."
                );


            // Leave the project untouched if cancelled.
            if (!confirmed) {
                return;
            }


            // Permanently remove the project.
            deleteProject(projectId);

            // Refresh the dashboard.
            refreshProjectList();

            return;
        }


        // ----------------------------------------------------
        // OPEN PROJECT
        // ----------------------------------------------------

        const projectCard =
            event.target.closest(".project-card");

        // Ignore unrelated clicks.
        if (!projectCard) {
            return;
        }


        const projectId =
            projectCard.dataset.projectId;

        // Open the selected project.
        openProject(projectId);
    });
}


// ============================================================
// PROJECT VIEW
// ============================================================

// Render one project and attach chapter management handlers.
function openProject(projectId) {

    // Load the selected project.
    const project =
        getProjectById(projectId);

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Build the project interface.
    renderProjectView(
        app,
        project
    );


    // Get references to project controls.
    const backButton =
        document.querySelector("#back-to-projects");

    const chapterForm =
        document.querySelector("#create-chapter-form");

    const chapterTitleInput =
        document.querySelector("#chapter-title");

    const chapterCards =
        document.querySelectorAll(".chapter-card");

    const renameChapterButtons =
        document.querySelectorAll(".rename-chapter");

    const deleteChapterButtons =
        document.querySelectorAll(".delete-chapter");


    // ========================================================
    // BACK NAVIGATION
    // ========================================================

    backButton.addEventListener("click", () => {

        showDashboard();
    });


    // ========================================================
    // CHAPTER CREATION
    // ========================================================

    chapterForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const title =
            chapterTitleInput.value.trim();

        // Do not create an empty chapter.
        if (!title) {
            return;
        }


        // Add the chapter to the selected project.
        addChapterToProject(
            projectId,
            title
        );


        // Reload the project with fresh data.
        openProject(projectId);
    });


    // ========================================================
    // OPEN CHAPTER
    // ========================================================

    chapterCards.forEach((chapterCard) => {

        chapterCard.addEventListener("click", () => {

            const chapterId =
                chapterCard.dataset.chapterId;

            openChapter(
                projectId,
                chapterId
            );
        });
    });


    // ========================================================
    // RENAME CHAPTER
    // ========================================================

    renameChapterButtons.forEach((renameButton) => {

        renameButton.addEventListener("click", () => {

            const chapterId =
                renameButton.dataset.chapterId;


            const chapter =
                project.chapters.find(
                    chapter =>
                        chapter.id === chapterId
                );


            if (!chapter) {
                return;
            }


            const newTitle =
                window.prompt(
                    "Rename chapter:",
                    chapter.title
                );


            if (newTitle === null) {
                return;
            }


            const renamedChapter =
                renameChapter(
                    projectId,
                    chapterId,
                    newTitle
                );


            if (renamedChapter) {
                openProject(projectId);
            }
        });
    });


    // ========================================================
    // DELETE CHAPTER
    // ========================================================

    deleteChapterButtons.forEach((deleteButton) => {

        deleteButton.addEventListener("click", () => {

            const chapterId =
                deleteButton.dataset.chapterId;


            const chapter =
                project.chapters.find(
                    chapter =>
                        chapter.id === chapterId
                );


            if (!chapter) {
                return;
            }


            const confirmed =
                window.confirm(
                    `Delete "${chapter.title}"?\n\n` +
                    "This will permanently delete this chapter " +
                    "and every scene inside it."
                );


            if (!confirmed) {
                return;
            }


            deleteChapter(
                projectId,
                chapterId
            );


            openProject(projectId);
        });
    });
}


// ============================================================
// CHAPTER VIEW
// ============================================================

// Render one chapter and attach scene management handlers.
function openChapter(projectId, chapterId) {

    // Load the parent project.
    const project =
        getProjectById(projectId);

    if (!project) {
        return;
    }


    // Find the requested chapter.
    const chapter =
        project.chapters.find(
            chapter =>
                chapter.id === chapterId
        );

    if (!chapter) {
        return;
    }


    // Build the chapter interface.
    renderChapterView(
        app,
        project,
        chapter
    );


    // Get references to chapter controls.
    const backButton =
        document.querySelector("#back-to-project");

    const sceneForm =
        document.querySelector("#create-scene-form");

    const sceneTitleInput =
        document.querySelector("#scene-title");

    const sceneCards =
        document.querySelectorAll(".scene-card");

    const renameSceneButtons =
        document.querySelectorAll(".rename-scene");

    const deleteSceneButtons =
        document.querySelectorAll(".delete-scene");


    // ========================================================
    // BACK NAVIGATION
    // ========================================================

    backButton.addEventListener("click", () => {

        openProject(projectId);
    });


    // ========================================================
    // SCENE CREATION
    // ========================================================

    sceneForm.addEventListener("submit", (event) => {

        event.preventDefault();

        const title =
            sceneTitleInput.value.trim();

        // Do not create an empty scene title.
        if (!title) {
            return;
        }


        addSceneToChapter(
            projectId,
            chapterId,
            title
        );


        // Reload the chapter.
        openChapter(
            projectId,
            chapterId
        );
    });


    // ========================================================
    // OPEN SCENE
    // ========================================================

    sceneCards.forEach((sceneCard) => {

        sceneCard.addEventListener("click", () => {

            const sceneId =
                sceneCard.dataset.sceneId;

            openScene(
                projectId,
                chapterId,
                sceneId
            );
        });
    });


    // ========================================================
    // RENAME SCENE
    // ========================================================

    renameSceneButtons.forEach((renameButton) => {

        renameButton.addEventListener("click", () => {

            const sceneId =
                renameButton.dataset.sceneId;


            const scene =
                chapter.scenes.find(
                    scene =>
                        scene.id === sceneId
                );


            if (!scene) {
                return;
            }


            const newTitle =
                window.prompt(
                    "Rename scene:",
                    scene.title
                );


            if (newTitle === null) {
                return;
            }


            const renamedScene =
                renameScene(
                    projectId,
                    chapterId,
                    sceneId,
                    newTitle
                );


            if (renamedScene) {

                openChapter(
                    projectId,
                    chapterId
                );
            }
        });
    });


    // ========================================================
    // DELETE SCENE
    // ========================================================

    deleteSceneButtons.forEach((deleteButton) => {

        deleteButton.addEventListener("click", () => {

            const sceneId =
                deleteButton.dataset.sceneId;


            const scene =
                chapter.scenes.find(
                    scene =>
                        scene.id === sceneId
                );


            if (!scene) {
                return;
            }


            const confirmed =
                window.confirm(
                    `Delete "${scene.title}"?\n\n` +
                    "This will permanently delete this scene " +
                    "and all of its written content."
                );


            if (!confirmed) {
                return;
            }


            deleteScene(
                projectId,
                chapterId,
                sceneId
            );


            openChapter(
                projectId,
                chapterId
            );
        });
    });
}


// ============================================================
// SCENE EDITOR VIEW
// ============================================================

// Render one scene and attach the TipTap rich-text editor.
function openScene(projectId, chapterId, sceneId) {

    // Load the parent project.
    const project =
        getProjectById(projectId);

    if (!project) {
        return;
    }


    // Find the selected chapter.
    const chapter =
        project.chapters.find(
            chapter =>
                chapter.id === chapterId
        );

    if (!chapter) {
        return;
    }


    // Find the selected scene.
    const scene =
        chapter.scenes.find(
            scene =>
                scene.id === sceneId
        );

    if (!scene) {
        return;
    }


    // Build the editor interface.
    renderSceneView(
        app,
        project,
        chapter,
        scene
    );


    // ========================================================
    // EDITOR ELEMENTS
    // ========================================================

    const editorElement =
        document.querySelector("#scene-editor");

    const backButton =
        document.querySelector("#back-to-chapter");

    const saveButton =
        document.querySelector("#save-scene");

    const saveStatus =
        document.querySelector("#scene-save-status");

    const sceneWordCount =
        document.querySelector("#scene-word-count");


    // Active scene actions.
    const renameSceneButton =
        document.querySelector(".rename-scene");

    const deleteSceneButton =
        document.querySelector(".delete-scene");


    // Basic formatting controls.
    const boldButton =
        document.querySelector("#editor-bold");

    const italicButton =
        document.querySelector("#editor-italic");

    const underlineButton =
        document.querySelector("#editor-underline");


    // Alignment controls.
    const alignLeftButton =
        document.querySelector("#editor-align-left");

    const alignCenterButton =
        document.querySelector("#editor-align-center");

    const alignRightButton =
        document.querySelector("#editor-align-right");

    const alignJustifyButton =
        document.querySelector("#editor-align-justify");


    // Manuscript paragraph formatting controls.
    const firstLineIndentButton =
        document.querySelector(
            "#editor-first-line-indent"
        );

    const indentButton =
        document.querySelector("#editor-indent");

    const outdentButton =
        document.querySelector("#editor-outdent");

    const lineSpacingSelect =
        document.querySelector("#editor-line-spacing");


    // History controls.
    const undoButton =
        document.querySelector("#editor-undo");

    const redoButton =
        document.querySelector("#editor-redo");


    // Desktop sidebar navigation.
    const sidebarChapterButtons =
        document.querySelectorAll(
            ".editor-sidebar-chapter"
        );

    const sidebarSceneButtons =
        document.querySelectorAll(
            ".editor-sidebar-scene"
        );


    // ========================================================
    // TIPTAP EDITOR SETUP
    // ========================================================

    const editor = new Editor({

        element: editorElement,

        extensions: [

            StarterKit,

            TextAlign.configure({
                types: [
                    "heading",
                    "paragraph"
                ]
            }),

            ParagraphFormatting
        ],

        // Restore previously saved scene content.
        content:
            scene.content || "<p></p>",

        // Temporary editor styling.
        editorProps: {

            attributes: {

                class: "p-3",

                style:
                    "min-height: 470px; outline: none;"
            }
        }
    });


    // ========================================================
    // SAVE HELPERS
    // ========================================================

    // Save the editor's current HTML into the scene record.
    function saveCurrentScene() {

        const content =
            editor.getHTML();

        updateSceneContent(
            projectId,
            chapterId,
            sceneId,
            content
        );
    }


    // Update the autosave message.
    function setSaveStatus(message) {

        saveStatus.textContent =
            message;
    }


    // ========================================================
    // AUTOSAVE STATE
    // ========================================================

    // Stores the current autosave timer.
    let autosaveTimeout = null;

    // Tracks whether unsaved editor changes exist.
    let hasUnsavedChanges = false;


    // ========================================================
    // AUTOSAVE
    // ========================================================

    /*
     * Schedule a save one second after the author stops editing.
     */
    function scheduleAutosave() {

        hasUnsavedChanges = true;

        setSaveStatus(
            "Unsaved changes"
        );


        // Restart the countdown whenever another change occurs.
        if (autosaveTimeout) {

            clearTimeout(
                autosaveTimeout
            );
        }


        autosaveTimeout = setTimeout(() => {

            setSaveStatus(
                "Saving..."
            );


            saveCurrentScene();

            hasUnsavedChanges = false;

            autosaveTimeout = null;


            setSaveStatus(
                "Saved"
            );

        }, 1000);
    }


    /*
     * Immediately complete any pending autosave.
     */
    function flushAutosave() {

        // Cancel any waiting timer.
        if (autosaveTimeout) {

            clearTimeout(
                autosaveTimeout
            );

            autosaveTimeout = null;
        }


        // Save immediately if changes are waiting.
        if (hasUnsavedChanges) {

            setSaveStatus(
                "Saving..."
            );


            saveCurrentScene();

            hasUnsavedChanges = false;


            setSaveStatus(
                "Saved"
            );
        }
    }


    // Force an immediate save through the Save Scene button.
    function saveImmediately() {

        if (autosaveTimeout) {

            clearTimeout(
                autosaveTimeout
            );

            autosaveTimeout = null;
        }


        setSaveStatus(
            "Saving..."
        );


        saveCurrentScene();

        hasUnsavedChanges = false;


        setSaveStatus(
            "Saved"
        );
    }


    // ========================================================
    // EDITOR CLEANUP
    // ========================================================

    /*
     * Destroy the active TipTap editor.
     *
     * This also clears the global cleanup reference so
     * StoryForge does not try to destroy the same editor twice.
     */
    function destroySceneEditor() {

        activeSceneCleanup = null;

        editor.destroy();
    }


    /*
     * Save pending writing and then safely destroy TipTap.
     *
     * This function is registered globally while this scene
     * editor is active, allowing the navbar logo to safely
     * return to the dashboard.
     */
    function cleanupSceneEditor() {

        flushAutosave();

        destroySceneEditor();
    }


    /*
     * Register this editor's cleanup function globally.
     *
     * The StoryForge navbar uses this when Home is clicked.
     */
    activeSceneCleanup =
        cleanupSceneEditor;


    // ========================================================
    // WORD COUNT
    // ========================================================

    // Format a live word count.
    function formatLiveWordCount(count) {

        const label =
            count === 1
                ? "word"
                : "words";

        return `${count.toLocaleString()} ${label}`;
    }


    // Recalculate the scene word count from current editor content.
    function updateLiveWordCount() {

        const content =
            editor.getHTML();

        const wordCount =
            countSceneWords(content);


        sceneWordCount.textContent =
            formatLiveWordCount(
                wordCount
            );
    }


    // ========================================================
    // TOOLBAR HELPERS
    // ========================================================

    // Add or remove the active formatting state.
    function setButtonActive(button, isActive) {

        button.classList.toggle(
            "active",
            isActive
        );


        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    }


    // Read custom attributes from the current paragraph.
    function getParagraphAttributes() {

        return editor.getAttributes(
            "paragraph"
        );
    }


    // Read the whole-paragraph indent as a number.
    function getParagraphIndentAmount() {

        const attributes =
            getParagraphAttributes();

        const marginLeft =
            attributes.marginLeft;


        if (!marginLeft) {
            return 0;
        }


        const amount =
            parseFloat(marginLeft);


        if (Number.isNaN(amount)) {
            return 0;
        }


        return amount;
    }


    // ========================================================
    // TOOLBAR STATE
    // ========================================================

    // Keep toolbar controls synchronised with the cursor.
    function updateToolbarState() {

        // Basic formatting.
        setButtonActive(
            boldButton,
            editor.isActive("bold")
        );

        setButtonActive(
            italicButton,
            editor.isActive("italic")
        );

        setButtonActive(
            underlineButton,
            editor.isActive("underline")
        );


        // Alignment.
        setButtonActive(
            alignLeftButton,
            editor.isActive({
                textAlign: "left"
            })
        );

        setButtonActive(
            alignCenterButton,
            editor.isActive({
                textAlign: "center"
            })
        );

        setButtonActive(
            alignRightButton,
            editor.isActive({
                textAlign: "right"
            })
        );

        setButtonActive(
            alignJustifyButton,
            editor.isActive({
                textAlign: "justify"
            })
        );


        // Paragraph formatting.
        const paragraphAttributes =
            getParagraphAttributes();


        setButtonActive(
            firstLineIndentButton,
            paragraphAttributes.textIndent ===
                "0.5in"
        );


        lineSpacingSelect.value =
            paragraphAttributes.lineHeight ||
            "";


        outdentButton.disabled =
            getParagraphIndentAmount() <= 0;


        // Undo availability.
        undoButton.disabled = !editor
            .can()
            .chain()
            .focus()
            .undo()
            .run();


        // Redo availability.
        redoButton.disabled = !editor
            .can()
            .chain()
            .focus()
            .redo()
            .run();
    }


    // ========================================================
    // TIPTAP EVENTS
    // ========================================================

    editor.on(
        "selectionUpdate",
        updateToolbarState
    );


    editor.on(
        "transaction",
        updateToolbarState
    );


    /*
     * Whenever scene content changes:
     * - update word count
     * - restart autosave
     */
    editor.on("update", () => {

        updateLiveWordCount();

        scheduleAutosave();
    });


    // Initialise editor state.
    updateToolbarState();

    updateLiveWordCount();

    setSaveStatus("Saved");


    // ========================================================
    // BASIC TEXT FORMATTING
    // ========================================================

    boldButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .toggleBold()
                .run();
        }
    );


    italicButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .toggleItalic()
                .run();
        }
    );


    underlineButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .toggleUnderline()
                .run();
        }
    );


    // ========================================================
    // TEXT ALIGNMENT
    // ========================================================

    alignLeftButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .setTextAlign("left")
                .run();
        }
    );


    alignCenterButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .setTextAlign("center")
                .run();
        }
    );


    alignRightButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .setTextAlign("right")
                .run();
        }
    );


    alignJustifyButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .setTextAlign("justify")
                .run();
        }
    );


    // ========================================================
    // FIRST-LINE INDENT
    // ========================================================

    firstLineIndentButton.addEventListener(
        "click",
        () => {

            const attributes =
                getParagraphAttributes();


            const newIndent =
                attributes.textIndent ===
                "0.5in"
                    ? null
                    : "0.5in";


            editor
                .chain()
                .focus()
                .updateAttributes(
                    "paragraph",
                    {
                        textIndent:
                            newIndent
                    }
                )
                .run();
        }
    );


    // ========================================================
    // WHOLE-PARAGRAPH INDENTATION
    // ========================================================

    indentButton.addEventListener(
        "click",
        () => {

            const currentIndent =
                getParagraphIndentAmount();

            const newIndent =
                currentIndent + 0.5;


            editor
                .chain()
                .focus()
                .updateAttributes(
                    "paragraph",
                    {
                        marginLeft:
                            `${newIndent}in`
                    }
                )
                .run();
        }
    );


    outdentButton.addEventListener(
        "click",
        () => {

            const currentIndent =
                getParagraphIndentAmount();


            const newIndent =
                Math.max(
                    0,
                    currentIndent - 0.5
                );


            const marginLeft =
                newIndent === 0
                    ? null
                    : `${newIndent}in`;


            editor
                .chain()
                .focus()
                .updateAttributes(
                    "paragraph",
                    {
                        marginLeft:
                            marginLeft
                    }
                )
                .run();
        }
    );


    // ========================================================
    // LINE SPACING
    // ========================================================

    lineSpacingSelect.addEventListener(
        "change",
        () => {

            const selectedSpacing =
                lineSpacingSelect.value;


            const lineHeight =
                selectedSpacing === ""
                    ? null
                    : selectedSpacing;


            editor
                .chain()
                .focus()
                .updateAttributes(
                    "paragraph",
                    {
                        lineHeight:
                            lineHeight
                    }
                )
                .run();
        }
    );


    // ========================================================
    // UNDO AND REDO
    // ========================================================

    undoButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .undo()
                .run();
        }
    );


    redoButton.addEventListener(
        "click",
        () => {

            editor
                .chain()
                .focus()
                .redo()
                .run();
        }
    );


    // ========================================================
    // MANUAL SAVE
    // ========================================================

    saveButton.addEventListener(
        "click",
        () => {

            saveImmediately();


            saveButton.textContent =
                "Saved ✓";


            setTimeout(() => {

                if (saveButton.isConnected) {

                    saveButton.textContent =
                        "Save Scene";
                }

            }, 1200);
        }
    );


    // ========================================================
    // RENAME CURRENT SCENE
    // ========================================================

    renameSceneButton.addEventListener(
        "click",
        () => {

            const newTitle =
                window.prompt(
                    "Rename scene:",
                    scene.title
                );


            if (newTitle === null) {
                return;
            }


            // Save any pending writing first.
            flushAutosave();


            const renamedScene =
                renameScene(
                    projectId,
                    chapterId,
                    sceneId,
                    newTitle
                );


            if (!renamedScene) {
                return;
            }


            // Destroy the current editor without another save.
            destroySceneEditor();


            // Re-open the renamed scene.
            openScene(
                projectId,
                chapterId,
                sceneId
            );
        }
    );


    // ========================================================
    // DELETE CURRENT SCENE
    // ========================================================

    deleteSceneButton.addEventListener(
        "click",
        () => {

            const confirmed =
                window.confirm(
                    `Delete "${scene.title}"?\n\n` +
                    "This will permanently delete this scene " +
                    "and all of its written content."
                );


            if (!confirmed) {
                return;
            }


            /*
             * Finish any pending autosave before destroying
             * the editor and removing the scene.
             */
            flushAutosave();


            destroySceneEditor();


            deleteScene(
                projectId,
                chapterId,
                sceneId
            );


            openChapter(
                projectId,
                chapterId
            );
        }
    );


    // ========================================================
    // SIDEBAR CHAPTER NAVIGATION
    // ========================================================

    sidebarChapterButtons.forEach(
        (chapterButton) => {

            chapterButton.addEventListener(
                "click",
                () => {

                    const targetChapterId =
                        chapterButton
                            .dataset
                            .chapterId;


                    // Save and clean up the current editor.
                    cleanupSceneEditor();


                    // Open the selected chapter.
                    openChapter(
                        projectId,
                        targetChapterId
                    );
                }
            );
        }
    );


    // ========================================================
    // SIDEBAR SCENE NAVIGATION
    // ========================================================

    sidebarSceneButtons.forEach(
        (sceneButton) => {

            sceneButton.addEventListener(
                "click",
                () => {

                    const targetChapterId =
                        sceneButton
                            .dataset
                            .chapterId;

                    const targetSceneId =
                        sceneButton
                            .dataset
                            .sceneId;


                    // Do nothing if the current scene was clicked.
                    if (
                        targetChapterId ===
                            chapterId &&
                        targetSceneId ===
                            sceneId
                    ) {
                        return;
                    }


                    // Save and clean up the current editor.
                    cleanupSceneEditor();


                    // Open the selected scene.
                    openScene(
                        projectId,
                        targetChapterId,
                        targetSceneId
                    );
                }
            );
        }
    );


    // ========================================================
    // BACK NAVIGATION
    // ========================================================

    backButton.addEventListener(
        "click",
        () => {

            // Save pending writing and destroy TipTap.
            cleanupSceneEditor();


            // Return to the current chapter.
            openChapter(
                projectId,
                chapterId
            );
        }
    );
}


// ============================================================
// APPLICATION START
// ============================================================

// Show the StoryForge dashboard when the application first loads.
showDashboard();