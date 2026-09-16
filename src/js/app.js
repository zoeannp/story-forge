// Coordinates the dashboard, project view, chapter view, scene editor,
// and user interactions.


// ============================================================
// TIPTAP EDITOR IMPORTS
// ============================================================

// Core TipTap editor.
import { Editor } from "@tiptap/core";

// StarterKit provides common formatting features such as:
// bold, italic, underline, lists, headings, undo, and redo.
import StarterKit from "@tiptap/starter-kit";

// Adds paragraph and heading alignment controls.
import TextAlign from "@tiptap/extension-text-align";


// ============================================================
// STORYFORGE IMPORTS
// ============================================================

import {
    addProject,
    getProjectById,
    addChapterToProject,
    addSceneToChapter,
    updateSceneContent
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView,
    renderChapterView,
    renderSceneView
} from "./ui.js";


// Main application container from index.html.
const app = document.querySelector("#app");


// ============================================================
// DASHBOARD
// ============================================================

// Render the dashboard and attach handlers for creating and opening projects.
function showDashboard() {

    // Build the dashboard interface.
    renderCreateProjectForm(app);

    // Get references to the dashboard elements we need to interact with.
    const form = document.querySelector("#create-project-form");
    const titleInput = document.querySelector("#project-title");
    const projectList = document.querySelector("#project-list");


    // Re-read storage so the project list always reflects the latest data.
    function refreshProjectList() {

        const projects = getProjects();

        renderProjectList(projectList, projects);
    }


    // Display any existing projects when the dashboard first loads.
    refreshProjectList();


    // Handle creation of a new project.
    form.addEventListener("submit", (event) => {

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Remove unnecessary whitespace from the project title.
        const title = titleInput.value.trim();

        // Do not create a project if the title is empty.
        if (!title) {
            return;
        }

        // Create and save the new project.
        addProject(title);

        // Clear the input after successful creation.
        titleInput.value = "";

        // Update the project cards shown on screen.
        refreshProjectList();
    });


    // Handle clicks on project cards.
    projectList.addEventListener("click", (event) => {

        // Find the nearest project card that was clicked.
        const projectCard = event.target.closest(".project-card");

        // Ignore clicks that did not happen inside a project card.
        if (!projectCard) {
            return;
        }

        // Read the stored project ID from the card.
        const projectId = projectCard.dataset.projectId;

        // Open the selected project.
        openProject(projectId);
    });
}


// ============================================================
// PROJECT VIEW
// ============================================================

// Render one project and attach handlers for navigation and chapter creation.
function openProject(projectId) {

    // Load the selected project from storage.
    const project = getProjectById(projectId);

    // Stop if the project could not be found.
    if (!project) {
        return;
    }

    // Build the project interface.
    renderProjectView(app, project);


    // Get references to the project view controls.
    const backButton = document.querySelector("#back-to-projects");
    const chapterForm = document.querySelector("#create-chapter-form");
    const chapterTitleInput = document.querySelector("#chapter-title");
    const chapterCards = document.querySelectorAll(".chapter-card");


    // Return to the main dashboard.
    backButton.addEventListener("click", () => {

        showDashboard();
    });


    // Handle creation of a new chapter.
    chapterForm.addEventListener("submit", (event) => {

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Clean up the entered chapter title.
        const title = chapterTitleInput.value.trim();

        // Do not create a chapter if the title is empty.
        if (!title) {
            return;
        }

        // Create the chapter and add it to the selected project.
        addChapterToProject(projectId, title);

        /*
         * Re-open the project after saving.
         * This reloads the latest project data and displays the new chapter.
         */
        openProject(projectId);
    });


    // Attach a click handler to every chapter card currently displayed.
    chapterCards.forEach((chapterCard) => {

        chapterCard.addEventListener("click", () => {

            // Read the chapter ID stored on the clicked card.
            const chapterId = chapterCard.dataset.chapterId;

            // Open the selected chapter.
            openChapter(projectId, chapterId);
        });
    });
}


// ============================================================
// CHAPTER VIEW
// ============================================================

// Render one chapter and attach handlers for navigation,
// scene creation, and opening scenes.
function openChapter(projectId, chapterId) {

    // Load the parent project from storage.
    const project = getProjectById(projectId);

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Find the selected chapter inside the project.
    const chapter = project.chapters.find(
        chapter => chapter.id === chapterId
    );

    // Stop if the requested chapter could not be found.
    if (!chapter) {
        return;
    }


    // Build the chapter interface.
    renderChapterView(app, project, chapter);


    // Get references to the chapter view controls.
    const backButton = document.querySelector("#back-to-project");
    const sceneForm = document.querySelector("#create-scene-form");
    const sceneTitleInput = document.querySelector("#scene-title");
    const sceneCards = document.querySelectorAll(".scene-card");


    // Return to the parent project.
    backButton.addEventListener("click", () => {

        openProject(projectId);
    });


    // Handle creation of a new scene inside the selected chapter.
    sceneForm.addEventListener("submit", (event) => {

        // Stop the form from refreshing the page.
        event.preventDefault();

        // Clean up the entered scene title.
        const title = sceneTitleInput.value.trim();

        // Do not create a scene if the title is empty.
        if (!title) {
            return;
        }

        // Create the scene and add it to the selected chapter.
        addSceneToChapter(projectId, chapterId, title);

        /*
         * Re-open the chapter after saving.
         * This reloads the latest data and displays the new scene.
         */
        openChapter(projectId, chapterId);
    });


    // Attach a click handler to every scene card currently displayed.
    sceneCards.forEach((sceneCard) => {

        sceneCard.addEventListener("click", () => {

            // Read the scene ID stored on the clicked card.
            const sceneId = sceneCard.dataset.sceneId;

            // Open the selected scene in the editor.
            openScene(projectId, chapterId, sceneId);
        });
    });
}


// ============================================================
// SCENE EDITOR VIEW
// ============================================================

// Render one scene and attach the TipTap rich-text editor.
function openScene(projectId, chapterId, sceneId) {

    // Load the parent project from storage.
    const project = getProjectById(projectId);

    // Stop if the project could not be found.
    if (!project) {
        return;
    }


    // Find the chapter that contains the selected scene.
    const chapter = project.chapters.find(
        chapter => chapter.id === chapterId
    );

    // Stop if the chapter could not be found.
    if (!chapter) {
        return;
    }


    // Find the selected scene inside the chapter.
    const scene = chapter.scenes.find(
        scene => scene.id === sceneId
    );

    // Stop if the scene could not be found.
    if (!scene) {
        return;
    }


    // Build the scene editor interface.
    renderSceneView(app, project, chapter, scene);


    // ========================================================
    // EDITOR ELEMENTS
    // ========================================================

    // Main TipTap editor container.
    const editorElement = document.querySelector("#scene-editor");

    // Navigation and save controls.
    const backButton = document.querySelector("#back-to-chapter");
    const saveButton = document.querySelector("#save-scene");


    // Basic formatting controls.
    const boldButton = document.querySelector("#editor-bold");
    const italicButton = document.querySelector("#editor-italic");
    const underlineButton = document.querySelector("#editor-underline");


    // Alignment controls.
    const alignLeftButton = document.querySelector("#editor-align-left");
    const alignCenterButton = document.querySelector("#editor-align-center");
    const alignRightButton = document.querySelector("#editor-align-right");
    const alignJustifyButton = document.querySelector("#editor-align-justify");


    // History controls.
    const undoButton = document.querySelector("#editor-undo");
    const redoButton = document.querySelector("#editor-redo");


    // ========================================================
    // TIPTAP EDITOR SETUP
    // ========================================================

    /*
     * Create the rich-text editor.
     *
     * Existing scene HTML is loaded back into the editor.
     * New scenes receive an empty paragraph.
     */
    const editor = new Editor({

        element: editorElement,

        extensions: [

            // Provides bold, italic, underline, undo, redo, and other basics.
            StarterKit,

            // Allow paragraphs and headings to be aligned.
            TextAlign.configure({
                types: ["heading", "paragraph"]
            })
        ],

        // Load previously saved scene content.
        content: scene.content || "<p></p>",

        /*
         * Apply temporary editor styling directly to the editable area.
         * Proper StoryForge CSS will replace this later.
         */
        editorProps: {
            attributes: {
                class: "p-3",
                style: "min-height: 470px; outline: none;"
            }
        }
    });


    // ========================================================
    // TOOLBAR STATE
    // ========================================================

    /*
     * Add or remove Bootstrap's "active" class depending on
     * whether a formatting option is currently active.
     */
    function setButtonActive(button, isActive) {

        button.classList.toggle("active", isActive);

        button.setAttribute(
            "aria-pressed",
            String(isActive)
        );
    }


    // Keep the toolbar in sync with the current cursor position or selection.
    function updateToolbarState() {

        // Text formatting state.
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


        // Paragraph alignment state.
        setButtonActive(
            alignLeftButton,
            editor.isActive({ textAlign: "left" })
        );

        setButtonActive(
            alignCenterButton,
            editor.isActive({ textAlign: "center" })
        );

        setButtonActive(
            alignRightButton,
            editor.isActive({ textAlign: "right" })
        );

        setButtonActive(
            alignJustifyButton,
            editor.isActive({ textAlign: "justify" })
        );


        // Disable Undo or Redo when there is nothing available to undo or redo.
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


    // Refresh toolbar state when the selection changes.
    editor.on("selectionUpdate", updateToolbarState);

    // Refresh toolbar state whenever the document changes.
    editor.on("transaction", updateToolbarState);

    // Set the correct button states when the editor first opens.
    updateToolbarState();


    // ========================================================
    // BASIC TEXT FORMATTING
    // ========================================================

    // Toggle bold formatting.
    boldButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .toggleBold()
            .run();
    });


    // Toggle italic formatting.
    italicButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .toggleItalic()
            .run();
    });


    // Toggle underline formatting.
    underlineButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .toggleUnderline()
            .run();
    });


    // ========================================================
    // TEXT ALIGNMENT
    // ========================================================

    // Align the current paragraph to the left.
    alignLeftButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .setTextAlign("left")
            .run();
    });


    // Centre the current paragraph.
    alignCenterButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .setTextAlign("center")
            .run();
    });


    // Align the current paragraph to the right.
    alignRightButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .setTextAlign("right")
            .run();
    });


    // Justify the current paragraph.
    alignJustifyButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .setTextAlign("justify")
            .run();
    });


    // ========================================================
    // UNDO AND REDO
    // ========================================================

    // Undo the most recent editor change.
    undoButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .undo()
            .run();
    });


    // Redo the most recently undone change.
    redoButton.addEventListener("click", () => {

        editor
            .chain()
            .focus()
            .redo()
            .run();
    });


    // ========================================================
    // SAVE SCENE
    // ========================================================

    // Save the scene's formatted HTML into localStorage.
    saveButton.addEventListener("click", () => {

        /*
         * getHTML() preserves formatting such as:
         * bold, italic, underline, and paragraph alignment.
         */
        const content = editor.getHTML();

        // Save the formatted scene content.
        updateSceneContent(
            projectId,
            chapterId,
            sceneId,
            content
        );


        // Give the user a small confirmation that the save completed.
        saveButton.textContent = "Saved ✓";

        /*
         * Return the button to its normal label shortly afterward.
         * Check that the button still exists first in case the user navigated away.
         */
        setTimeout(() => {

            if (saveButton.isConnected) {
                saveButton.textContent = "Save Scene";
            }

        }, 1200);
    });


    // ========================================================
    // NAVIGATION
    // ========================================================

    // Return to the chapter that contains this scene.
    backButton.addEventListener("click", () => {

        /*
         * Destroy the TipTap instance before replacing the editor view.
         * This cleans up TipTap's event listeners and DOM bindings.
         */
        editor.destroy();

        openChapter(projectId, chapterId);
    });
}


// ============================================================
// APPLICATION START
// ============================================================

// Show the project dashboard when StoryForge first loads.
showDashboard();