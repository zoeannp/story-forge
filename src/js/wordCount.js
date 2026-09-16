// Calculates word counts for scenes, chapters, and projects.


// ============================================================
// SCENE WORD COUNT
// ============================================================

/*
 * Count the words inside a scene.
 *
 * Scene content is stored as HTML because TipTap preserves
 * formatting such as bold, italics, indentation, and spacing.
 *
 * We therefore remove the HTML before counting the actual words.
 */
export function countSceneWords(content) {

    // Return zero if the scene contains no content.
    if (!content) {
        return 0;
    }

    // Parse the stored HTML into a temporary document.
    const parser = new DOMParser();

    const document = parser.parseFromString(
        content,
        "text/html"
    );

    // Extract only the visible text from the HTML.
    const text = document.body.textContent || "";

    // Remove unnecessary whitespace from the beginning and end.
    const cleanedText = text.trim();

    // Return zero if the scene contains no visible text.
    if (!cleanedText) {
        return 0;
    }

    /*
     * Split the text wherever one or more whitespace characters occur.
     *
     * This handles spaces, line breaks, and tabs.
     */
    return cleanedText
        .split(/\s+/)
        .filter(Boolean)
        .length;
}


// ============================================================
// CHAPTER WORD COUNT
// ============================================================

// Calculate the total number of words across every scene in a chapter.
export function countChapterWords(chapter) {

    // Return zero if the chapter has no scenes.
    if (!chapter.scenes || chapter.scenes.length === 0) {
        return 0;
    }

    // Add together the word count from every scene.
    return chapter.scenes.reduce(
        (total, scene) => total + countSceneWords(scene.content),
        0
    );
}


// ============================================================
// PROJECT WORD COUNT
// ============================================================

// Calculate the total number of words across every chapter in a project.
export function countProjectWords(project) {

    // Return zero if the project has no chapters.
    if (!project.chapters || project.chapters.length === 0) {
        return 0;
    }

    // Add together the word count from every chapter.
    return project.chapters.reduce(
        (total, chapter) => total + countChapterWords(chapter),
        0
    );
}