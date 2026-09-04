// Creates the data records used to represent chapters in a project.
 
// Build a new chapter with empty scenes and creation metadata.
export function createChapter(title) {
    return {
        id: crypto.randomUUID(),
        title: title,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        scenes: []
    };
}