import { saveProjects, getProjects} from './storage.js';
import { createProject } from './projects.js';

const testProject = createProject("Test Novel");

saveProjects([testProject]);

console.log(getProjects());