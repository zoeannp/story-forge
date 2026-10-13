
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

import { ParagraphFormatting } from "./editorExtensions.js";
import { countSceneWords } from "./wordCount.js";

// ============================================================
// REUSABLE STORYFORGE EDITOR
// ============================================================

export function createStoryForgeEditor({
    element,
    content = "<p></p>",
    onSave,
    toolbar = null,
    wordCountElement = null,
    saveStatusElement = null,
    saveButton = null
}) {
    let autosaveTimeout = null;
    let hasUnsavedChanges = false;
    let destroyed = false;

    const editor = new Editor({
        element,

        extensions: [
            StarterKit,

            TextAlign.configure({
                types: ["heading", "paragraph"]
            }),

            ParagraphFormatting
        ],

        content: content || "<p></p>",

        editorProps: {
            attributes: {
                class: "p-3",
                style: "min-height: 250px; outline: none;"
            }
        }
    });

    // ========================================================
    // SAVE STATUS
    // ========================================================

    function setSaveStatus(message) {
        if (saveStatusElement) {
            saveStatusElement.textContent = message;
        }
    }

    function saveCurrentContent() {
        if (typeof onSave !== "function") {
            throw new Error(
                "StoryForge editor requires an onSave function."
            );
        }

        const result = onSave(editor.getHTML());

        if (result === false) {
            throw new Error("StoryForge could not save the content.");
        }

        hasUnsavedChanges = false;
        setSaveStatus("Saved");
    }

    function scheduleAutosave() {
        hasUnsavedChanges = true;
        setSaveStatus("Unsaved changes");

        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
        }

        autosaveTimeout = setTimeout(() => {
            autosaveTimeout = null;

            try {
                setSaveStatus("Saving...");
                saveCurrentContent();
            } catch (error) {
                console.error("StoryForge autosave failed:", error);
                setSaveStatus("Save failed");
            }
        }, 1000);
    }

    function save() {
        if (destroyed) return;

        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
        }

        setSaveStatus("Saving...");
        saveCurrentContent();
    }

    function flushAutosave() {
        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
        }

        if (hasUnsavedChanges) {
            setSaveStatus("Saving...");
            saveCurrentContent();
        }
    }

    // ========================================================
    // WORD COUNT
    // ========================================================

    function updateWordCount() {
        if (!wordCountElement) return;

        const count = countSceneWords(editor.getHTML());

        wordCountElement.textContent =
            `${count.toLocaleString()} ` +
            (count === 1 ? "word" : "words");
    }

    // ========================================================
    // TOOLBAR HELPERS
    // ========================================================

    function findControl(selector) {
        return toolbar?.querySelector(selector) || null;
    }

    function setButtonActive(selector, active) {
        const button = findControl(selector);

        if (!button) return;

        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
    }

    function getParagraphAttributes() {
        return editor.getAttributes("paragraph");
    }

    function getParagraphIndentAmount() {
        const marginLeft = getParagraphAttributes().marginLeft;

        if (!marginLeft) return 0;

        const amount = parseFloat(marginLeft);

        return Number.isNaN(amount) ? 0 : amount;
    }

    function updateToolbarState() {
        if (!toolbar || destroyed) return;

        setButtonActive(
            "#editor-bold",
            editor.isActive("bold")
        );

        setButtonActive(
            "#editor-italic",
            editor.isActive("italic")
        );

        setButtonActive(
            "#editor-underline",
            editor.isActive("underline")
        );

        for (const alignment of [
            "left",
            "center",
            "right",
            "justify"
        ]) {
            setButtonActive(
                `#editor-align-${alignment}`,
                editor.isActive({ textAlign: alignment })
            );
        }

        const attributes = getParagraphAttributes();

        setButtonActive(
            "#editor-first-line-indent",
            attributes.textIndent === "0.5in"
        );

        const lineSpacing = findControl(
            "#editor-line-spacing"
        );

        if (lineSpacing) {
            lineSpacing.value = attributes.lineHeight || "";
        }

        const outdentButton = findControl("#editor-outdent");

        if (outdentButton) {
            outdentButton.disabled =
                getParagraphIndentAmount() <= 0;
        }

        const undoButton = findControl("#editor-undo");

        if (undoButton) {
            undoButton.disabled = !editor.can().undo();
        }

        const redoButton = findControl("#editor-redo");

        if (redoButton) {
            redoButton.disabled = !editor.can().redo();
        }
    }

    // ========================================================
    // TOOLBAR EVENTS
    // ========================================================

    function bindClick(selector, callback) {
        const button = findControl(selector);

        if (!button) return;

        button.addEventListener("click", callback);
    }

    bindClick("#editor-bold", () => {
        editor.chain().focus().toggleBold().run();
    });

    bindClick("#editor-italic", () => {
        editor.chain().focus().toggleItalic().run();
    });

    bindClick("#editor-underline", () => {
        if (typeof editor.commands.toggleUnderline === "function") {
            editor.chain().focus().toggleUnderline().run();
        }
    });

    for (const alignment of [
        "left",
        "center",
        "right",
        "justify"
    ]) {
        bindClick(`#editor-align-${alignment}`, () => {
            editor.chain().focus().setTextAlign(alignment).run();
        });
    }

    bindClick("#editor-first-line-indent", () => {
        const attributes = getParagraphAttributes();

        const textIndent =
            attributes.textIndent === "0.5in"
                ? null
                : "0.5in";

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", { textIndent })
            .run();
    });

    bindClick("#editor-indent", () => {
        const amount = getParagraphIndentAmount() + 0.5;

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                marginLeft: `${amount}in`
            })
            .run();
    });

    bindClick("#editor-outdent", () => {
        const amount = Math.max(
            0,
            getParagraphIndentAmount() - 0.5
        );

        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                marginLeft: amount === 0
                    ? null
                    : `${amount}in`
            })
            .run();
    });

    const lineSpacing = findControl("#editor-line-spacing");

    lineSpacing?.addEventListener("change", event => {
        editor
            .chain()
            .focus()
            .updateAttributes("paragraph", {
                lineHeight: event.target.value || null
            })
            .run();
    });

    bindClick("#editor-undo", () => {
        editor.chain().focus().undo().run();
    });

    bindClick("#editor-redo", () => {
        editor.chain().focus().redo().run();
    });

    // ========================================================
    // EDITOR EVENTS
    // ========================================================

    editor.on("selectionUpdate", updateToolbarState);
    editor.on("transaction", updateToolbarState);

    editor.on("update", () => {
        updateWordCount();
        scheduleAutosave();
    });

    updateToolbarState();
    updateWordCount();
    setSaveStatus("Saved");

    // ========================================================
    // MANUAL SAVE
    // ========================================================

    saveButton?.addEventListener("click", () => {
        try {
            save();

            const originalText = "Save Scene";
            saveButton.textContent = "Saved ✓";

            setTimeout(() => {
                if (saveButton.isConnected) {
                    saveButton.textContent = originalText;
                }
            }, 1200);
        } catch (error) {
            console.error("StoryForge save failed:", error);
            setSaveStatus("Save failed");
        }
    });

    // ========================================================
    // CLEANUP
    // ========================================================

    function destroy() {
        if (destroyed) return;

        // Save pending changes before removing the editor.
        flushAutosave();

        editor.destroy();
        destroyed = true;
    }

    return {
        editor,
        save,
        destroy
    };
}
