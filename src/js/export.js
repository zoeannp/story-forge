
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType
} from "docx";


// ============================================================
// MANUSCRIPT FORMATTING DEFAULTS
// ============================================================

// Word uses half-points for font size.
// 24 half-points = 12 pt.
const FONT = "Times New Roman";
const FONT_SIZE = 24;

// Word uses twips for margins and indentation.
// 1440 twips = 1 inch = 2.54 cm.
const PAGE_MARGIN = 1440;

// 720 twips = 0.5 inch = 1.27 cm.
const FIRST_LINE_INDENT = 720;

// 480 twips = 24 pt line spacing.
// This is double spacing for 12 pt text.
const DOUBLE_SPACING = 480;

const BLACK = "000000";


// ============================================================
// UNIT CONVERSION
// ============================================================

/*
 * Convert CSS length values into Word twips.
 *
 * Supports:
 * - in
 * - cm
 * - mm
 * - pt
 * - px
 *
 * Returns null for unsupported values.
 */
function cssLengthToTwips(value) {
    if (!value) {
        return null;
    }

    const match = String(value)
        .trim()
        .match(/^(-?\d*\.?\d+)(in|cm|mm|pt|px)$/i);

    if (!match) {
        return null;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();

    const multipliers = {
        in: 1440,
        cm: 1440 / 2.54,
        mm: 1440 / 25.4,
        pt: 20,
        px: 15
    };

    return Math.round(amount * multipliers[unit]);
}


// ============================================================
// PARAGRAPH ALIGNMENT
// ============================================================

function getAlignment(value) {
    const alignments = {
        left: AlignmentType.LEFT,
        center: AlignmentType.CENTER,
        right: AlignmentType.RIGHT,
        justify: AlignmentType.JUSTIFIED
    };

    return alignments[value?.trim()?.toLowerCase()]
        || AlignmentType.LEFT;
}


// ============================================================
// LINE SPACING
// ============================================================

/*
 * Convert the TipTap line-height setting to Word twips.
 *
 * Examples:
 * 1   = single spacing
 * 1.5 = one-and-a-half spacing
 * 2   = double spacing
 *
 * When no custom value exists, use double spacing.
 */
function getLineSpacing(value) {
    if (!value) {
        return DOUBLE_SPACING;
    }

    const spacing = String(value).trim();

    // Unitless CSS line-height multiplier.
    if (/^\d*\.?\d+$/.test(spacing)) {
        return Math.round(
            Number(spacing) * FONT_SIZE * 10
        );
    }

    // Percentage line-height.
    if (/^\d*\.?\d+%$/.test(spacing)) {
        return Math.round(
            (parseFloat(spacing) / 100)
            * FONT_SIZE * 10
        );
    }

    // Absolute CSS line-height.
    return cssLengthToTwips(spacing)
        || DOUBLE_SPACING;
}


// ============================================================
// INLINE TEXT FORMATTING
// ============================================================

/*
 * Convert HTML text and inline formatting into Word runs.
 *
 * Preserves:
 * - Bold
 * - Italics
 * - Underline
 * - Line breaks
 */
function getTextRuns(node, formatting = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent) {
            return [];
        }

        return [
            new TextRun({
                text: node.textContent,
                font: FONT,
                size: FONT_SIZE,
                color: BLACK,
                ...formatting
            })
        ];
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return [];
    }

    if (node.tagName === "BR") {
        return [
            new TextRun({
                break: 1,
                font: FONT,
                size: FONT_SIZE,
                color: BLACK,
                ...formatting
            })
        ];
    }

    const next = { ...formatting };

    if (
        ["STRONG", "B"].includes(node.tagName)
        || node.style.fontWeight === "bold"
    ) {
        next.bold = true;
    }

    if (
        ["EM", "I"].includes(node.tagName)
        || node.style.fontStyle === "italic"
    ) {
        next.italics = true;
    }

    if (
        node.tagName === "U"
        || node.style.textDecorationLine
            ?.includes("underline")
    ) {
        next.underline = {};
    }

    return Array.from(node.childNodes).flatMap(
        child => getTextRuns(child, next)
    );
}


// ============================================================
// BODY PARAGRAPH FORMATTING
// ============================================================

/*
 * Create the standard paragraph options.
 *
 * TipTap's custom formatting attributes are
 * stored as inline CSS on paragraph elements.
 *
 * We preserve those settings when present.
 */
function getParagraphOptions(node) {
    const style = node.style;

    // Preserve custom whole-paragraph indentation.
    const leftIndent = cssLengthToTwips(
        style.marginLeft
    );

    // Preserve custom first-line indentation.
    const explicitFirstLineIndent =
        cssLengthToTwips(style.textIndent);

    // Default first-line indent for body paragraphs.
    const firstLineIndent =
        explicitFirstLineIndent
        ?? FIRST_LINE_INDENT;

    const indent = {
        firstLine: firstLineIndent
    };

    if (leftIndent !== null) {
        indent.left = leftIndent;
    }

    return {
        alignment: getAlignment(style.textAlign),

        spacing: {
            before: 0,
            after: 0,
            line: getLineSpacing(style.lineHeight),
            lineRule: "auto"
        },

        indent,

        children: getTextRuns(node)
    };
}


// ============================================================
// HTML TO WORD PARAGRAPHS
// ============================================================

/*
 * Convert a stored scene's HTML into Word paragraphs.
 *
 * This does not change the original scene content.
 */
function convertSceneContent(html) {
    const container = document.createElement("div");

    container.innerHTML = html || "";

    const paragraphs = [];

    function processNode(node) {
        // Handle text outside paragraph elements.
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.trim()) {
                paragraphs.push(
                    new Paragraph({
                        children: getTextRuns(node),

                        alignment: AlignmentType.LEFT,

                        spacing: {
                            before: 0,
                            after: 0,
                            line: DOUBLE_SPACING,
                            lineRule: "auto"
                        },

                        indent: {
                            firstLine: FIRST_LINE_INDENT
                        }
                    })
                );
            }

            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        const tag = node.tagName;

        if (["P", "H1", "H2", "H3"].includes(tag)) {
            const options = getParagraphOptions(node);

            // Handle headings explicitly rather than
            // inheriting Word's default blue heading style.
            if (tag !== "P") {
                options.heading = {
                    H1: HeadingLevel.HEADING_1,
                    H2: HeadingLevel.HEADING_2,
                    H3: HeadingLevel.HEADING_3
                }[tag];

                options.indent = {
                    firstLine: 0
                };

                options.spacing = {
                    before: 240,
                    after: 120,
                    line: 240,
                    lineRule: "auto"
                };
            }

            paragraphs.push(new Paragraph(options));
            return;
        }

        // Process nested content when appropriate.
        for (const child of node.childNodes) {
            processNode(child);
        }
    }

    for (const child of container.childNodes) {
        processNode(child);
    }

    return paragraphs;
}


// ============================================================
// TITLE PAGE
// ============================================================

function createTitlePage(project) {
    return [
        new Paragraph({
            alignment: AlignmentType.CENTER,

            spacing: {
                before: 3600,
                after: 480
            },

            children: [
                new TextRun({
                    text: project.title || "Untitled Manuscript",
                    font: FONT,
                    size: 32,
                    color: BLACK,
                    bold: true
                })
            ]
        })
    ];
}


// ============================================================
// CHAPTER HEADINGS
// ============================================================

function createChapterHeading(chapter) {
    return new Paragraph({
        alignment: AlignmentType.CENTER,

        // Every chapter starts on a new page.
        pageBreakBefore: true,

        spacing: {
            before: 720,
            after: 480,
            line: 240,
            lineRule: "auto"
        },

        indent: {
            firstLine: 0
        },

        children: [
            new TextRun({
                text: chapter.title || "Untitled Chapter",
                font: FONT,
                size: 28,
                bold: true,
                color: BLACK
            })
        ]
    });
}


// ============================================================
// SCENE BREAKS
// ============================================================

function createSceneBreak() {
    return new Paragraph({
        alignment: AlignmentType.CENTER,

        spacing: {
            before: 240,
            after: 240,
            line: 240,
            lineRule: "auto"
        },

        indent: {
            firstLine: 0
        },

        children: [
            new TextRun({
                text: "* * *",
                font: FONT,
                size: FONT_SIZE,
                color: BLACK
            })
        ]
    });
}


// ============================================================
// GENERATE AND DOWNLOAD MANUSCRIPT
// ============================================================

/*
 * Export a project as a Word document.
 *
 * The project data is read only.
 * No changes are made to localStorage.
 */
export async function downloadManuscript(project) {
    if (!project?.chapters?.length) {
        throw new Error(
            "This project has no chapters to export."
        );
    }

    // Start with the manuscript title page.
    const content = createTitlePage(project);

    // Export chapters in their stored order.
    for (const chapter of project.chapters) {
        content.push(createChapterHeading(chapter));

        const scenes = chapter.scenes || [];

        scenes.forEach((scene, index) => {
            // Insert a scene break between scenes,
            // but never before the first scene.
            if (index > 0) {
                content.push(createSceneBreak());
            }

            content.push(
                ...convertSceneContent(scene.content)
            );
        });
    }

    // Create the Word document.
    const documentFile = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: FONT,
                        size: FONT_SIZE,
                        color: BLACK
                    },

                    paragraph: {
                        alignment: AlignmentType.LEFT,

                        spacing: {
                            before: 0,
                            after: 0,
                            line: DOUBLE_SPACING,
                            lineRule: "auto"
                        }
                    }
                }
            }
        },

        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: PAGE_MARGIN,
                            bottom: PAGE_MARGIN,
                            left: PAGE_MARGIN,
                            right: PAGE_MARGIN
                        }
                    }
                },

                children: content
            }
        ]
    });

    // Generate the DOCX file.
    const blob = await Packer.toBlob(documentFile);

    const url = URL.createObjectURL(blob);

    // Remove invalid filename characters.
    const filename = (project.title || "")
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .trim() || "StoryForge-Manuscript";

    // Trigger the download.
    const link = document.createElement("a");

    link.href = url;
    link.download = `${filename}.docx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Release the temporary download URL.
    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 60000);
}
