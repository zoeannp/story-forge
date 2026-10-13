
/*
 * StoryForge Manuscript Outline
 *
 * Reusable chapter and scene navigation for the
 * Chapter Editor and Book Editor.
 *
 * Features:
 * - Project title and total word count
 * - Chapter and scene hierarchy
 * - Collapsible chapters
 * - Individual word counts
 * - Active scene highlighting
 * - Navigation callbacks
 *
 * This module does not edit or save manuscript content.
 */

import {
    countSceneWords,
    countChapterWords,
    countProjectWords
} from "./wordCount.js";


// ============================================================
// DISPLAY HELPERS
// ============================================================

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]
    );
}

function formatWordCount(count) {
    return `${count.toLocaleString()} ${
        count === 1 ? "word" : "words"
    }`;
}


// ============================================================
// MANUSCRIPT OUTLINE
// ============================================================

export function renderManuscriptOutline(
    container,
    project,
    {
        mode = "book",
        chapterId = null,
        onNavigate = null
    } = {}
) {
    if (!container) {
        throw new Error(
            "Manuscript outline container was not provided."
        );
    }

    if (!project) {
        throw new Error(
            "Manuscript outline project was not provided."
        );
    }

    // In chapter mode, show only the selected chapter.
    // In book mode, show the complete manuscript.
    const chapters = mode === "chapter"
        ? project.chapters.filter(
            chapter => chapter.id === chapterId
        )
        : project.chapters;

    // Chapters start expanded.
    const expandedChapters = new Set(
        chapters.map(chapter => chapter.id)
    );

    let activeChapterId = chapterId;
    let activeSceneId = null;

    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    function render() {
        container.innerHTML = `
            <aside
                class="card h-100 storyforge-manuscript-outline"
                aria-label="Manuscript navigation"
            >
                <div class="card-body">

                    <!-- PROJECT INFORMATION -->

                    <h2 class="h5 mb-1">
                        ${escapeHTML(project.title)}
                    </h2>

                    <p class="text-muted small mb-4">
                        ${formatWordCount(
                            countProjectWords(project)
                        )}
                    </p>

                    <!-- CHAPTERS -->

                    <nav aria-label="Chapters and scenes">

                        ${chapters.map(chapter => {
                            const isExpanded =
                                expandedChapters.has(chapter.id);

                            const isActiveChapter =
                                activeChapterId === chapter.id;

                            return `
                                <div
                                    class="mb-3"
                                    data-outline-chapter="${escapeHTML(chapter.id)}"
                                >

                                    <!-- CHAPTER NAVIGATION -->

                                    <div
                                        class="
                                            d-flex
                                            align-items-start
                                            gap-1
                                        "
                                    >
                                        <button
                                            type="button"
                                            class="
                                                btn flex-grow-1
                                                text-start
                                                storyforge-outline-chapter
                                                ${isActiveChapter ? "fw-bold" : ""}
                                            "
                                            data-outline-action="chapter"
                                            data-chapter-id="${escapeHTML(chapter.id)}"
                                        >
                                            <span class="d-block">
                                                ${escapeHTML(chapter.title)}
                                            </span>

                                            <small
                                                class="
                                                    d-block
                                                    text-muted
                                                    mt-1
                                                "
                                            >
                                                ${formatWordCount(
                                                    countChapterWords(chapter)
                                                )}
                                            </small>
                                        </button>

                                        <!-- COLLAPSE / EXPAND -->

                                        <button
                                            type="button"
                                            class="
                                                btn btn-sm
                                                storyforge-outline-toggle
                                            "
                                            data-outline-action="toggle"
                                            data-chapter-id="${escapeHTML(chapter.id)}"
                                            aria-label="${
                                                isExpanded
                                                    ? "Collapse"
                                                    : "Expand"
                                            } ${escapeHTML(chapter.title)}"
                                            aria-expanded="${isExpanded}"
                                        >
                                            ${isExpanded ? "⌄" : "›"}
                                        </button>
                                    </div>

                                    <!-- SCENE NAVIGATION -->

                                    ${
                                        isExpanded
                                            ? `
                                                <div
                                                    class="storyforge-outline-scenes"
                                                >
                                                    ${chapter.scenes.map(
                                                        scene => {
                                                            const isActive =
                                                                activeChapterId === chapter.id &&
                                                                activeSceneId === scene.id;

                                                            return `
                                                                <button
                                                                    type="button"
                                                                    class="
                                                                        btn w-100
                                                                        text-start
                                                                        storyforge-outline-scene
                                                                        ${isActive ? "active" : ""}
                                                                    "
                                                                    data-outline-action="scene"
                                                                    data-chapter-id="${escapeHTML(chapter.id)}"
                                                                    data-scene-id="${escapeHTML(scene.id)}"
                                                                    ${
                                                                        isActive
                                                                            ? 'aria-current="location"'
                                                                            : ""
                                                                    }
                                                                >
                                                                    <span class="d-block">
                                                                        ${escapeHTML(scene.title)}
                                                                    </span>

                                                                    <small class="d-block mt-1">
                                                                        ${formatWordCount(
                                                                            countSceneWords(
                                                                                scene.content
                                                                            )
                                                                        )}
                                                                    </small>
                                                                </button>
                                                            `;
                                                        }
                                                    ).join("")}
                                                </div>
                                            `
                                            : ""
                                    }

                                </div>
                            `;
                        }).join("")}

                    </nav>
                </div>
            </aside>
        `;
    }

    // --------------------------------------------------------
    // ACTIVE SECTION
    // --------------------------------------------------------

    function setActiveChapter(selectedChapterId) {
        activeChapterId = selectedChapterId;
        activeSceneId = null;

        render();
    }

    function setActiveScene(
        selectedChapterId,
        selectedSceneId
    ) {
        if (
            activeChapterId === selectedChapterId &&
            activeSceneId === selectedSceneId &&
            expandedChapters.has(selectedChapterId)
        ) {
            return;
        }

        activeChapterId = selectedChapterId;
        activeSceneId = selectedSceneId;

        expandedChapters.add(selectedChapterId);

        render();
    }

    // --------------------------------------------------------
    // COLLAPSE / EXPAND
    // --------------------------------------------------------

    function toggleChapter(selectedChapterId) {
        if (expandedChapters.has(selectedChapterId)) {
            expandedChapters.delete(selectedChapterId);
        } else {
            expandedChapters.add(selectedChapterId);
        }

        render();
    }

    // --------------------------------------------------------
    // CLICK HANDLING
    // --------------------------------------------------------

    function handleClick(event) {
        const button = event.target.closest(
            "[data-outline-action]"
        );

        if (!button || !container.contains(button)) {
            return;
        }

        const action = button.dataset.outlineAction;
        const selectedChapterId = button.dataset.chapterId;

        if (action === "toggle") {
            toggleChapter(selectedChapterId);
            return;
        }

        if (action === "chapter") {
            setActiveChapter(selectedChapterId);

            onNavigate?.({
                type: "chapter",
                chapterId: selectedChapterId
            });

            return;
        }

        if (action === "scene") {
            const selectedSceneId = button.dataset.sceneId;

            setActiveScene(
                selectedChapterId,
                selectedSceneId
            );

            onNavigate?.({
                type: "scene",
                chapterId: selectedChapterId,
                sceneId: selectedSceneId
            });
        }
    }

    container.addEventListener(
        "click",
        handleClick
    );

    // --------------------------------------------------------
    // CLEANUP
    // --------------------------------------------------------

    function destroy() {
        container.removeEventListener(
            "click",
            handleClick
        );
    }

    // --------------------------------------------------------
    // INITIALISE
    // --------------------------------------------------------

    render();

    return {
        setActiveChapter,
        setActiveScene,
        destroy
    };
}
