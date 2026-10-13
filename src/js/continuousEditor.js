
/*
 * StoryForge Continuous Manuscript Editor
 *
 * One TipTap instance for an entire chapter or book.
 *
 * This stage:
 * - Preserves supported rich-text formatting
 * - Keeps chapter and scene IDs
 * - Displays a continuous manuscript
 * - Supports editing within scenes
 * - Prevents edits from crossing scene boundaries
 *
 * Saving is deliberately not enabled yet.
 */

import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { generateJSON } from "@tiptap/html";
import { Plugin } from "@tiptap/pm/state";

import { ParagraphFormatting } from "./editorExtensions.js";


// ============================================================
// CHAPTER NODE
// ============================================================

const ManuscriptChapter = Node.create({
    name: "manuscriptChapter",
    group: "block",
    content: "manuscriptScene*",
    defining: true,
    isolating: true,

    addAttributes() {
        return {
            chapterId: { default: null },
            title: { default: "" }
        };
    },

    parseHTML() {
        return [{
            tag: "section[data-manuscript-chapter]"
        }];
    },

    renderHTML({ node }) {
        return [
            "section",
            {
                "data-manuscript-chapter": "",
                "data-chapter-id": node.attrs.chapterId,
                "data-chapter-title": node.attrs.title,
                class: "storyforge-continuous-chapter"
            },
            0
        ];
    }
});


// ============================================================
// SCENE NODE
// ============================================================

const ManuscriptScene = Node.create({
    name: "manuscriptScene",
    group: "block",
    content: "block+",
    defining: true,
    isolating: true,

    addAttributes() {
        return {
            chapterId: { default: null },
            sceneId: { default: null }
        };
    },

    parseHTML() {
        return [{
            tag: "section[data-manuscript-scene]"
        }];
    },

    renderHTML({ node }) {
        return [
            "section",
            {
                "data-manuscript-scene": "",
                "data-chapter-id": node.attrs.chapterId,
                "data-scene-id": node.attrs.sceneId,
                class: "storyforge-continuous-scene"
            },
            0
        ];
    }
});


// ============================================================
// EDITING BOUNDARY PROTECTION
// ============================================================

/*
 * Reject transactions that alter the manuscript's
 * chapter/scene structure or change multiple scenes.
 *
 * This is a conservative first version. It prioritises
 * protecting the manuscript over cross-scene editing.
 */

function getStructure(doc) {
    const chapters = [];

    doc.forEach(chapter => {
        const scenes = [];

        chapter.forEach(scene => {
            scenes.push({
                chapterId: scene.attrs.chapterId,
                sceneId: scene.attrs.sceneId
            });
        });

        chapters.push({
            chapterId: chapter.attrs.chapterId,
            scenes
        });
    });

    return chapters;
}

function getSceneContents(doc) {
    const scenes = new Map();

    doc.forEach(chapter => {
        chapter.forEach(scene => {
            scenes.set(
                `${chapter.attrs.chapterId}:${scene.attrs.sceneId}`,
                scene.content.toJSON()
            );
        });
    });

    return scenes;
}

function createBoundaryProtection() {
    return new Plugin({
        filterTransaction(transaction, state) {
            if (!transaction.docChanged) {
                return true;
            }

            const before = getStructure(state.doc);
            const after = getStructure(transaction.doc);

            if (JSON.stringify(before) !== JSON.stringify(after)) {
                return false;
            }

            const previousContents = getSceneContents(state.doc);
            const nextContents = getSceneContents(transaction.doc);

            let changedScenes = 0;

            for (const [id, content] of previousContents) {
                const next = nextContents.get(id);

                if (JSON.stringify(content) !== JSON.stringify(next)) {
                    changedScenes += 1;
                }
            }

            return changedScenes <= 1;
        }
    });
}


// ============================================================
// DOCUMENT CONSTRUCTION
// ============================================================

function parseSceneHTML(html, extensions) {
    const parsed = generateJSON(
        html || "<p></p>",
        extensions
    );

    return parsed.content?.length
        ? parsed.content
        : [{ type: "paragraph" }];
}

function buildManuscriptDocument(chapters, extensions) {
    return {
        type: "doc",

        content: chapters.map(chapter => ({
            type: "manuscriptChapter",

            attrs: {
                chapterId: chapter.id,
                title: chapter.title || ""
            },

            content: (chapter.scenes || []).map(scene => ({
                type: "manuscriptScene",

                attrs: {
                    chapterId: chapter.id,
                    sceneId: scene.id
                },

                content: parseSceneHTML(
                    scene.content,
                    extensions
                )
            }))
        }))
    };
}


// ============================================================
// CREATE CONTINUOUS EDITOR
// ============================================================

export function createContinuousEditor({
    element,
    chapters = [],
    onUpdate = null
}) {
    if (!element) {
        throw new Error(
            "Continuous editor requires a DOM element."
        );
    }

    const extensions = [
        StarterKit,
        ManuscriptChapter,
        ManuscriptScene,

        TextAlign.configure({
            types: ["heading", "paragraph"]
        }),

        ParagraphFormatting
    ];

    const documentJSON = buildManuscriptDocument(
        chapters,
        extensions
    );

    const editor = new Editor({
        element,
        extensions,
        content: documentJSON,

        editorProps: {
            attributes: {
                class: "storyforge-continuous-document",
                spellcheck: "true"
            }
        }
    });

    editor.registerPlugin(createBoundaryProtection());

    if (typeof onUpdate === "function") {
        editor.on("update", () => {
            onUpdate(editor);
        });
    }

    return {
        editor,

        destroy() {
            editor.destroy();
        }
    };
}
