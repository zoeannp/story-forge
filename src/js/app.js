// Coordinates the dashboard, project view, chapter view, and user interactions.

import {
    addProject,
    getProjectById,
    addChapterToProject,
    addSceneToChapter
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView,
    renderChapterView
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
    // This could happen if stored data changed before the project was opened.
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

// Render one chapter and attach handlers for navigation and scene creation.
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
}


// ============================================================
// APPLICATION START
// ============================================================

// Show the project dashboard when StoryForge first loads.
showDashboard();