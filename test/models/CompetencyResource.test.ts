import { describe, expect, it, vi } from 'vitest';
import type { AmplifyResource } from '../../src/models/CompetencyResource';
import { CompetencyResource, ResourceType } from '../../src/models/CompetencyResource';
import { User, UserRole } from '../../src/models/User';

describe('CompetencyResource', () => {
  const baseInit = {
    id: 'res-1',
    subCompetencyId: 'sub-1',
    name: 'Resource Name',
    description: 'A description',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  it('creates a LINK resource with valid url', () => {
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.LINK,
      url: 'https://example.com',
    });
    expect(resource.type).toBe(ResourceType.LINK);
    expect(resource.url).toBe('https://example.com');
    expect(resource.toJSON().type).toBe(ResourceType.LINK);
  });

  it('throws if LINK resource missing url', () => {
    expect(
      () =>
        new CompetencyResource({
          ...baseInit,
          type: ResourceType.LINK,
          url: '',
        }),
    ).toThrow('Resource URL is required');
  });

  it('creates a DOCUMENT resource with fileKey', () => {
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.DOCUMENT,
      fileKey: 'file.pdf',
    });
    expect(resource.type).toBe(ResourceType.DOCUMENT);
    expect(resource.fileKey).toBe('file.pdf');
  });

  it('throws if DOCUMENT resource missing fileKey', () => {
    expect(
      () =>
        new CompetencyResource({
          ...baseInit,
          type: ResourceType.DOCUMENT,
          fileKey: '',
        }),
    ).toThrow('File Key is required');
  });

  it('creates a HUMAN resource with personUserId and person', () => {
    const user = new User({
      id: 'u1',
      name: 'Alice',
      role: UserRole.STUDENT,
      email: 'alice@example.com',
    });
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.HUMAN,
      personUserId: 'u1',
      person: user,
    });
    expect(resource.type).toBe(ResourceType.HUMAN);
    expect(resource.personUserId).toBe('u1');
    expect(resource.person?.name).toBe('Alice');
  });

  it('throws if HUMAN resource missing personUserId', () => {
    expect(
      () =>
        new CompetencyResource({
          ...baseInit,
          type: ResourceType.HUMAN,
          person: new User({
            id: 'u1',
            name: 'Alice',
            role: UserRole.STUDENT,
            email: 'alice@example.com',
          }),
        }),
    ).toThrow('Human resource must reference a user');
  });

  it('throws on invalid resource type', () => {
    expect(
      () =>
        new CompetencyResource({
          ...baseInit,
          type: 'InvalidType' as unknown as ResourceType,
        }),
    ).toThrow('Invalid resource type');
  });

  it('clones resource correctly', () => {
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.LINK,
      url: 'https://example.com',
    });
    const clone = resource.clone();
    expect(clone).not.toBe(resource);
    expect(clone.toJSON()).toEqual(resource.toJSON());
  });

  it('fromAmplify maps all fields', () => {
    const amplify = {
      id: 'res-amp',
      subCompetencyId: 'sub-amp',
      type: 'Link',
      name: 'Amplify Resource',
      description: 'desc',
      url: 'https://amplify.com',
      fileKey: null,
      personUserId: null,
      person: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };
    const resource = CompetencyResource.fromAmplify(amplify as unknown as AmplifyResource);
    expect(resource.id).toBe('res-amp');
    expect(resource.type).toBe(ResourceType.LINK);
    expect(resource.url).toBe('https://amplify.com');
  });

  it('resolveFileUrl returns fileKey if already a URL', async () => {
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.DOCUMENT,
      fileKey: 'https://files.com/file.pdf',
    });
    expect(await resource.resolveFileUrl()).toBe('https://files.com/file.pdf');
  });

  it('resolveFileUrl returns signed url from getUrl', async () => {
    vi.mock('aws-amplify/storage', () => ({
      getUrl: vi.fn().mockResolvedValue({ url: 'https://signed.com/file.pdf' }),
    }));
    const { CompetencyResource: CR, ResourceType: RT } = await import(
      '../../src/models/CompetencyResource'
    );
    const resource = new CR({
      ...baseInit,
      type: RT.DOCUMENT,
      fileKey: 'file.pdf',
    });
    expect(await resource.resolveFileUrl()).toBe('https://signed.com/file.pdf');
  });

  it('toJSON outputs all fields', () => {
    const user = new User({
      id: 'u1',
      name: 'Alice',
      role: UserRole.STUDENT,
      email: 'alice@example.com',
    });
    const resource = new CompetencyResource({
      ...baseInit,
      type: ResourceType.HUMAN,
      personUserId: 'u1',
      person: user,
    });
    const json = resource.toJSON();
    expect(json.id).toBe('res-1');
    expect(json.type).toBe(ResourceType.HUMAN);
    expect(json.personUserId).toBe('u1');
    expect(json.person).toBeTruthy();
  });
});
