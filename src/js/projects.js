import { getProjects, saveProjects } from "./storage.js";

export function createProject(title) {
    return {
        id: crypto.randomUUID(),
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: []
    };
}

export function addProject(title) {
    const projects = getProjects();

    const newProject = createProject(title);

    projects.push(newProject);

    saveProjects(projects);

    return newProject;
}