// Coordinates the dashboard, project view, chapter view, scene editor,
// autosave behaviour, and user interactions.


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
// This includes first-line indent, line spacing, and paragraph indent.
import { ParagraphFormatting } from "./editorExtensions.js";


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

// Used to calculate the live word count inside the scene editor.
import { countSceneWords } from "./wordCount.js";


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

    // Displays autosave status beneath the editor.
    const saveStatus = document.querySelector("#scene-save-status");

    // Displays the live scene word count beneath the editor.
    const sceneWordCount = document.querySelector("#scene-word-count");


    // Basic formatting controls.
    const boldButton = document.querySelector("#editor-bold");
    const italicButton = document.querySelector("#editor-italic");
    const underlineButton = document.querySelector("#editor-underline");


    // Alignment controls.
    const alignLeftButton = document.querySelector("#editor-align-left");
    const alignCenterButton = document.querySelector("#editor-align-center");
    const alignRightButton = document.querySelector("#editor-align-right");
    const alignJustifyButton = document.querySelector("#editor-align-justify");


    // Manuscript paragraph formatting controls.
    const firstLineIndentButton = document.querySelector(
        "#editor-first-line-indent"
    );

    const indentButton = document.querySelector("#editor-indent");
    const outdentButton = document.querySelector("#editor-outdent");
    const lineSpacingSelect = document.querySelector("#editor-line-spacing");


    // History controls.
    const undoButton = document.querySelector("#editor-undo");
    const redoButton = document.querySelector("#editor-redo");


    // Desktop sidebar navigation controls.
    const sidebarChapterButtons = document.querySelectorAll(
        ".editor-sidebar-chapter"
    );

    const sidebarSceneButtons = document.querySelectorAll(
        ".editor-sidebar-scene"
    );


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

            // Provides standard rich-text formatting.
            StarterKit,

            // Allows paragraphs and headings to be aligned.
            TextAlign.configure({
                types: ["heading", "paragraph"]
            }),

            /*
             * Adds StoryForge-specific paragraph formatting.
             *
             * Paragraphs can store:
             * - first-line indentation
             * - line spacing
             * - whole-paragraph indentation
             */
            ParagraphFormatting
        ],

        // Load previously saved scene content.
        content: scene.content || "<p></p>",

        /*
         * Apply temporary styling directly to the editable writing area.
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
    // SAVE HELPERS
    // ========================================================

    /*
     * Save the current TipTap document into the selected scene.
     */
    function saveCurrentScene() {

        // Get the complete formatted document as HTML.
        const content = editor.getHTML();

        // Save the scene content and update timestamps.
        updateSceneContent(
            projectId,
            chapterId,
            sceneId,
            content
        );
    }


    /*
     * Change the autosave message displayed beneath the editor.
     */
    function setSaveStatus(message) {

        saveStatus.textContent = message;
    }


    // ========================================================
    // AUTOSAVE STATE
    // ========================================================

    /*
     * Stores the currently scheduled autosave timer.
     *
     * Each new document change cancels the previous timer.
     */
    let autosaveTimeout = null;


    /*
     * Tracks whether the editor contains changes that have not
     * yet been persisted into localStorage.
     */
    let hasUnsavedChanges = false;


    // ========================================================
    // AUTOSAVE
    // ========================================================

    /*
     * Schedule an automatic save after the author stops editing
     * for one second.
     *
     * This is known as debouncing.
     *
     * It prevents StoryForge from writing to localStorage after
     * every individual keystroke.
     */
    function scheduleAutosave() {

        // Mark the document as containing unsaved changes.
        hasUnsavedChanges = true;

        // Update the visible status.
        setSaveStatus("Unsaved changes");


        /*
         * Cancel the previous countdown if the author continued typing.
         */
        if (autosaveTimeout) {

            clearTimeout(autosaveTimeout);
        }


        // Start a fresh one-second autosave countdown.
        autosaveTimeout = setTimeout(() => {

            // Tell the author that autosave is running.
            setSaveStatus("Saving...");

            // Persist the latest editor content.
            saveCurrentScene();

            // The document is now saved.
            hasUnsavedChanges = false;

            // Clear the completed timer reference.
            autosaveTimeout = null;

            // Confirm that autosave finished.
            setSaveStatus("Saved");

        }, 1000);
    }


    /*
     * Immediately complete any pending autosave.
     *
     * This is used before navigation so writing cannot be lost
     * if the author clicks away before the one-second timer finishes.
     */
    function flushAutosave() {

        // Cancel any scheduled autosave timer.
        if (autosaveTimeout) {

            clearTimeout(autosaveTimeout);

            autosaveTimeout = null;
        }


        // Save immediately if the editor contains unsaved changes.
        if (hasUnsavedChanges) {

            setSaveStatus("Saving...");

            saveCurrentScene();

            hasUnsavedChanges = false;

            setSaveStatus("Saved");
        }
    }


    /*
     * Force an immediate save regardless of whether StoryForge
     * currently believes the document has unsaved changes.
     *
     * Used by the manual Save Scene button.
     */
    function saveImmediately() {

        // Cancel any pending autosave.
        if (autosaveTimeout) {

            clearTimeout(autosaveTimeout);

            autosaveTimeout = null;
        }

        // Persist the editor's current state immediately.
        setSaveStatus("Saving...");

        saveCurrentScene();

        // Everything currently visible is now stored.
        hasUnsavedChanges = false;

        setSaveStatus("Saved");
    }


    // ========================================================
    // WORD COUNT HELPERS
    // ========================================================

    /*
     * Format a number for display beneath the editor.
     *
     * Examples:
     * 1    -> "1 word"
     * 1250 -> "1,250 words"
     */
    function formatLiveWordCount(count) {

        const label = count === 1
            ? "word"
            : "words";

        return `${count.toLocaleString()} ${label}`;
    }


    /*
     * Recalculate the scene word count from the editor's current HTML.
     */
    function updateLiveWordCount() {

        // Get the scene's current formatted HTML from TipTap.
        const content = editor.getHTML();

        // Count only the visible written words.
        const wordCount = countSceneWords(content);

        // Update the muted word-count display beneath the editor.
        sceneWordCount.textContent =
            formatLiveWordCount(wordCount);
    }


    // ========================================================
    // TOOLBAR HELPERS
    // ========================================================

    /*
     * Add or remove Bootstrap's active class depending on whether
     * a formatting option is active at the current cursor position.
     */
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


    /*
     * Read the custom formatting attributes belonging to the
     * paragraph containing the current cursor or selection.
     */
    function getParagraphAttributes() {

        return editor.getAttributes("paragraph");
    }


    /*
     * Convert a stored inch value such as "0.5in" into a number.
     *
     * If no valid value exists, treat the paragraph as having
     * zero additional indentation.
     */
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

    // Keep toolbar controls in sync with the current paragraph.
    function updateToolbarState() {

        // ----------------------------------------------------
        // BASIC TEXT FORMATTING
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // TEXT ALIGNMENT
        // ----------------------------------------------------

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


        // ----------------------------------------------------
        // MANUSCRIPT PARAGRAPH FORMATTING
        // ----------------------------------------------------

        const paragraphAttributes =
            getParagraphAttributes();


        // Show whether the current paragraph has a first-line indent.
        setButtonActive(
            firstLineIndentButton,
            paragraphAttributes.textIndent === "0.5in"
        );


        // Match the line-spacing dropdown to the current paragraph.
        lineSpacingSelect.value =
            paragraphAttributes.lineHeight || "";


        // Outdent is unavailable when the paragraph is already at zero.
        outdentButton.disabled =
            getParagraphIndentAmount() <= 0;


        // ----------------------------------------------------
        // UNDO / REDO
        // ----------------------------------------------------

        // Disable Undo if there is nothing available to undo.
        undoButton.disabled = !editor
            .can()
            .chain()
            .focus()
            .undo()
            .run();


        // Disable Redo if there is nothing available to redo.
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

    // Refresh toolbar state when the cursor or selection changes.
    editor.on(
        "selectionUpdate",
        updateToolbarState
    );


    // Refresh toolbar state whenever an editor transaction occurs.
    editor.on(
        "transaction",
        updateToolbarState
    );


    /*
     * Whenever the actual document changes:
     *
     * - update the word count
     * - start/restart the autosave timer
     */
    editor.on("update", () => {

        updateLiveWordCount();

        scheduleAutosave();
    });


    // Set the correct states when the editor first opens.
    updateToolbarState();
    updateLiveWordCount();
    setSaveStatus("Saved");


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
    // FIRST-LINE INDENT
    // ========================================================

    /*
     * Toggle a standard manuscript-style 0.5-inch
     * first-line indent on the current paragraph.
     */
    firstLineIndentButton.addEventListener("click", () => {

        const attributes =
            getParagraphAttributes();


        // Remove the indent if already active, otherwise apply it.
        const newIndent =
            attributes.textIndent === "0.5in"
                ? null
                : "0.5in";


        editor
            .chain()
            .focus()
            .updateAttributes(
                "paragraph",
                {
                    textIndent: newIndent
                }
            )
            .run();
    });


    // ========================================================
    // WHOLE-PARAGRAPH INDENTATION
    // ========================================================

    // Increase the entire paragraph indent by half an inch.
    indentButton.addEventListener("click", () => {

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
                    marginLeft: `${newIndent}in`
                }
            )
            .run();
    });


    // Decrease the entire paragraph indent by half an inch.
    outdentButton.addEventListener("click", () => {

        const currentIndent =
            getParagraphIndentAmount();


        // Prevent indentation from becoming negative.
        const newIndent = Math.max(
            0,
            currentIndent - 0.5
        );


        /*
         * Remove the style entirely when returning to zero indent.
         */
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
                    marginLeft: marginLeft
                }
            )
            .run();
    });


    // ========================================================
    // LINE SPACING
    // ========================================================

    // Apply the selected line spacing to the current paragraph.
    lineSpacingSelect.addEventListener("change", () => {

        const selectedSpacing =
            lineSpacingSelect.value;


        /*
         * An empty value represents normal/default spacing,
         * so no line-height style needs to be stored.
         */
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
                    lineHeight: lineHeight
                }
            )
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
    // MANUAL SAVE
    // ========================================================

    /*
     * Keep the manual Save Scene button as an immediate override.
     *
     * Autosave means the author normally does not need to use it.
     */
    saveButton.addEventListener("click", () => {

        // Persist immediately rather than waiting for autosave.
        saveImmediately();


        // Give an additional visual confirmation on the button itself.
        saveButton.textContent = "Saved ✓";


        // Return the button to its normal label shortly afterward.
        setTimeout(() => {

            if (saveButton.isConnected) {

                saveButton.textContent =
                    "Save Scene";
            }

        }, 1200);
    });


    // ========================================================
    // DESKTOP SIDEBAR CHAPTER NAVIGATION
    // ========================================================

    /*
     * Allow the author to jump directly to any chapter from
     * the desktop editor sidebar.
     */
    sidebarChapterButtons.forEach((chapterButton) => {

        chapterButton.addEventListener("click", () => {

            // Read the chapter selected in the sidebar.
            const targetChapterId =
                chapterButton.dataset.chapterId;


            /*
             * Immediately complete any pending autosave before leaving.
             */
            flushAutosave();


            // Clean up the current TipTap editor instance.
            editor.destroy();


            // Open the selected chapter.
            openChapter(
                projectId,
                targetChapterId
            );
        });
    });


    // ========================================================
    // DESKTOP SIDEBAR SCENE NAVIGATION
    // ========================================================

    /*
     * Allow the author to jump directly between scenes,
     * including scenes belonging to another chapter.
     */
    sidebarSceneButtons.forEach((sceneButton) => {

        sceneButton.addEventListener("click", () => {

            // Read the destination chapter and scene IDs.
            const targetChapterId =
                sceneButton.dataset.chapterId;

            const targetSceneId =
                sceneButton.dataset.sceneId;


            /*
             * Do nothing if the current scene was clicked again.
             *
             * Rebuilding the current editor would accomplish
             * nothing except upsetting JavaScript for sport.
             */
            if (
                targetChapterId === chapterId &&
                targetSceneId === sceneId
            ) {
                return;
            }


            // Complete any pending autosave before switching scenes.
            flushAutosave();


            // Destroy the current TipTap editor instance.
            editor.destroy();


            // Open the selected scene directly.
            openScene(
                projectId,
                targetChapterId,
                targetSceneId
            );
        });
    });


    // ========================================================
    // BACK NAVIGATION
    // ========================================================

    // Return to the chapter that contains this scene.
    backButton.addEventListener("click", () => {

        /*
         * Complete any pending autosave before leaving the editor.
         *
         * Even if the author types something and immediately clicks
         * Back before the one-second timer finishes, the writing survives.
         */
        flushAutosave();


        /*
         * Destroy the TipTap instance before replacing the editor view.
         */
        editor.destroy();


        // Return to the chapter containing the scene.
        openChapter(
            projectId,
            chapterId
        );
    });
}


// ============================================================
// APPLICATION START
// ============================================================

// Show the project dashboard when StoryForge first loads.
showDashboard();