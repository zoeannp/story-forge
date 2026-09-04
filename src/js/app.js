import { addProject } from "./projects.js";
import { getProjects } from "./storage.js";
import {
    renderCreateProjectForm,
    renderProjectList
} from "./ui.js";

const app = document.querySelector("#app");

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