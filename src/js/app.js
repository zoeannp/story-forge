import {
    addProject,
    getProjectById
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView
} from "./ui.js";

const app = document.querySelector("#app");

function showDashboard() {
    renderCreateProjectForm(app);

    const form = document.querySelector("#create-project-form");
    const titleInput = document.querySelector("#project-title");
    const projectList = document.querySelector("#project-list");

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

        if (!projectCard) {
            return;
        }

        const projectId = projectCard.dataset.projectId;

        openProject(projectId);
    });
}

function openProject(projectId) {
    const project = getProjectById(projectId);

    if (!project) {
        return;
    }

    renderProjectView(app, project);

    const backButton = document.querySelector("#back-to-projects");

    backButton.addEventListener("click", () => {
        showDashboard();
    });
}

showDashboard();