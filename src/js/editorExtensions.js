// Adds custom paragraph formatting options to the TipTap editor.

import { Extension } from "@tiptap/core";


// ============================================================
// PARAGRAPH FORMATTING EXTENSION
// ============================================================

/*
 * Add formatting attributes that are not included in TipTap's
 * standard paragraph behaviour.
 *
 * These attributes are stored in the editor document and rendered
 * as inline CSS when the scene content is saved as HTML.
 */
export const ParagraphFormatting = Extension.create({

    // Unique name used internally by TipTap.
    name: "paragraphFormatting",


    // Add custom attributes to paragraph nodes.
    addGlobalAttributes() {

        return [
            {
                // Apply these attributes only to normal paragraphs.
                types: ["paragraph"],

                attributes: {

                    // ====================================================
                    // FIRST-LINE INDENT
                    // ====================================================

                    /*
                     * Controls indentation of only the first line
                     * of a paragraph.
                     *
                     * Example:
                     * text-indent: 0.5in;
                     */
                    textIndent: {

                        // No indent unless the user applies one.
                        default: null,

                        // Read an existing text-indent value when loading HTML.
                        parseHTML: (element) => {
                            return element.style.textIndent || null;
                        },

                        // Write the indent back into the saved HTML.
                        renderHTML: (attributes) => {

                            // Do not add unnecessary styling if no indent exists.
                            if (!attributes.textIndent) {
                                return {};
                            }

                            return {
                                style: `text-indent: ${attributes.textIndent};`
                            };
                        }
                    },


                    // ====================================================
                    // LINE SPACING
                    // ====================================================

                    /*
                     * Controls the amount of vertical spacing between
                     * lines inside a paragraph.
                     *
                     * Examples:
                     * line-height: 1;
                     * line-height: 1.5;
                     * line-height: 2;
                     */
                    lineHeight: {

                        // Use normal browser spacing until the user chooses one.
                        default: null,

                        // Read line spacing from previously saved HTML.
                        parseHTML: (element) => {
                            return element.style.lineHeight || null;
                        },

                        // Save the selected line spacing into the HTML.
                        renderHTML: (attributes) => {

                            // Do not add a style if no custom spacing exists.
                            if (!attributes.lineHeight) {
                                return {};
                            }

                            return {
                                style: `line-height: ${attributes.lineHeight};`
                            };
                        }
                    },


                    // ====================================================
                    // PARAGRAPH INDENT
                    // ====================================================

                    /*
                     * Controls indentation of the entire paragraph.
                     *
                     * This is different from textIndent:
                     *
                     * textIndent  = first line only
                     * marginLeft  = whole paragraph
                     *
                     * We will use this later for the Indent / Outdent buttons.
                     */
                    marginLeft: {

                        // Paragraphs begin with no extra left margin.
                        default: null,

                        // Read an existing paragraph indent from saved HTML.
                        parseHTML: (element) => {
                            return element.style.marginLeft || null;
                        },

                        // Save the paragraph indent into the HTML.
                        renderHTML: (attributes) => {

                            // Do not add an unnecessary margin if none exists.
                            if (!attributes.marginLeft) {
                                return {};
                            }

                            return {
                                style: `margin-left: ${attributes.marginLeft};`
                            };
                        }
                    }
                }
            }
        ];
    }
});