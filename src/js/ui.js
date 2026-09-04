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
        </div>
    `;
}