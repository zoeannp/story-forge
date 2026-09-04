const STORAGE_KEY = "storyforge_projects";

export function saveProjects(projects) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getProjects() {
    const storedProjects = localStorage.getItem(STORAGE_KEY);

    if (!storedProjects) {
        return [];
    }

    return JSON.parse(storedProjects);
}