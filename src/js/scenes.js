// Creates the data records used to represent scenes within a chapter.

// Build a new scene with empty content and creation metadata.

export function createScene(title) {
    return {
        id: crypto.randomUUID(),
        title: title,
        content: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}