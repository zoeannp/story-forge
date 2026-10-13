
/*
 * StoryForge Chapter Data Model
 *
 * Creates chapter records within a project.
 *
 * Chapter formatting metadata is stored separately
 * from the actual scene content.
 *
 * Chapter numbering is calculated from the chapter's
 * position in the project, not stored as a fixed number.
 */

/**
 * Create a new chapter.
 *
 * @param {string} title - Internal chapter title.
 * @returns {object} New chapter record.
 */
export function createChapter(title) {
    const now = new Date().toISOString();

    return {
        id: crypto.randomUUID(),

        // Existing chapter title.
        title: title,

        // Optional manuscript heading settings.
        heading: {
            showNumber: true,
            numberStyle: "words",
            showTitle: true,
            customTitle: "",
            layout: "stacked"
        },

        // Optional chapter-level POV marker.
        pov: {
            character: "",
            showMarker: false
        },

        createdAt: now,
        updatedAt: now,

        scenes: []
    };
}
