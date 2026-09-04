// Provides the browser localStorage layer for StoryForge projects.
const STORAGE_KEY = "storyforge_projects";

// Serialize the complete project collection into localStorage.
export function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// Read the project collection, falling back to an empty collection on first use.
export function getProjects() {
    const storedProjects = localStorage.getItem(STORAGE_KEY);

    // localStorage returns null before the application has saved any projects.
    if (!storedProjects) {
        return [];
    }

    return JSON.parse(storedProjects);
}