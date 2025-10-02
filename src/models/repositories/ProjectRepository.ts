import { graphQLClient } from '../base/GraphQLClient';
import { Project, type ProjectStatus } from '../Project';

export interface CreateProjectInput {
  studentId: string;
  subCompetencyId: string;
  name: string;
  description?: string | null;
  fileKey?: string | null;
  status?: ProjectStatus;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

export class ProjectRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    const raw = await graphQLClient.createProject({
      ...data,
      status: data.status ?? 'Draft',
    });
    if (!raw) {
      throw new Error('Failed to create project');
    }
    return Project.fromAmplify(raw);
  }

  async findById(id: string): Promise<Project | null> {
    const raw = await graphQLClient.getProject(id);
    return raw ? Project.fromAmplify(raw) : null;
  }

  async update(id: string, data: UpdateProjectInput): Promise<Project> {
    const raw = await graphQLClient.updateProject({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update project ${id}`);
    }
    return Project.fromAmplify(raw);
  }

  async delete(id: string): Promise<Project> {
    const raw = await graphQLClient.deleteProject(id);
    if (!raw) {
      throw new Error(`Failed to delete project ${id}`);
    }
    return Project.fromAmplify(raw);
  }

  async findByStudentId(studentId: string): Promise<Project[]> {
    const projects = await graphQLClient.listProjects({
      filter: { studentId: { eq: studentId } },
    });
    return projects.map((raw) => Project.fromAmplify(raw));
  }

  async findBySubCompetencyId(subCompetencyId: string): Promise<Project[]> {
    const projects = await graphQLClient.listProjects({
      filter: { subCompetencyId: { eq: subCompetencyId } },
    });
    return projects.map((raw) => Project.fromAmplify(raw));
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    const projects = await graphQLClient.listProjects({
      filter: { status: { eq: status } },
    });
    return projects.map((raw) => Project.fromAmplify(raw));
  }
}

export const projectRepository = new ProjectRepository();
