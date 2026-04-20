"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCtr = void 0;
const projects_service_1 = require("../services/projects.service");
const users_service_1 = require("../services/users.service");
const projectValidation_1 = require("../Validation/projectValidation");
const mongoose_1 = __importDefault(require("mongoose"));
class projectClass {
    constructor() {
        // create project
        this.createProject = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { error, value } = projectValidation_1.projectSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: error.message });
                }
                const { projectName, projectDescription } = value;
                const email = req.userEmail;
                if (!email) {
                    return res.status(401).json({ error: 'Unauthorized' });
                }
                const user = yield users_service_1.userServices.checkEmail(email);
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                const project = yield projects_service_1.ProjectServices.createNewProject({
                    projectName,
                    projectDescription,
                    owner: user._id,
                });
                return res.status(201).json(project);
            }
            catch (error) {
                return res.status(500).json({ error: error.message });
            }
        });
        //Update project based on project-ID
        this.updateProject = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.params.projectId;
                // Validate projectId
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    return res.status(404).json({ error: 'Project not found' });
                }
                // Validate body
                const { error, value } = projectValidation_1.projectSchema.validate(req.body);
                if (error) {
                    return res.status(400).json({ error: error.message });
                }
                // Update project
                const updatedProject = yield projects_service_1.ProjectServices.updateProject(id, value);
                res.status(200).json(updatedProject);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Lists all projects
        this.listProjects = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const projects = yield projects_service_1.ProjectServices.listAllProjects();
                res.status(200).json(projects);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // Gets specific project details with fileCount and jobCount
        this.viewProject = (req, res) => __awaiter(this, void 0, void 0, function* () {
            const id = req.params.projectId;
            try {
                if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
                    return res.status(404).json({ error: 'Project not found' });
                }
                const projectWithStats = yield projects_service_1.ProjectServices.getProjectWithStats(id);
                if (!projectWithStats) {
                    return res.status(404).json({ message: 'Project not found' });
                }
                res.status(200).json(projectWithStats);
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        // delete project
        this.deleteProject = (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { projectId } = req.params;
                const result = yield projects_service_1.ProjectServices.deleteProject(projectId);
                res.status(200).json(result);
            }
            catch (error) {
                console.error('Delete project error:', error);
                res.status(error.status || 500).json({
                    error: error.message || 'Internal Server Error',
                });
            }
        });
    }
}
exports.ProjectCtr = new projectClass();
//# sourceMappingURL=project.controller.js.map