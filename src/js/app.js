// Coordinates the dashboard, project view, and user interactions.
import {
    addProject,
    getProjectById,
    addChapterToProject
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView
} from "./ui.js";

const app = document.querySelector("#app");

// Render the dashboard and attach handlers for creating and opening projects.
function showDashboard() {
    renderCreateProjectForm(app);

    const form = document.querySelector("#create-project-form");
    const titleInput = document.querySelector("#project-title");
    const projectList = document.querySelector("#project-list");

    // Re-read storage so the list always reflects the latest project data.
    function refreshProjectList() {
        const projects = getProjects();
        renderProjectList(projectList, projects);
    }

    refreshProjectList();

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = titleInput.value.trim();

        if (!title) {
            return;
        }

        addProject(title);
        titleInput.value = "";

        refreshProjectList();
    });

    projectList.addEventListener("click", (event) => {
        const projectCard = event.target.closest(".project-card");

        // Ignore clicks that did not originate inside a project card.
        if (!projectCard) {
            return;
        }

        const projectId = projectCard.dataset.projectId;

        openProject(projectId);
    });
}

// Render one project and attach handlers for navigation and chapter creation.
function openProject(projectId) {
    const project = getProjectById(projectId);

    // A missing project can happen if stored data changed before the click.
    if (!project) {
        return;
    }

    renderProjectView(app, project);

    const backButton = document.querySelector("#back-to-projects");
    const chapterForm = document.querySelector("#create-chapter-form");
    const chapterTitleInput = document.querySelector("#chapter-title");

    backButton.addEventListener("click", () => {
        showDashboard();
    });

    chapterForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const title = chapterTitleInput.value.trim();

        if (!title) {
            return;
        }

        addChapterToProject(projectId, title);

        openProject(projectId);
    });
}

showDashboard();