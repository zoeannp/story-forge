
/*
 * StoryForge Scene Data Model
 *
 * Creates scene records within chapters.
 *
 * Each scene retains its own content and identity.
 * POV metadata is stored separately from scene HTML.
 */

/**
 * Create a new scene.
 *
 * @param {string} title - Internal scene title.
 * @returns {object} New scene record.
 */
export function createScene(title) {
    const now = new Date().toISOString();

    return {
        id: crypto.randomUUID(),

        title: title,
        content: "",

        // Optional scene-level POV information.
        pov: {
            character: "",
            showMarker: false
        },

        createdAt: now,
        updatedAt: now
    };
}
