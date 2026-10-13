
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

import { ParagraphFormatting } from "./editorExtensions.js";

import {
    addProject,
    getProjectById,
    addChapterToProject,
    addSceneToChapter,
    updateSceneContent,
    renameProject,
    deleteProject,
    renameChapter,
    deleteChapter,
    renameScene,
    deleteScene
} from "./projects.js";

import { getProjects } from "./storage.js";

import {
    renderCreateProjectForm,
    renderProjectList,
    renderProjectView,
    renderChapterView,
    renderSceneView
} from "./ui.js";

import { countSceneWords } from "./wordCount.js";
import { renderManuscript } from "./manuscript.js";
import { downloadManuscript } from "./export.js";
import { renderMultiEditor } from "./multiEditor.js";


// ============================================================
// APPLICATION STATE
// ============================================================

const app = document.querySelector("#app");

// Cleanup function for whichever editor is currently active.
let activeSceneCleanup = null;


// ============================================================
// EDITOR CLEANUP
// ============================================================

function cleanupActiveEditor() {
    if (!activeSceneCleanup) return;

    // Only clear the reference after cleanup succeeds.
    const cleanup = activeSceneCleanup;

    cleanup();

    activeSceneCleanup = null;
}


// ============================================================
// GLOBAL NAVIGATION
// ============================================================

app.addEventListener("click", event => {
    if (!event.target.closest(".storyforge-home")) {
        return;
    }

    try {
        cleanupActiveEditor();
        showDashboard();
    } catch (error) {
        console.error("Could not leave editor:", error);
        window.alert(
            "Your changes could not be saved. " +
            "Please try saving again before leaving."
        );
    }
});


// ============================================================
// DASHBOARD
// ============================================================

function showDashboard() {
    renderCreateProjectForm(app);

    const form = app.querySelector("#create-project-form");
    const titleInput = app.querySelector("#project-title");
    const projectList = app.querySelector("#project-list");

    function refreshProjectList() {
        renderProjectList(projectList, getProjects());
    }

    refreshProjectList();

    // --------------------------------------------------------
    // CREATE PROJECT
    // --------------------------------------------------------

    form.addEventListener("submit", event => {
        event.preventDefault();

        const title = titleInput.value.trim();

        if (!title) return;

        addProject(title);

        titleInput.value = "";

        refreshProjectList();
    });

    // --------------------------------------------------------
    // PROJECT ACTIONS
    // --------------------------------------------------------

    projectList.addEventListener("click", event => {
        const renameButton = event.target.closest(
            ".rename-project"
        );

        if (renameButton) {
            const projectId = renameButton.dataset.projectId;
            const project = getProjectById(projectId);

            if (!project) return;

            const newTitle = window.prompt(
                "Rename project:",
                project.title
            );

            if (newTitle === null) return;

            if (renameProject(projectId, newTitle)) {
                refreshProjectList();
            }

            return;
        }

        const deleteButton = event.target.closest(
            ".delete-project"
        );

        if (deleteButton) {
            const projectId = deleteButton.dataset.projectId;
            const project = getProjectById(projectId);

            if (!project) return;

            const confirmed = window.confirm(
                `Delete "${project.title}"?\n\n` +
                "This will permanently delete the project, " +
                "including all chapters, scenes, and written content."
            );

            if (!confirmed) return;

            deleteProject(projectId);

            refreshProjectList();
            return;
        }

        const projectCard = event.target.closest(
            ".project-card"
        );

        if (projectCard) {
            openProject(projectCard.dataset.projectId);
        }
    });
}


// ============================================================
// FULL MANUSCRIPT VIEW
// ============================================================

/*
 * Read-only view of the entire manuscript.
 * This does not modify project data.
 */

function openManuscript(projectId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    renderManuscript(app, project);

    app.querySelector("#back-to-project")
        ?.addEventListener("click", () => {
            openProject(projectId);
        });
}


// ============================================================
// BOOK EDITOR
// ============================================================

/*
 * Opens all chapters and scenes in one editing workspace.
 * Each scene is saved to its existing record.
 */

function openBookEditor(projectId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    const workspace = renderMultiEditor(app, project, {
        mode: "book",

        onBack: () => {
            activeSceneCleanup = null;
            openProject(projectId);
        }
    });

    activeSceneCleanup = () => {
        workspace.destroy();
        activeSceneCleanup = null;
    };
}


// ============================================================
// CHAPTER EDITOR
// ============================================================

/*
 * Opens every scene within a selected chapter.
 * Scene content remains stored independently.
 */

function openChapterEditor(projectId, chapterId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    const chapter = project.chapters.find(
        item => item.id === chapterId
    );

    if (!chapter) {
        openProject(projectId);
        return;
    }

    const workspace = renderMultiEditor(app, project, {
        mode: "chapter",
        chapterId,

        onBack: () => {
            activeSceneCleanup = null;
            openChapter(projectId, chapterId);
        }
    });

    activeSceneCleanup = () => {
        workspace.destroy();
        activeSceneCleanup = null;
    };
}


// ============================================================
// PROJECT VIEW
// ============================================================

function openProject(projectId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    renderProjectView(app, project);

    // --------------------------------------------------------
    // BOOK EDITOR
    // --------------------------------------------------------

    app.querySelector("#edit-book")
        ?.addEventListener("click", () => {
            openBookEditor(projectId);
        });

    // --------------------------------------------------------
    // FULL MANUSCRIPT VIEW
    // --------------------------------------------------------

    app.querySelector("#view-manuscript")
        ?.addEventListener("click", () => {
            openManuscript(projectId);
        });

    // --------------------------------------------------------
    // DOCX EXPORT
    // --------------------------------------------------------

    const downloadButton = app.querySelector(
        "#download-manuscript"
    );

    downloadButton?.addEventListener("click", async () => {
        downloadButton.disabled = true;

        try {
            // Always use the latest saved manuscript.
            const currentProject = getProjectById(projectId);

            if (!currentProject) {
                throw new Error("Project not found.");
            }

            await downloadManuscript(currentProject);
        } catch (error) {
            console.error(
                "Manuscript export failed:",
                error
            );

            window.alert(
                error.message ||
                "The manuscript could not be downloaded."
            );
        } finally {
            downloadButton.disabled = false;
        }
    });

    // --------------------------------------------------------
    // BACK NAVIGATION
    // --------------------------------------------------------

    app.querySelector("#back-to-projects")
        ?.addEventListener("click", () => {
            showDashboard();
        });

    // --------------------------------------------------------
    // CREATE CHAPTER
    // --------------------------------------------------------

    const chapterForm = app.querySelector(
        "#create-chapter-form"
    );

    const chapterTitleInput = app.querySelector(
        "#chapter-title"
    );

    chapterForm?.addEventListener("submit", event => {
        event.preventDefault();

        const title = chapterTitleInput.value.trim();

        if (!title) return;

        addChapterToProject(projectId, title);

        openProject(projectId);
    });

    // --------------------------------------------------------
    // OPEN CHAPTER
    // --------------------------------------------------------

    app.querySelectorAll(".chapter-card").forEach(card => {
        card.addEventListener("click", () => {
            openChapter(
                projectId,
                card.dataset.chapterId
            );
        });
    });

    // --------------------------------------------------------
    // RENAME CHAPTER
    // --------------------------------------------------------

    app.querySelectorAll(".rename-chapter")
        .forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = button.dataset.chapterId;

                const chapter = project.chapters.find(
                    item => item.id === chapterId
                );

                if (!chapter) return;

                const newTitle = window.prompt(
                    "Rename chapter:",
                    chapter.title
                );

                if (newTitle === null) return;

                if (
                    renameChapter(
                        projectId,
                        chapterId,
                        newTitle
                    )
                ) {
                    openProject(projectId);
                }
            });
        });

    // --------------------------------------------------------
    // DELETE CHAPTER
    // --------------------------------------------------------

    app.querySelectorAll(".delete-chapter")
        .forEach(button => {
            button.addEventListener("click", () => {
                const chapterId = button.dataset.chapterId;

                const chapter = project.chapters.find(
                    item => item.id === chapterId
                );

                if (!chapter) return;

                const confirmed = window.confirm(
                    `Delete "${chapter.title}"?\n\n` +
                    "This will permanently delete this chapter " +
                    "and every scene inside it."
                );

                if (!confirmed) return;

                deleteChapter(projectId, chapterId);

                openProject(projectId);
            });
        });
}


// ============================================================
// CHAPTER VIEW
// ============================================================

function openChapter(projectId, chapterId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    const chapter = project.chapters.find(
        item => item.id === chapterId
    );

    if (!chapter) {
        openProject(projectId);
        return;
    }

    renderChapterView(app, project, chapter);

    // --------------------------------------------------------
    // CHAPTER EDITOR
    // --------------------------------------------------------

    app.querySelector("#edit-chapter")
        ?.addEventListener("click", () => {
            openChapterEditor(projectId, chapterId);
        });

    // --------------------------------------------------------
    // BACK TO PROJECT
    // --------------------------------------------------------

    app.querySelector("#back-to-project")
        ?.addEventListener("click", () => {
            openProject(projectId);
        });

    // --------------------------------------------------------
    // CREATE SCENE
    // --------------------------------------------------------

    const sceneForm = app.querySelector(
        "#create-scene-form"
    );

    const sceneTitleInput = app.querySelector(
        "#scene-title"
    );

    sceneForm?.addEventListener("submit", event => {
        event.preventDefault();

        const title = sceneTitleInput.value.trim();

        if (!title) return;

        addSceneToChapter(
            projectId,
            chapterId,
            title
        );

        openChapter(projectId, chapterId);
    });

    // --------------------------------------------------------
    // OPEN SCENE
    // --------------------------------------------------------

    app.querySelectorAll(".scene-card").forEach(card => {
        card.addEventListener("click", () => {
            openScene(
                projectId,
                chapterId,
                card.dataset.sceneId
            );
        });
    });

    // --------------------------------------------------------
    // RENAME SCENE
    // --------------------------------------------------------

    app.querySelectorAll(".rename-scene")
        .forEach(button => {
            button.addEventListener("click", () => {
                const sceneId = button.dataset.sceneId;

                const scene = chapter.scenes.find(
                    item => item.id === sceneId
                );

                if (!scene) return;

                const newTitle = window.prompt(
                    "Rename scene:",
                    scene.title
                );

                if (newTitle === null) return;

                if (
                    renameScene(
                        projectId,
                        chapterId,
                        sceneId,
                        newTitle
                    )
                ) {
                    openChapter(projectId, chapterId);
                }
            });
        });

    // --------------------------------------------------------
    // DELETE SCENE
    // --------------------------------------------------------

    app.querySelectorAll(".delete-scene")
        .forEach(button => {
            button.addEventListener("click", () => {
                const sceneId = button.dataset.sceneId;

                const scene = chapter.scenes.find(
                    item => item.id === sceneId
                );

                if (!scene) return;

                const confirmed = window.confirm(
                    `Delete "${scene.title}"?\n\n` +
                    "This will permanently delete this scene " +
                    "and all of its written content."
                );

                if (!confirmed) return;

                deleteScene(
                    projectId,
                    chapterId,
                    sceneId
                );

                openChapter(projectId, chapterId);
            });
        });
}


// ============================================================
// SCENE EDITOR VIEW
// ============================================================

/*
 * Existing single-scene TipTap editor.
 *
 * This remains independent of multiEditor.js until the
 * new chapter and book editing modes are fully tested.
 */

function openScene(projectId, chapterId, sceneId) {
    cleanupActiveEditor();

    const project = getProjectById(projectId);

    if (!project) {
        showDashboard();
        return;
    }

    const chapter = project.chapters.find(
        item => item.id === chapterId
    );

    if (!chapter) {
        openProject(projectId);
        return;
    }

    const scene = chapter.scenes.find(
        item => item.id === sceneId
    );

    if (!scene) {
        openChapter(projectId, chapterId);
        return;
    }

    renderSceneView(app, project, chapter, scene);

    // --------------------------------------------------------
    // EDITOR ELEMENTS
    // --------------------------------------------------------

    const editorElement = app.querySelector("#scene-editor");
    const backButton = app.querySelector("#back-to-chapter");
    const saveButton = app.querySelector("#save-scene");
    const saveStatus = app.querySelector("#scene-save-status");
    const wordCountElement = app.querySelector(
        "#scene-word-count"
    );

    const renameButton = app.querySelector(".rename-scene");
    const deleteButton = app.querySelector(".delete-scene");

    // --------------------------------------------------------
    // TIPTAP SETUP
    // --------------------------------------------------------

    const editor = new Editor({
        element: editorElement,

        extensions: [
            StarterKit,

            TextAlign.configure({
                types: ["heading", "paragraph"]
            }),

            ParagraphFormatting
        ],

        content: scene.content || "<p></p>",

        editorProps: {
            attributes: {
                class: "p-3",
                style: "min-height: 470px; outline: none;"
            }
        }
    });

    // --------------------------------------------------------
    // SAVE HELPERS
    // --------------------------------------------------------

    let autosaveTimeout = null;
    let hasUnsavedChanges = false;
    let editorDestroyed = false;

    function setSaveStatus(message) {
        if (saveStatus) {
            saveStatus.textContent = message;
        }
    }

    function saveCurrentScene() {
        const result = updateSceneContent(
            projectId,
            chapterId,
            sceneId,
            editor.getHTML()
        );

        if (result === false) {
            throw new Error("Could not save scene.");
        }
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

                saveCurrentScene();

                hasUnsavedChanges = false;

                setSaveStatus("Saved");
            } catch (error) {
                console.error(
                    "Scene autosave failed:",
                    error
                );

                setSaveStatus("Save failed");
            }
        }, 1000);
    }

    function flushAutosave() {
        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
        }

        if (!hasUnsavedChanges) return;

        setSaveStatus("Saving...");

        saveCurrentScene();

        hasUnsavedChanges = false;

        setSaveStatus("Saved");
    }

    function saveImmediately() {
        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
        }

        setSaveStatus("Saving...");

        saveCurrentScene();

        hasUnsavedChanges = false;

        setSaveStatus("Saved");
    }

    // --------------------------------------------------------
    // EDITOR CLEANUP
    // --------------------------------------------------------

    function destroySceneEditor() {
        if (editorDestroyed) return;

        editor.destroy();

        editorDestroyed = true;

        if (activeSceneCleanup === cleanupSceneEditor) {
            activeSceneCleanup = null;
        }
    }

    function cleanupSceneEditor() {
        if (editorDestroyed) return;

        flushAutosave();

        destroySceneEditor();
    }

    activeSceneCleanup = cleanupSceneEditor;

    // --------------------------------------------------------
    // LIVE WORD COUNT
    // --------------------------------------------------------

    function updateLiveWordCount() {
        const count = countSceneWords(editor.getHTML());

        if (!wordCountElement) return;

        wordCountElement.textContent =
            `${count.toLocaleString()} ` +
            (count === 1 ? "word" : "words");
    }

    // --------------------------------------------------------
    // TOOLBAR HELPERS
    // --------------------------------------------------------

    function getParagraphAttributes() {
        return editor.getAttributes("paragraph");
    }

    function getParagraphIndentAmount() {
        const marginLeft = getParagraphAttributes().marginLeft;

        if (!marginLeft) return 0;

        const amount = parseFloat(marginLeft);

        return Number.isNaN(amount) ? 0 : amount;
    }

    function setButtonActive(selector, active) {
        const button = app.querySelector(selector);

        if (!button) return;

        button.classList.toggle("active", active);
        button.setAttribute(
            "aria-pressed",
            String(active)
        );
    }

    // --------------------------------------------------------
    // TOOLBAR STATE
    // --------------------------------------------------------

    function updateToolbarState() {
        if (editorDestroyed) return;

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
                editor.isActive({
                    textAlign: alignment
                })
            );
        }

        const attributes = getParagraphAttributes();

        setButtonActive(
            "#editor-first-line-indent",
            attributes.textIndent === "0.5in"
        );

        const spacingControl = app.querySelector(
            "#editor-line-spacing"
        );

        if (spacingControl) {
            spacingControl.value =
                attributes.lineHeight || "";
        }

        const outdentButton = app.querySelector(
            "#editor-outdent"
        );

        if (outdentButton) {
            outdentButton.disabled =
                getParagraphIndentAmount() <= 0;
        }

        const undoButton = app.querySelector(
            "#editor-undo"
        );

        if (undoButton) {
            undoButton.disabled = !editor.can().undo();
        }

        const redoButton = app.querySelector(
            "#editor-redo"
        );

        if (redoButton) {
            redoButton.disabled = !editor.can().redo();
        }
    }

    // --------------------------------------------------------
    // EDITOR EVENTS
    // --------------------------------------------------------

    editor.on(
        "selectionUpdate",
        updateToolbarState
    );

    editor.on(
        "transaction",
        updateToolbarState
    );

    editor.on("update", () => {
        updateLiveWordCount();
        scheduleAutosave();
    });

    updateToolbarState();
    updateLiveWordCount();
    setSaveStatus("Saved");

    // --------------------------------------------------------
    // BASIC TEXT FORMATTING
    // --------------------------------------------------------

    app.querySelector("#editor-bold")
        ?.addEventListener("click", () => {
            editor.chain().focus().toggleBold().run();
        });

    app.querySelector("#editor-italic")
        ?.addEventListener("click", () => {
            editor.chain().focus().toggleItalic().run();
        });

    app.querySelector("#editor-underline")
        ?.addEventListener("click", () => {
            editor.chain().focus().toggleUnderline().run();
        });

    // --------------------------------------------------------
    // TEXT ALIGNMENT
    // --------------------------------------------------------

    for (const alignment of [
        "left",
        "center",
        "right",
        "justify"
    ]) {
        app.querySelector(`#editor-align-${alignment}`)
            ?.addEventListener("click", () => {
                editor
                    .chain()
                    .focus()
                    .setTextAlign(alignment)
                    .run();
            });
    }

    // --------------------------------------------------------
    // FIRST-LINE INDENT
    // --------------------------------------------------------

    app.querySelector("#editor-first-line-indent")
        ?.addEventListener("click", () => {
            const attributes = getParagraphAttributes();

            const textIndent =
                attributes.textIndent === "0.5in"
                    ? null
                    : "0.5in";

            editor
                .chain()
                .focus()
                .updateAttributes("paragraph", {
                    textIndent
                })
                .run();
        });

    // --------------------------------------------------------
    // PARAGRAPH INDENT
    // --------------------------------------------------------

    app.querySelector("#editor-indent")
        ?.addEventListener("click", () => {
            const amount =
                getParagraphIndentAmount() + 0.5;

            editor
                .chain()
                .focus()
                .updateAttributes("paragraph", {
                    marginLeft: `${amount}in`
                })
                .run();
        });

    app.querySelector("#editor-outdent")
        ?.addEventListener("click", () => {
            const amount = Math.max(
                0,
                getParagraphIndentAmount() - 0.5
            );

            editor
                .chain()
                .focus()
                .updateAttributes("paragraph", {
                    marginLeft:
                        amount === 0
                            ? null
                            : `${amount}in`
                })
                .run();
        });

    // --------------------------------------------------------
    // LINE SPACING
    // --------------------------------------------------------

    app.querySelector("#editor-line-spacing")
        ?.addEventListener("change", event => {
            const selected = event.target.value;

            editor
                .chain()
                .focus()
                .updateAttributes("paragraph", {
                    lineHeight: selected || null
                })
                .run();
        });

    // --------------------------------------------------------
    // UNDO / REDO
    // --------------------------------------------------------

    app.querySelector("#editor-undo")
        ?.addEventListener("click", () => {
            editor.chain().focus().undo().run();
        });

    app.querySelector("#editor-redo")
        ?.addEventListener("click", () => {
            editor.chain().focus().redo().run();
        });

    // --------------------------------------------------------
    // MANUAL SAVE
    // --------------------------------------------------------

    saveButton?.addEventListener("click", () => {
        try {
            saveImmediately();

            saveButton.textContent = "Saved ✓";

            setTimeout(() => {
                if (saveButton.isConnected) {
                    saveButton.textContent = "Save Scene";
                }
            }, 1200);
        } catch (error) {
            console.error(
                "Manual scene save failed:",
                error
            );

            setSaveStatus("Save failed");

            window.alert(
                "The scene could not be saved."
            );
        }
    });

    // --------------------------------------------------------
    // RENAME CURRENT SCENE
    // --------------------------------------------------------

    renameButton?.addEventListener("click", () => {
        const newTitle = window.prompt(
            "Rename scene:",
            scene.title
        );

        if (newTitle === null) return;

        try {
            flushAutosave();
        } catch (error) {
            console.error(error);
            window.alert(
                "Save failed. The scene was not renamed."
            );
            return;
        }

        const renamed = renameScene(
            projectId,
            chapterId,
            sceneId,
            newTitle
        );

        if (!renamed) return;

        destroySceneEditor();

        openScene(
            projectId,
            chapterId,
            sceneId
        );
    });

    // --------------------------------------------------------
    // DELETE CURRENT SCENE
    // --------------------------------------------------------

    deleteButton?.addEventListener("click", () => {
        const confirmed = window.confirm(
            `Delete "${scene.title}"?\n\n` +
            "This will permanently delete this scene " +
            "and all of its written content."
        );

        if (!confirmed) return;

        // Cancel pending autosave before deleting the record.
        if (autosaveTimeout !== null) {
            clearTimeout(autosaveTimeout);
            autosaveTimeout = null;
        }

        destroySceneEditor();

        deleteScene(
            projectId,
            chapterId,
            sceneId
        );

        openChapter(projectId, chapterId);
    });

    // --------------------------------------------------------
    // SIDEBAR CHAPTER NAVIGATION
    // --------------------------------------------------------

    app.querySelectorAll(".editor-sidebar-chapter")
        .forEach(button => {
            button.addEventListener("click", () => {
                const targetChapterId =
                    button.dataset.chapterId;

                try {
                    cleanupSceneEditor();

                    openChapter(
                        projectId,
                        targetChapterId
                    );
                } catch (error) {
                    console.error(error);
                    window.alert(
                        "Could not save changes before navigating."
                    );
                }
            });
        });

    // --------------------------------------------------------
    // SIDEBAR SCENE NAVIGATION
    // --------------------------------------------------------

    app.querySelectorAll(".editor-sidebar-scene")
        .forEach(button => {
            button.addEventListener("click", () => {
                const targetChapterId =
                    button.dataset.chapterId;

                const targetSceneId =
                    button.dataset.sceneId;

                if (
                    targetChapterId === chapterId &&
                    targetSceneId === sceneId
                ) {
                    return;
                }

                try {
                    cleanupSceneEditor();

                    openScene(
                        projectId,
                        targetChapterId,
                        targetSceneId
                    );
                } catch (error) {
                    console.error(error);
                    window.alert(
                        "Could not save changes before navigating."
                    );
                }
            });
        });

    // --------------------------------------------------------
    // BACK TO CHAPTER
    // --------------------------------------------------------

    backButton?.addEventListener("click", () => {
        try {
            cleanupSceneEditor();

            openChapter(projectId, chapterId);
        } catch (error) {
            console.error(error);

            window.alert(
                "Could not save changes before leaving."
            );
        }
    });
}


// ============================================================
// APPLICATION START
// ============================================================

showDashboard();
