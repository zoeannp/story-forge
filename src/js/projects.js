// Creates and persists project records and their associated chapters.
import { getProjects, saveProjects } from "./storage.js";
import { createChapter } from "./chapters.js";

// Build a new project with its initial metadata and empty chapter list.
export function createProject(title) {
    return {
        id: crypto.randomUUID(),
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: []
    };
}

// Add a project to the stored collection and return the new record.
export function addProject(title) {
    const projects = getProjects();

    const newProject = createProject(title);

    projects.push(newProject);

    saveProjects(projects);

    return newProject;
}

// Find one project by its persisted ID.
export function getProjectById(id) {
    const projects = getProjects();

    return projects.find(project => project.id === id);
}

// Create a chapter, attach it to a project, and update the project timestamp.
export function addChapterToProject(projectId, title) {
    const projects = getProjects();

    const project = projects.find(project => project.id === projectId);

    // Do not modify storage when the requested project no longer exists.
    if (!project) {
        return null;
    }

    const chapter = createChapter(title);

    project.chapters.push(chapter);
    project.updatedAt = new Date().toISOString();

    saveProjects(projects);

    return chapter;

}