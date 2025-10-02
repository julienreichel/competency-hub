import { describe, expect, it } from 'vitest';
import {
  Project,
  type AmplifyProject,
  type ProjectInit,
  type ProjectStatus,
} from '../../src/models/Project';
import { User, UserRole } from '../../src/models/User';

describe('Project model', () => {
  const baseInit: ProjectInit = {
    id: 'project-1',
    studentId: 'student-1',
    subCompetencyId: 'subcomp-1',
    name: 'My Science Project',
    description: 'A detailed study of plants',
    fileKey: 'projects/my-project.pdf',
    status: 'Draft' as ProjectStatus,
  };

  it('constructs with required fields', () => {
    const project = new Project(baseInit);
    expect(project.id).toBe('project-1');
    expect(project.studentId).toBe('student-1');
    expect(project.subCompetencyId).toBe('subcomp-1');
    expect(project.name).toBe('My Science Project');
    expect(project.description).toBe('A detailed study of plants');
    expect(project.fileKey).toBe('projects/my-project.pdf');
    expect(project.status).toBe('Draft');
  });

  it('constructs with defaults for optional fields', () => {
    const project = new Project({
      id: 'project-2',
      studentId: 'student-1',
      subCompetencyId: 'subcomp-1',
      name: 'Simple Project',
    });
    expect(project.description).toBeNull();
    expect(project.fileKey).toBeNull();
    expect(project.status).toBe('Draft');
  });

  it('validates required fields', () => {
    expect(() => new Project({ ...baseInit, name: '' })).toThrow('Project name is required');
    expect(() => new Project({ ...baseInit, studentId: '' })).toThrow(
      'Project student ID is required',
    );
    expect(() => new Project({ ...baseInit, subCompetencyId: '' })).toThrow(
      'Project sub-competency ID is required',
    );
  });

  it('creates from amplify payload with relations', () => {
    const mockUser = {
      id: 'student-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Student',
      owner: 'student-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const mockSubCompetency = {
      id: 'subcomp-1',
      competencyId: 'comp-1',
      name: 'Plant Biology',
      level: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    const raw = {
      ...baseInit,
      student: mockUser,
      subCompetency: mockSubCompetency,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    } as unknown as AmplifyProject;

    const project = Project.fromAmplify(raw);
    expect(project.name).toBe('My Science Project');
    expect(project.student?.name).toBe('John Doe');
    expect(project.subCompetency?.name).toBe('Plant Biology');
    expect(project.createdAt).toBe('2024-01-01T00:00:00.000Z');
  });

  it('clones correctly', () => {
    const student = new User({
      id: 'student-1',
      name: 'John Doe',
      email: 'john@example.com',
      role: UserRole.STUDENT,
    });

    const project = new Project({
      ...baseInit,
      student,
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    const cloned = project.clone();
    expect(cloned.id).toBe(project.id);
    expect(cloned.name).toBe(project.name);
    expect(cloned.student?.name).toBe(project.student?.name);
    expect(cloned).not.toBe(project);
    expect(cloned.student).not.toBe(project.student);
  });

  it('updates fields correctly', () => {
    const project = new Project(baseInit);
    const updated = project.update({
      name: 'Updated Project Name',
      status: 'Submitted' as ProjectStatus,
    });

    expect(updated.name).toBe('Updated Project Name');
    expect(updated.status).toBe('Submitted');
    expect(updated.description).toBe(project.description);
    expect(updated.id).toBe(project.id);
  });

  it('converts to JSON correctly', () => {
    const project = new Project(baseInit);
    const json = project.toJSON();

    expect(json).toMatchObject({
      id: 'project-1',
      studentId: 'student-1',
      subCompetencyId: 'subcomp-1',
      name: 'My Science Project',
      description: 'A detailed study of plants',
      fileKey: 'projects/my-project.pdf',
      status: 'Draft',
      student: null,
      subCompetency: null,
    });
  });
});
