// Coordinates the dashboard, project view, chapter view, scene editor,
// autosave behaviour, record management, and user interactions.


// ============================================================
// TIPTAP EDITOR IMPORTS
// ============================================================

// Core TipTap editor.
import { Editor } from "@tiptap/core";

// StarterKit provides common formatting features such as:
// bold, italic, underline, headings, lists, undo, and redo.
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

// Used to calculate the live word count inside the scene editor.
import { countSceneWords } from "./wordCount.js";


// Main application container from index.html.
const app = document.querySelector("#app");


// ============================================================
// DASHBOARD
// ============================================================

// Render the dashboard and attach handlers for project management.
function showDashboard() {

    // Build the dashboard interface.
    renderCreateProjectForm(app);

    // Get references to the dashboard elements.
    const form = document.querySelector("#create-project-form");
    const titleInput = document.querySelector("#project-title");
    const projectList = document.querySelector("#project-list");


    // Re-read storage so the project list always reflects the latest data.
    function refreshProjectList() {

        const projects = getProjects();

        renderProjectList(projectList, projects);
    }


    // Display existing projects when the dashboard loads.
    refreshProjectList();


    // ========================================================
    // PROJECT CREATION
    // ========================================================

    form.addEventListener("submit", (event) => {

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Clean up the entered project title.
        const title = titleInput.value.trim();

        // Do not create a project with an empty title.
        if (!title) {
            return;
        }

        // Create and save the new project.
        addProject(title);

        // Clear the input after creation.
        titleInput.value = "";

        // Refresh the project cards.
        refreshProjectList();
    });


    // ========================================================
    // PROJECT ACTIONS
    // ========================================================

    /*
     * Use one click listener for the entire project list.
     *
     * This continues working even after the project cards are
     * re-rendered following a rename, delete, or creation.
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


            /*
             * Ask for the replacement title.
             *
             * Native prompt dialogs are temporary MVP UI.
             * These can become custom StoryForge modals later.
             */
            const newTitle = window.prompt(
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


            // Refresh only if a valid title was supplied.
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


            /*
             * Warn clearly because deleting a project also removes
             * every chapter, scene, and piece of writing inside it.
             */
            const confirmed = window.confirm(
                `Delete "${project.title}"?\n\n` +
                "This will permanently delete the project, " +
                "including all chapters, scenes, and written content."
            );


            // Leave the project untouched if deletion was cancelled.
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

        // Ignore clicks that did not happen inside a project card.
        if (!projectCard) {
            return;
        }

        // Read the stored project ID.
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

    // Load the selected project from storage.
    const project = getProjectById(projectId);

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Build the project interface.
    renderProjectView(app, project);


    // Get references to project view controls.
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

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Clean up the entered chapter title.
        const title =
            chapterTitleInput.value.trim();

        // Do not create an empty chapter title.
        if (!title) {
            return;
        }

        // Add the chapter to the selected project.
        addChapterToProject(
            projectId,
            title
        );

        /*
         * Re-open the project so the new chapter appears
         * immediately with fresh project data.
         */
        openProject(projectId);
    });


    // ========================================================
    // OPEN CHAPTER
    // ========================================================

    chapterCards.forEach((chapterCard) => {

        chapterCard.addEventListener("click", () => {

            // Read the chapter ID stored on the card.
            const chapterId =
                chapterCard.dataset.chapterId;

            // Open the selected chapter.
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

            // Find the chapter being renamed.
            const chapter =
                project.chapters.find(
                    chapter =>
                        chapter.id === chapterId
                );

            // Stop if the chapter could not be found.
            if (!chapter) {
                return;
            }


            // Ask the user for the replacement chapter title.
            const newTitle = window.prompt(
                "Rename chapter:",
                chapter.title
            );


            // Cancel was selected.
            if (newTitle === null) {
                return;
            }


            // Rename the chapter.
            const renamedChapter =
                renameChapter(
                    projectId,
                    chapterId,
                    newTitle
                );


            // Reload the project if the rename succeeded.
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

            // Find the chapter being deleted.
            const chapter =
                project.chapters.find(
                    chapter =>
                        chapter.id === chapterId
                );

            // Stop if the chapter could not be found.
            if (!chapter) {
                return;
            }


            /*
             * Warn that every scene inside the chapter
             * will be deleted with it.
             */
            const confirmed = window.confirm(
                `Delete "${chapter.title}"?\n\n` +
                "This will permanently delete this chapter " +
                "and every scene inside it."
            );


            // Do nothing if deletion was cancelled.
            if (!confirmed) {
                return;
            }


            // Delete the chapter.
            deleteChapter(
                projectId,
                chapterId
            );


            // Reload the project view.
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

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Find the selected chapter.
    const chapter =
        project.chapters.find(
            chapter =>
                chapter.id === chapterId
        );

    // Stop if the chapter could not be found.
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

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Clean up the scene title.
        const title =
            sceneTitleInput.value.trim();

        // Do not create an empty scene title.
        if (!title) {
            return;
        }

        // Add the scene to the selected chapter.
        addSceneToChapter(
            projectId,
            chapterId,
            title
        );

        // Reload the chapter to display the new scene.
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

            // Read the scene ID stored on the card.
            const sceneId =
                sceneCard.dataset.sceneId;

            // Open the selected scene.
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

            // Find the scene being renamed.
            const scene =
                chapter.scenes.find(
                    scene =>
                        scene.id === sceneId
                );

            // Stop if the scene could not be found.
            if (!scene) {
                return;
            }


            // Ask for the replacement scene title.
            const newTitle = window.prompt(
                "Rename scene:",
                scene.title
            );


            // Cancel was selected.
            if (newTitle === null) {
                return;
            }


            // Rename the scene.
            const renamedScene =
                renameScene(
                    projectId,
                    chapterId,
                    sceneId,
                    newTitle
                );


            // Reload the chapter if the rename succeeded.
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

            // Find the scene being deleted.
            const scene =
                chapter.scenes.find(
                    scene =>
                        scene.id === sceneId
                );

            // Stop if the scene could not be found.
            if (!scene) {
                return;
            }


            // Warn that the scene content will be permanently removed.
            const confirmed = window.confirm(
                `Delete "${scene.title}"?\n\n` +
                "This will permanently delete this scene " +
                "and all of its written content."
            );


            // Do nothing if deletion was cancelled.
            if (!confirmed) {
                return;
            }


            // Delete the selected scene.
            deleteScene(
                projectId,
                chapterId,
                sceneId
            );


            // Reload the chapter view.
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

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Find the chapter containing the selected scene.
    const chapter =
        project.chapters.find(
            chapter =>
                chapter.id === chapterId
        );

    // Stop if the chapter could not be found.
    if (!chapter) {
        return;
    }


    // Find the selected scene.
    const scene =
        chapter.scenes.find(
            scene =>
                scene.id === sceneId
        );

    // Stop if the scene could not be found.
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


    // Active scene record controls.
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


    // Manuscript formatting controls.
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

            // Standard rich-text formatting.
            StarterKit,

            // Paragraph and heading alignment.
            TextAlign.configure({
                types: [
                    "heading",
                    "paragraph"
                ]
            }),

            // StoryForge manuscript formatting.
            ParagraphFormatting
        ],

        // Restore previously saved scene content.
        content:
            scene.content || "<p></p>",

        // Temporary editor styling until the CSS pass.
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

    // Save the current TipTap document into the scene record.
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


    // Update the autosave status shown beneath the editor.
    function setSaveStatus(message) {

        saveStatus.textContent =
            message;
    }


    // ========================================================
    // AUTOSAVE STATE
    // ========================================================

    // Stores the currently scheduled autosave timer.
    let autosaveTimeout = null;

    // Tracks whether the editor contains unsaved changes.
    let hasUnsavedChanges = false;


    // ========================================================
    // AUTOSAVE
    // ========================================================

    // Schedule a save one second after the author stops editing.
    function scheduleAutosave() {

        hasUnsavedChanges = true;

        setSaveStatus(
            "Unsaved changes"
        );


        // Restart the timer whenever another change occurs.
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
     * Immediately complete pending autosave work.
     *
     * Used before navigation, renaming, or deleting.
     */
    function flushAutosave() {

        // Cancel the waiting timer.
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


    // Force an immediate save through the manual Save button.
    function saveImmediately() {

        // Cancel any pending autosave timer.
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
    // WORD COUNT
    // ========================================================

    // Format a live word count for display.
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

    // Toggle Bootstrap's active state for formatting buttons.
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


    // Read the current whole-paragraph indent as a number.
    function getParagraphIndentAmount() {

        const attributes =
            getParagraphAttributes();

        const marginLeft =
            attributes.marginLeft;

        // No stored indent means zero.
        if (!marginLeft) {
            return 0;
        }

        const amount =
            parseFloat(marginLeft);

        // Protect against malformed stored values.
        if (Number.isNaN(amount)) {
            return 0;
        }

        return amount;
    }


    // ========================================================
    // TOOLBAR STATE
    // ========================================================

    // Keep toolbar controls synchronised with the cursor position.
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


        // Text alignment.
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


        // Manuscript paragraph formatting.
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


        // Undo / redo availability.
        undoButton.disabled = !editor
            .can()
            .chain()
            .focus()
            .undo()
            .run();


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

    // Refresh toolbar state when the selection changes.
    editor.on(
        "selectionUpdate",
        updateToolbarState
    );


    // Refresh toolbar state when an editor transaction occurs.
    editor.on(
        "transaction",
        updateToolbarState
    );


    /*
     * Whenever scene content changes:
     *
     * - update the live word count
     * - start or restart autosave
     */
    editor.on("update", () => {

        updateLiveWordCount();

        scheduleAutosave();
    });


    // Set initial editor state.
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

            // Save immediately.
            saveImmediately();


            // Give additional visual confirmation.
            saveButton.textContent =
                "Saved ✓";


            setTimeout(() => {

                if (
                    saveButton.isConnected
                ) {

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

            // Ask for the replacement title.
            const newTitle =
                window.prompt(
                    "Rename scene:",
                    scene.title
                );


            // Cancel was selected.
            if (newTitle === null) {
                return;
            }


            /*
             * Save any pending writing before modifying
             * the scene record.
             */
            flushAutosave();


            // Rename the scene.
            const renamedScene =
                renameScene(
                    projectId,
                    chapterId,
                    sceneId,
                    newTitle
                );


            // Stop if the title was invalid.
            if (!renamedScene) {
                return;
            }


            // Clean up the current editor instance.
            editor.destroy();


            // Re-open the same scene with its new title.
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

            // Require explicit confirmation.
            const confirmed =
                window.confirm(
                    `Delete "${scene.title}"?\n\n` +
                    "This will permanently delete this scene " +
                    "and all of its written content."
                );


            // Leave the scene untouched if cancelled.
            if (!confirmed) {
                return;
            }


            /*
             * Complete pending autosave first so no timer
             * remains active after the editor is destroyed.
             */
            flushAutosave();


            // Destroy TipTap before removing the scene.
            editor.destroy();


            // Permanently delete the scene.
            deleteScene(
                projectId,
                chapterId,
                sceneId
            );


            // Return to the parent chapter.
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


                    // Save pending writing before leaving.
                    flushAutosave();

                    // Clean up TipTap.
                    editor.destroy();

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


                    /*
                     * Do nothing if the current scene
                     * was clicked again.
                     */
                    if (
                        targetChapterId ===
                            chapterId &&
                        targetSceneId ===
                            sceneId
                    ) {
                        return;
                    }


                    // Save pending writing before switching.
                    flushAutosave();

                    // Destroy the current editor.
                    editor.destroy();

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

            // Complete pending autosave before leaving.
            flushAutosave();

            // Clean up TipTap.
            editor.destroy();

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

// Show the project dashboard when StoryForge first loads.
showDashboard();