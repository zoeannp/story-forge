
/*
 * StoryForge Continuous Manuscript Editor
 *
 * One TipTap instance for an entire chapter or book.
 *
 * Features:
 * - Continuous rich-text editing
 * - Preserves chapter and scene identities
 * - Protects chapter/scene boundaries
 * - Detects changed scenes
 * - Supports per-scene autosaving
 * - Displays chapter numbers, headings and POV markers
 *
 * Manuscript headings and POV markers are display-only.
 * They are never included in saved scene HTML.
 */

import { Editor, Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { generateJSON, generateHTML } from "@tiptap/html";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

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
            chapterId: {
                default: null,
                parseHTML: element =>
                    element.getAttribute("data-chapter-id"),
                renderHTML: attributes => ({
                    "data-chapter-id": attributes.chapterId
                })
            },

            title: {
                default: "",
                parseHTML: element =>
                    element.getAttribute("data-chapter-title") || "",
                renderHTML: attributes => ({
                    "data-chapter-title": attributes.title
                })
            }
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
            chapterId: {
                default: null,
                parseHTML: element =>
                    element.getAttribute("data-chapter-id"),
                renderHTML: attributes => ({
                    "data-chapter-id": attributes.chapterId
                })
            },

            sceneId: {
                default: null,
                parseHTML: element =>
                    element.getAttribute("data-scene-id"),
                renderHTML: attributes => ({
                    "data-scene-id": attributes.sceneId
                })
            }
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
// SCENE IDENTIFICATION
// ============================================================

function getSceneKey(chapterId, sceneId) {
    return JSON.stringify([chapterId, sceneId]);
}


// ============================================================
// CHAPTER NUMBER FORMATTING
// ============================================================

function numberToWords(number) {
    const ones = [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen"
    ];

    const tens = [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety"
    ];

    if (number < 20) {
        return ones[number];
    }

    if (number < 100) {
        const remainder = number % 10;

        return (
            tens[Math.floor(number / 10)] +
            (remainder ? `-${ones[remainder]}` : "")
        );
    }

    if (number < 1000) {
        const hundreds = Math.floor(number / 100);
        const remainder = number % 100;

        return (
            `${ones[hundreds]} Hundred` +
            (remainder ? ` ${numberToWords(remainder)}` : "")
        );
    }

    return String(number);
}

function formatChapterNumber(number, style) {
    if (style === "numeric") {
        return `CHAPTER ${number}`;
    }

    return `CHAPTER ${numberToWords(number).toUpperCase()}`;
}


// ============================================================
// CHAPTER HEADING SETTINGS
// ============================================================

function getChapterHeading(chapter, chapterNumber) {
    const heading = {
        showNumber: true,
        numberStyle: "words",
        showTitle: true,
        customTitle: "",
        layout: "stacked",
        ...(chapter.heading || {})
    };

    const numberText = heading.showNumber
        ? formatChapterNumber(
            chapterNumber,
            heading.numberStyle
        )
        : "";

    let titleText =
        heading.customTitle?.trim() ||
        chapter.title?.trim() ||
        "";

    /*
     * Avoid displaying a generic title twice:
     *
     * CHAPTER ONE
     * Chapter One
     */

    const isGenericChapterTitle =
        /^chapter\s+([0-9]+|[a-z]+(?:[-\s][a-z]+)*)$/i
            .test(titleText);

    if (isGenericChapterTitle && numberText) {
        titleText = "";
    }

    if (!heading.showTitle) {
        titleText = "";
    }

    return {
        numberText,
        titleText,
        layout: heading.layout
    };
}


// ============================================================
// DISPLAY-ONLY ELEMENTS
// ============================================================

function createDisplayElement(className, value) {
    const element = document.createElement("div");

    element.className = className;
    element.textContent = value;
    element.contentEditable = "false";

    return element;
}

function createChapterHeadingElement(
    chapter,
    chapterNumber
) {
    const heading = getChapterHeading(
        chapter,
        chapterNumber
    );

    const pov = {
        character: "",
        showMarker: false,
        ...(chapter.pov || {})
    };

    const container = document.createElement("div");

    container.className =
        "storyforge-manuscript-chapter-heading";

    container.contentEditable = "false";

    if (heading.layout === "inline") {
        const combined = [
            heading.numberText,
            heading.titleText
        ].filter(Boolean).join(": ");

        if (combined) {
            container.appendChild(
                createDisplayElement(
                    "storyforge-chapter-heading-inline",
                    combined
                )
            );
        }
    } else {
        if (heading.numberText) {
            container.appendChild(
                createDisplayElement(
                    "storyforge-chapter-number",
                    heading.numberText
                )
            );
        }

        if (heading.titleText) {
            container.appendChild(
                createDisplayElement(
                    "storyforge-chapter-title",
                    heading.titleText
                )
            );
        }
    }

    if (pov.showMarker && pov.character?.trim()) {
        container.appendChild(
            createDisplayElement(
                "storyforge-chapter-pov",
                pov.character.trim()
            )
        );
    }

    return container;
}

function createScenePOVElement(scene) {
    const pov = {
        character: "",
        showMarker: false,
        ...(scene.pov || {})
    };

    if (!pov.showMarker || !pov.character?.trim()) {
        return null;
    }

    return createDisplayElement(
        "storyforge-scene-pov",
        pov.character.trim()
    );
}


// ============================================================
// MANUSCRIPT DISPLAY DECORATIONS
// ============================================================

function createManuscriptDecorations(
    chapters,
    chapterNumbers
) {
    const chapterLookup = new Map();
    const sceneLookup = new Map();

    chapters.forEach((chapter, index) => {
        chapterLookup.set(chapter.id, {
            chapter,
            number: chapterNumbers.get(chapter.id) ?? index + 1
        });

        (chapter.scenes || []).forEach(scene => {
            sceneLookup.set(
                getSceneKey(chapter.id, scene.id),
                scene
            );
        });
    });

    return new Plugin({
        key: new PluginKey("storyforgeManuscriptDisplay"),

        props: {
            decorations(state) {
                const decorations = [];

                state.doc.forEach((chapterNode, chapterPos) => {
                    if (
                        chapterNode.type.name !==
                        "manuscriptChapter"
                    ) {
                        return;
                    }

                    const info = chapterLookup.get(
                        chapterNode.attrs.chapterId
                    );

                    if (!info) {
                        return;
                    }

                    const heading =
                        createChapterHeadingElement(
                            info.chapter,
                            info.number
                        );

                    if (heading.childNodes.length > 0) {
                        decorations.push(
                            Decoration.widget(
                                chapterPos + 1,
                                heading,
                                {
                                    side: -1,
                                    key:
                                        `chapter-heading-${chapterNode.attrs.chapterId}`
                                }
                            )
                        );
                    }

                    chapterNode.forEach(
                        (sceneNode, sceneOffset) => {
                            if (
                                sceneNode.type.name !==
                                "manuscriptScene"
                            ) {
                                return;
                            }

                            const key = getSceneKey(
                                chapterNode.attrs.chapterId,
                                sceneNode.attrs.sceneId
                            );

                            const scene = sceneLookup.get(key);

                            if (!scene) {
                                return;
                            }

                            const marker =
                                createScenePOVElement(scene);

                            if (!marker) {
                                return;
                            }

                            const position =
                                chapterPos +
                                1 +
                                sceneOffset +
                                1;

                            decorations.push(
                                Decoration.widget(
                                    position,
                                    marker,
                                    {
                                        side: -1,
                                        key: `scene-pov-${key}`
                                    }
                                )
                            );
                        }
                    );
                });

                return DecorationSet.create(
                    state.doc,
                    decorations
                );
            }
        }
    });
}


// ============================================================
// MANUSCRIPT STRUCTURE
// ============================================================

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


// ============================================================
// SCENE CONTENT COLLECTION
// ============================================================

function getSceneContents(doc) {
    const scenes = new Map();

    doc.forEach(chapter => {
        chapter.forEach(scene => {
            const key = getSceneKey(
                chapter.attrs.chapterId,
                scene.attrs.sceneId
            );

            scenes.set(
                key,
                scene.content.toJSON()
            );
        });
    });

    return scenes;
}


// ============================================================
// EDITING BOUNDARY PROTECTION
// ============================================================

function createBoundaryProtection() {
    return new Plugin({
        filterTransaction(transaction, state) {
            if (!transaction.docChanged) {
                return true;
            }

            const beforeStructure = getStructure(state.doc);
            const afterStructure = getStructure(
                transaction.doc
            );

            if (
                JSON.stringify(beforeStructure) !==
                JSON.stringify(afterStructure)
            ) {
                return false;
            }

            const previousContents =
                getSceneContents(state.doc);

            const nextContents =
                getSceneContents(transaction.doc);

            let changedScenes = 0;

            for (const [key, previousContent] of previousContents) {
                const nextContent = nextContents.get(key);

                if (
                    JSON.stringify(previousContent) !==
                    JSON.stringify(nextContent)
                ) {
                    changedScenes += 1;
                }

                if (changedScenes > 1) {
                    return false;
                }
            }

            return true;
        }
    });
}


// ============================================================
// SCENE HTML PARSING
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


// ============================================================
// BUILD CONTINUOUS DOCUMENT
// ============================================================

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
// EXTRACT SCENE HTML
// ============================================================

function sceneContentToHTML(sceneNode, extensions) {
    return generateHTML(
        {
            type: "doc",
            content: sceneNode.content.toJSON()
        },
        extensions
    );
}


// ============================================================
// EXTRACT ALL SCENES
// ============================================================

function extractScenes(doc, extensions) {
    const scenes = [];

    doc.forEach(chapter => {
        chapter.forEach(scene => {
            scenes.push({
                chapterId: chapter.attrs.chapterId,
                sceneId: scene.attrs.sceneId,

                html: sceneContentToHTML(
                    scene,
                    extensions
                )
            });
        });
    });

    return scenes;
}


// ============================================================
// FIND CHANGED SCENES
// ============================================================

function findChangedScenes(
    previousDoc,
    currentDoc,
    extensions
) {
    const previousContents =
        getSceneContents(previousDoc);

    const changedScenes = [];

    currentDoc.forEach(chapter => {
        chapter.forEach(scene => {
            const chapterId = chapter.attrs.chapterId;
            const sceneId = scene.attrs.sceneId;

            const key = getSceneKey(
                chapterId,
                sceneId
            );

            const previousContent =
                previousContents.get(key);

            const currentContent =
                scene.content.toJSON();

            if (
                JSON.stringify(previousContent) !==
                JSON.stringify(currentContent)
            ) {
                changedScenes.push({
                    chapterId,
                    sceneId,

                    html: sceneContentToHTML(
                        scene,
                        extensions
                    )
                });
            }
        });
    });

    return changedScenes;
}


// ============================================================
// FIND DOCUMENT POSITIONS
// ============================================================

/*
 * Navigation uses TipTap document positions rather than
 * depending entirely on HTML selectors.
 */

function findSectionPosition(
    doc,
    targetChapterId,
    targetSceneId = null
) {
    let result = null;

    doc.forEach((chapterNode, chapterPos) => {
        if (result !== null) return;

        if (
            chapterNode.attrs.chapterId !==
            targetChapterId
        ) {
            return;
        }

        if (!targetSceneId) {
            result = chapterPos;
            return;
        }

        chapterNode.forEach((sceneNode, sceneOffset) => {
            if (result !== null) return;

            if (
                sceneNode.attrs.sceneId ===
                targetSceneId
            ) {
                result =
                    chapterPos + 1 + sceneOffset;
            }
        });
    });

    return result;
}


// ============================================================
// CREATE CONTINUOUS EDITOR
// ============================================================

export function createContinuousEditor({
    element,
    chapters = [],
    chapterNumbers = null,
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

    const numbers = chapterNumbers instanceof Map
        ? chapterNumbers
        : new Map(
            chapters.map((chapter, index) => [
                chapter.id,
                index + 1
            ])
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

    editor.registerPlugin(
        createBoundaryProtection()
    );

    editor.registerPlugin(
        createManuscriptDecorations(
            chapters,
            numbers
        )
    );

    let previousDoc = editor.state.doc;

    editor.on("update", () => {
        const currentDoc = editor.state.doc;

        const changedScenes = findChangedScenes(
            previousDoc,
            currentDoc,
            extensions
        );

        previousDoc = currentDoc;

        if (
            changedScenes.length > 0 &&
            typeof onUpdate === "function"
        ) {
            onUpdate({
                editor,
                changedScenes
            });
        }
    });

    // --------------------------------------------------------
    // PUBLIC API
    // --------------------------------------------------------

    function getAllScenes() {
        return extractScenes(
            editor.state.doc,
            extensions
        );
    }

    function getCurrentDocument() {
        return editor.getJSON();
    }

    function findChapterPosition(chapterId) {
        return findSectionPosition(
            editor.state.doc,
            chapterId
        );
    }

    function findScenePosition(chapterId, sceneId) {
        return findSectionPosition(
            editor.state.doc,
            chapterId,
            sceneId
        );
    }

    function destroy() {
        editor.destroy();
    }

    return {
        editor,
        getAllScenes,
        getCurrentDocument,
        findChapterPosition,
        findScenePosition,
        destroy
    };
}
