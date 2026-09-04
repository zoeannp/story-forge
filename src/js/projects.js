export function createProject(title) {
    return {
        id: crypto.randomUUID(),
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chapters: []
    };
}