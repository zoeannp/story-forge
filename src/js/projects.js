// Creates and persists project records and their associated chapters and scenes.

import { getProjects, saveProjects } from "./storage.js";

import { createChapter } from "./chapters.js";

import { createScene } from "./scenes.js";


// ============================================================
// PROJECT CREATION
// ============================================================

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

    // Load the current projects from storage.
    const projects = getProjects();

    // Create the new project record.
    const newProject = createProject(title);

    // Add the project to the stored collection.
    projects.push(newProject);

    // Save the updated collection.
    saveProjects(projects);

    return newProject;
}


// ============================================================
// PROJECT LOOKUP
// ============================================================

// Find one project by its persisted ID.
export function getProjectById(id) {

    // Load all stored projects.
    const projects = getProjects();

    // Return the project with the matching ID.
    return projects.find(project => project.id === id);
}


// ============================================================
// CHAPTER MANAGEMENT
// ============================================================

// Create a chapter, attach it to a project, and update the project timestamp.
export function addChapterToProject(projectId, title) {

    // Load the current project collection from storage.
    const projects = getProjects();

    // Find the project that should receive the new chapter.
    const project = projects.find(
        project => project.id === projectId
    );

    // Do not modify storage if the requested project no longer exists.
    if (!project) {
        return null;
    }

    // Create the new chapter record.
    const chapter = createChapter(title);

    // Add the chapter to the selected project.
    project.chapters.push(chapter);

    // Record when the project was last modified.
    project.updatedAt = new Date().toISOString();

    // Save the updated project collection.
    saveProjects(projects);

    return chapter;
}


// ============================================================
// SCENE MANAGEMENT
// ============================================================

// Create a scene and attach it to a specific chapter inside a project.
export function addSceneToChapter(projectId, chapterId, title) {

    // Load the current project collection from storage.
    const projects = getProjects();

    // Find the project that contains the target chapter.
    const project = projects.find(
        project => project.id === projectId
    );

    // Do not modify storage if the project could not be found.
    if (!project) {
        return null;
    }

    // Find the chapter that should receive the new scene.
    const chapter = project.chapters.find(
        chapter => chapter.id === chapterId
    );

    // Do not modify storage if the chapter could not be found.
    if (!chapter) {
        return null;
    }

    // Create the new scene record.
    const scene = createScene(title);

    // Add the scene to the selected chapter.
    chapter.scenes.push(scene);

    // Record when the chapter was last modified.
    chapter.updatedAt = new Date().toISOString();

    // The project was also modified because one of its chapters changed.
    project.updatedAt = new Date().toISOString();

    // Save the updated project collection.
    saveProjects(projects);

    return scene;
}

// Update the written content of an existing scene.
export function updateSceneContent(projectId, chapterId, sceneId, content) {

    // Load the current project collection from storage.
    const projects = getProjects();

    // Find the project that contains the scene.
    const project = projects.find(
        project => project.id === projectId
    );

    // Stop if the project could not be found.
    if (!project) {
        return null;
    }

    // Find the chapter that contains the scene.
    const chapter = project.chapters.find(
        chapter => chapter.id === chapterId
    );

    // Stop if the chapter could not be found.
    if (!chapter) {
        return null;
    }

    // Find the scene that should be updated.
    const scene = chapter.scenes.find(
        scene => scene.id === sceneId
    );

    // Stop if the scene could not be found.
    if (!scene) {
        return null;
    }

    // Save the new scene content.
    scene.content = content;

    // Record when the scene was last modified.
    scene.updatedAt = new Date().toISOString();

    // The parent chapter and project were also modified.
    chapter.updatedAt = new Date().toISOString();
    project.updatedAt = new Date().toISOString();

    // Save the updated project collection.
    saveProjects(projects);

    return scene;
}