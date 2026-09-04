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

export function renderProjectList(container, projects) {
    if (projects.length === 0) {
        container.innerHTML = `
            <p class="text-muted mt-4">
                No projects yet. Create your first project above.
            </p>
        `;

        return;
    }

    container.innerHTML = `
        <div class="mt-5">
            <h2>Your Projects</h2>

            <div class="row g-3 mt-2">
                ${projects.map(project => `
                    <div class="col-md-6 col-lg-4">
                        <div class="card h-100">
                            <div class="card-body">
                                <h3 class="card-title h5">
                                    ${project.title}
                                </h3>

                                <p class="card-text text-muted">
                                    ${project.chapters.length} chapters
                                </p>
                            </div>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}