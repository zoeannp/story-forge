// Builds the HTML views used by the StoryForge application.
 
// Render the form used to create a new project.
export function renderCreateProjectForm(container) {
    container.innerHTML = `
        <div class="container mt-5">
            <h1>StoryForge</h1>

            <form id="create-project-form" class="mt-4">
                <div class="mb-3">
                    <label for="project-title" class="form-label">
                        Project Title
                    </label>

                    <input
                        type="text"
                        id="project-title"
                        class="form-control"
                        placeholder="Enter project title"
                        required
                    >
                </div>

                <button type="submit" class="btn btn-primary">
                    Create Project
                </button>
            </form>

            <div id="project-list"></div>
        </div>
    `;
}

// Render project cards, or an empty state when no projects exist.
export function renderProjectList(container, projects) {
    if (projects.length === 0) {
        container.innerHTML = `
            <p class="text-muted mt-4">
                No projects yet. Create your first project above.
            </p>
        `;
        return;
    }

    // Each card keeps the project ID in the DOM for event delegation in app.js.
    container.innerHTML = `
        <div class="mt-5">
            <h2>Your Projects</h2>

            <div class="row g-3 mt-2">
                ${projects.map(project => `
                    <div class="col-md-6 col-lg-4">
                        <button
                            class="card h-100 w-100 text-start project-card"
                            data-project-id="${project.id}"
                            type="button"
                        >
                            <div class="card-body">
                                <h3 class="card-title h5">
                                    ${project.title}
                                </h3>

                                <p class="card-text text-muted">
                                    ${project.chapters.length} chapters
                                </p>
                            </div>
                        </button>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}

// Render the selected project and its chapter creation form.
export function renderProjectView(container, project) {
    container.innerHTML = `
        <div class="container mt-5">
            <button
                id="back-to-projects"
                class="btn btn-outline-secondary mb-4"
                type="button"
            >
                ← Back to Projects
            </button>

            <h1>${project.title}</h1>

            <p class="text-muted">
                ${project.chapters.length} chapters
            </p>

            <hr>

            <form id="create-chapter-form" class="mt-4">
                <div class="mb-3">
                    <label for="chapter-title" class="form-label">
                        Chapter Title
                    </label>

                    <input
                        type="text"
                        id="chapter-title"
                        class="form-control"
                        placeholder="Enter chapter title"
                        required
                    >
                </div>

                <button type="submit" class="btn btn-primary">
                    Add Chapter
                </button>
            </form>
        </div>
    `;
}