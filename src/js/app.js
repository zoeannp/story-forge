import { addProject } from "./projects.js";
import { renderCreateProjectForm } from "./ui.js";

const app = document.querySelector("#app");

renderCreateProjectForm(app);

const form = document.querySelector("#create-project-form");
const titleInput = document.querySelector("#project-title");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = titleInput.value.trim();

    if (!title) {
        return;
    }

    const project = addProject(title);

    console.log("Project created:", project);

    titleInput.value = "";
});