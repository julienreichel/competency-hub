import { beforeEach, describe, expect, it, vi } from 'vitest';
import { graphQLClient } from '../../src/models/base/GraphQLClient';
import { Project } from '../../src/models/Project';
import { ProjectRepository } from '../../src/models/repositories/ProjectRepository';

const mockGraphQLClient = graphQLClient as unknown as {
  createProject: ReturnType<typeof vi.fn>;
  getProject: ReturnType<typeof vi.fn>;
  updateProject: ReturnType<typeof vi.fn>;
  deleteProject: ReturnType<typeof vi.fn>;
};

vi.mock('../../src/models/base/GraphQLClient', () => ({
  graphQLClient: {
    createProject: vi.fn(),
    getProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

const rawProject = {
  id: 'project-1',
  studentId: 'student-1',
  subCompetencyId: 'subcomp-1',
  name: 'My Science Project',
  description: 'A detailed study of plants',
  fileKey: 'projects/my-project.pdf',
  status: 'Draft',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('ProjectRepository', () => {
  let repository: ProjectRepository;

  beforeEach(() => {
    repository = new ProjectRepository();
    vi.clearAllMocks();
  });

  it('creates project and returns model', async () => {
    mockGraphQLClient.createProject.mockResolvedValue(rawProject);

    const result = await repository.create({
      studentId: 'student-1',
      subCompetencyId: 'subcomp-1',
      name: 'My Science Project',
      description: 'A detailed study of plants',
    });

    expect(mockGraphQLClient.createProject).toHaveBeenCalledWith({
      studentId: 'student-1',
      subCompetencyId: 'subcomp-1',
      name: 'My Science Project',
      description: 'A detailed study of plants',
      status: 'Draft',
    });
    expect(result).toBeInstanceOf(Project);
    expect(result.name).toBe('My Science Project');
  });

  it('throws when creation returns null', async () => {
    mockGraphQLClient.createProject.mockResolvedValue(null);

    await expect(
      repository.create({
        studentId: 'student-1',
        subCompetencyId: 'subcomp-1',
        name: 'My Project',
      }),
    ).rejects.toThrow('Failed to create project');
  });

  it('finds project by id', async () => {
    mockGraphQLClient.getProject.mockResolvedValue(rawProject);

    const result = await repository.findById('project-1');

    expect(mockGraphQLClient.getProject).toHaveBeenCalledWith('project-1');
    expect(result).toBeInstanceOf(Project);
    expect(result?.name).toBe('My Science Project');
  });

  it('returns null when project not found', async () => {
    mockGraphQLClient.getProject.mockResolvedValue(null);

    const result = await repository.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('updates project and returns model', async () => {
    mockGraphQLClient.updateProject.mockResolvedValue({
      ...rawProject,
      name: 'Updated Project',
      status: 'Submitted',
    });

    const result = await repository.update('project-1', {
      name: 'Updated Project',
      status: 'Submitted',
    });

    expect(mockGraphQLClient.updateProject).toHaveBeenCalledWith({
      id: 'project-1',
      name: 'Updated Project',
      status: 'Submitted',
    });
    expect(result).toBeInstanceOf(Project);
    expect(result.name).toBe('Updated Project');
  });

  it('throws when update returns null', async () => {
    mockGraphQLClient.updateProject.mockResolvedValue(null);

    await expect(repository.update('project-1', { name: 'Updated' })).rejects.toThrow(
      'Failed to update project project-1',
    );
  });

  it('deletes project and returns model', async () => {
    mockGraphQLClient.deleteProject.mockResolvedValue(rawProject);

    const result = await repository.delete('project-1');

    expect(mockGraphQLClient.deleteProject).toHaveBeenCalledWith('project-1');
    expect(result).toBeInstanceOf(Project);
  });

  it('throws when delete returns null', async () => {
    mockGraphQLClient.deleteProject.mockResolvedValue(null);

    await expect(repository.delete('project-1')).rejects.toThrow(
      'Failed to delete project project-1',
    );
  });
});
