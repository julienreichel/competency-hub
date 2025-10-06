import { beforeEach, describe, expect, it, vi } from 'vitest';

const repoMocks = vi.hoisted(() => {
  return {
    domainUpdate: vi.fn(),
    competencyCreate: vi.fn(),
    competencyUpdate: vi.fn(),
    subCreate: vi.fn(),
    subUpdate: vi.fn(),
    resourceCreate: vi.fn(),
    resourceUpdate: vi.fn(),
    evaluationCreate: vi.fn(),
    evaluationUpdate: vi.fn(),
    state: {
      competencyById: new Map<string, unknown>(),
      subById: new Map<string, unknown>(),
      counters: {
        competency: 0,
        sub: 0,
        resource: 0,
        evaluation: 0,
      },
    },
  };
});

vi.mock('src/models/repositories/DomainRepository', () => ({
  domainRepository: {
    update: repoMocks.domainUpdate,
  },
}));

vi.mock('src/models/repositories/CompetencyRepository', () => ({
  competencyRepository: {
    create: repoMocks.competencyCreate,
    update: repoMocks.competencyUpdate,
  },
}));

vi.mock('src/models/repositories/SubCompetencyRepository', () => ({
  subCompetencyRepository: {
    create: repoMocks.subCreate,
    update: repoMocks.subUpdate,
  },
}));

vi.mock('src/models/repositories/ResourceRepository', () => ({
  resourceRepository: {
    create: repoMocks.resourceCreate,
    update: repoMocks.resourceUpdate,
  },
}));

vi.mock('src/models/repositories/EvaluationRepository', () => ({
  evaluationRepository: {
    create: repoMocks.evaluationCreate,
    update: repoMocks.evaluationUpdate,
  },
}));

import type { DomainJsonPayload } from 'src/composables/useDomainJsonSync';
import {
  buildDomainExportPayload,
  parseDomainJson,
  useDomainJsonSync,
} from 'src/composables/useDomainJsonSync';
import { Competency } from 'src/models/Competency';
import { CompetencyResource, ResourceType } from 'src/models/CompetencyResource';
import { Domain } from 'src/models/Domain';
import { Evaluation, EvaluationFormat, EvaluationMode } from 'src/models/Evaluation';
import { SubCompetency } from 'src/models/SubCompetency';

describe('useDomainJsonSync - JSON parsing safety net', () => {
  it('parses a well-formed JSON payload', () => {
    const payload = {
      domain: { id: 'dom-1', name: 'STEM Domain', colorCode: '#123456' },
      competencies: [],
    } satisfies DomainJsonPayload;

    const result = parseDomainJson(JSON.stringify(payload));
    expect(result).toEqual(payload);
  });

  it('throws when JSON is malformed', () => {
    expect(() => parseDomainJson('not-json')).toThrowError('Unable to parse JSON file.');
  });

  it('throws when domain information is missing', () => {
    const invalidPayload = { competencies: [] };
    expect(() => parseDomainJson(JSON.stringify(invalidPayload))).toThrowError(
      'Invalid import file: missing domain definition.',
    );
  });
});

describe('useDomainJsonSync - export experience', () => {
  it('serialises a domain hierarchy into a prettified JSON string', () => {
    const evaluation = new Evaluation({
      id: 'eval-1',
      subCompetencyId: 'sub-1',
      name: 'Lab project',
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.EXPERIMENT,
    });

    const resource = new CompetencyResource({
      id: 'res-1',
      subCompetencyId: 'sub-1',
      type: ResourceType.LINK,
      name: 'Reference',
      url: 'https://example.com',
    });

    const subCompetency = new SubCompetency({
      id: 'sub-1',
      competencyId: 'comp-1',
      name: 'Chemistry basics',
      resources: [resource],
      evaluations: [evaluation],
    });

    const competency = new Competency({
      id: 'comp-1',
      domainId: 'dom-1',
      name: 'Chemistry',
      subCompetencies: [subCompetency],
    });

    const domain = new Domain({
      id: 'dom-1',
      name: 'Science',
      colorCode: '#00AAFF',
      competencies: [competency],
    });

    const payload = buildDomainExportPayload(domain);
    expect(payload).toEqual({
      domain: { id: 'dom-1', name: 'Science', colorCode: '#00AAFF' },
      competencies: [
        {
          id: 'comp-1',
          name: 'Chemistry',
          description: null,
          objectives: null,
          subCompetencies: [
            {
              id: 'sub-1',
              name: 'Chemistry basics',
              description: null,
              objectives: null,
              level: 0,
              resources: [
                {
                  id: 'res-1',
                  type: ResourceType.LINK,
                  name: 'Reference',
                  description: null,
                  url: 'https://example.com',
                  fileKey: null,
                  personUserId: null,
                },
              ],
              evaluations: [
                {
                  id: 'eval-1',
                  name: 'Lab project',
                  description: null,
                  mode: EvaluationMode.SOLO,
                  format: EvaluationFormat.EXPERIMENT,
                  durationMin: null,
                  url: null,
                  fileKey: null,
                },
              ],
            },
          ],
        },
      ],
    });

    const { exportDomainToJson } = useDomainJsonSync();
    const json = exportDomainToJson(domain);
    expect(JSON.parse(json)).toEqual(payload);
  });
});

describe('useDomainJsonSync - hierarchy merging', () => {
  const {
    domainUpdate,
    competencyCreate,
    competencyUpdate,
    subCreate,
    subUpdate,
    resourceCreate,
    resourceUpdate,
    evaluationCreate,
    evaluationUpdate,
    state,
  } = repoMocks;

  const resetState = (): void => {
    state.competencyById = new Map<string, unknown>();
    state.subById = new Map<string, unknown>();
    state.counters = { competency: 0, sub: 0, resource: 0, evaluation: 0 };
  };

  const registerCompetency = (competency: Competency): void => {
    state.competencyById.set(competency.id, competency);
  };

  const registerSubCompetency = (sub: SubCompetency): void => {
    state.subById.set(sub.id, sub);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetState();

    competencyCreate.mockImplementation((data) => {
      const id = data.id ?? `generated-comp-${state.counters.competency++}`;
      const created = new Competency({
        id,
        domainId: data.domainId,
        name: data.name,
        description: data.description ?? null,
        objectives: data.objectives ?? null,
        subCompetencies: [],
      });
      registerCompetency(created);
      return Promise.resolve(created);
    });

    competencyUpdate.mockImplementation((id, data) => {
      const base = state.competencyById.get(id) as Competency | undefined;
      if (!base) throw new Error(`Unknown competency ${id}`);
      const updated = new Competency({
        id,
        domainId: base.domainId,
        name: data.name ?? base.name,
        description: data.description ?? base.description,
        objectives: data.objectives ?? base.objectives,
        subCompetencies: base.subCompetencies,
      });
      registerCompetency(updated);
      return Promise.resolve(updated);
    });

    subCreate.mockImplementation((data) => {
      const id = data.id ?? `generated-sub-${state.counters.sub++}`;
      const created = new SubCompetency({
        id,
        competencyId: data.competencyId,
        name: data.name,
        description: data.description ?? null,
        objectives: data.objectives ?? null,
        level: typeof data.level === 'number' ? data.level : undefined,
        resources: [],
        evaluations: [],
      });
      registerSubCompetency(created);
      return Promise.resolve(created);
    });

    subUpdate.mockImplementation((id, data) => {
      const base = state.subById.get(id) as SubCompetency | undefined;
      if (!base) throw new Error(`Unknown sub-competency ${id}`);
      const updated = new SubCompetency({
        id,
        competencyId: base.competencyId,
        name: data.name ?? base.name,
        description: data.description ?? base.description,
        objectives: data.objectives ?? base.objectives,
        level: typeof data.level === 'number' ? data.level : base.level,
        resources: base.resources,
        evaluations: base.evaluations,
      });
      registerSubCompetency(updated);
      return Promise.resolve(updated);
    });

    resourceCreate.mockImplementation((data) => {
      const id = data.id ?? `generated-resource-${state.counters.resource++}`;
      return Promise.resolve(
        new CompetencyResource({
          id,
          subCompetencyId: data.subCompetencyId,
          type: data.type,
          name: data.name,
          description: data.description ?? null,
          url: data.url ?? null,
          fileKey: data.fileKey ?? null,
          personUserId: data.personUserId ?? null,
        }),
      );
    });

    resourceUpdate.mockImplementation((id, data) =>
      Promise.resolve(
        new CompetencyResource({
          id,
          subCompetencyId: data.subCompetencyId,
          type: data.type,
          name: data.name,
          description: data.description ?? null,
          url: data.url ?? null,
          fileKey: data.fileKey ?? null,
          personUserId: data.personUserId ?? null,
        }),
      ),
    );

    evaluationCreate.mockImplementation((data) => {
      const id = data.id ?? `generated-eval-${state.counters.evaluation++}`;
      return Promise.resolve(
        new Evaluation({
          id,
          subCompetencyId: data.subCompetencyId,
          name: data.name,
          description: data.description ?? null,
          mode: data.mode,
          format: data.format,
          durationMin: data.durationMin ?? null,
          url: data.url ?? null,
          fileKey: data.fileKey ?? null,
        }),
      );
    });

    evaluationUpdate.mockImplementation((id, data) =>
      Promise.resolve(
        new Evaluation({
          id,
          subCompetencyId: data.subCompetencyId,
          name: data.name,
          description: data.description ?? null,
          mode: data.mode,
          format: data.format,
          durationMin: data.durationMin ?? null,
          url: data.url ?? null,
          fileKey: data.fileKey ?? null,
        }),
      ),
    );
  });

  it('merges the imported hierarchy, updating matches and creating missing entries', async () => {
    const existingResource = new CompetencyResource({
      id: 'res-existing',
      subCompetencyId: 'sub-existing',
      type: ResourceType.LINK,
      name: 'Existing resource',
      url: 'https://existing.example.com',
    });

    const existingEvaluation = new Evaluation({
      id: 'eval-existing',
      subCompetencyId: 'sub-existing',
      name: 'Existing evaluation',
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.ORAL,
    });

    const existingSub = new SubCompetency({
      id: 'sub-existing',
      competencyId: 'comp-existing',
      name: 'Existing sub',
      resources: [existingResource],
      evaluations: [existingEvaluation],
      level: 1,
    });

    const existingCompetency = new Competency({
      id: 'comp-existing',
      domainId: 'domain-1',
      name: 'Existing competency',
      description: 'Legacy description',
      objectives: 'Legacy objectives',
      subCompetencies: [existingSub],
    });

    registerCompetency(existingCompetency);
    registerSubCompetency(existingSub);

    const currentDomain = new Domain({
      id: 'domain-1',
      name: 'Existing domain',
      colorCode: null,
      competencies: [existingCompetency],
    });

    domainUpdate.mockResolvedValue(
      new Domain({
        id: 'domain-1',
        name: 'Updated domain',
        colorCode: '#123456',
      }),
    );

    const payload: DomainJsonPayload = {
      domain: {
        id: 'domain-1',
        name: 'Updated domain',
        colorCode: '#123456',
      },
      competencies: [
        {
          id: 'comp-existing',
          name: 'Existing competency (updated)',
          description: 'Updated description',
          objectives: 'Updated objectives',
          subCompetencies: [
            {
              id: 'sub-existing',
              name: 'Existing sub (updated)',
              description: 'Fresh description',
              objectives: 'Fresh objectives',
              level: 2,
              resources: [
                {
                  id: 'res-existing',
                  type: ResourceType.LINK,
                  name: 'Existing resource (updated)',
                  description: 'Latest reference',
                  url: 'https://updated.example.com',
                  fileKey: null,
                  personUserId: null,
                },
                {
                  id: 'res-new-existing-sub',
                  type: ResourceType.LINK,
                  name: 'New supporting resource',
                  url: 'https://new-existing-sub.example.com',
                  description: null,
                  fileKey: null,
                  personUserId: null,
                },
              ],
              evaluations: [
                {
                  id: 'eval-existing',
                  name: 'Existing evaluation (updated)',
                  description: null,
                  mode: EvaluationMode.SOLO,
                  format: EvaluationFormat.ORAL,
                  durationMin: 45,
                  url: null,
                  fileKey: null,
                },
                {
                  id: 'eval-new-existing-sub',
                  name: 'New on-site evaluation',
                  description: null,
                  mode: EvaluationMode.PEER,
                  format: EvaluationFormat.DIGITAL,
                  durationMin: null,
                  url: null,
                  fileKey: null,
                },
              ],
            },
            {
              id: 'sub-new-existing',
              name: 'Brand-new sub competency',
              description: 'New learning objective',
              objectives: 'Students explore advanced labs',
              level: 1,
              resources: [
                {
                  id: 'res-new-existing',
                  type: ResourceType.LINK,
                  name: 'Starter kit',
                  url: 'https://starter-kit.example.com',
                  description: null,
                  fileKey: null,
                  personUserId: null,
                },
              ],
              evaluations: [
                {
                  id: 'eval-new-existing',
                  name: 'Kick-off evaluation',
                  description: null,
                  mode: EvaluationMode.ADULT,
                  format: EvaluationFormat.ORAL,
                  durationMin: null,
                  url: null,
                  fileKey: null,
                },
              ],
            },
          ],
        },
        {
          id: 'comp-new',
          name: 'Newly imported competency',
          description: 'Covering robotics fundamentals',
          objectives: 'Enable robotics club projects',
          subCompetencies: [
            {
              id: 'sub-brand-new',
              name: 'Robotics basics',
              description: 'Students assemble basic robot',
              objectives: 'Understand circuits and sensors',
              level: 1,
              resources: [
                {
                  id: 'res-brand-new',
                  type: ResourceType.LINK,
                  name: 'Robotics workbook',
                  url: 'https://robotics.example.com',
                  description: null,
                  fileKey: null,
                  personUserId: null,
                },
              ],
              evaluations: [
                {
                  id: 'eval-brand-new',
                  name: 'Robotics showcase',
                  description: null,
                  mode: EvaluationMode.SOLO,
                  format: EvaluationFormat.EXPERIMENT,
                  durationMin: null,
                  url: null,
                  fileKey: null,
                },
              ],
            },
          ],
        },
      ],
    };

    const { importDomainFromJson, importLoading } = useDomainJsonSync();

    const importPromise = importDomainFromJson(payload, {
      currentDomain,
      existingCompetencies: [existingCompetency],
    });

    expect(importLoading.value).toBe(true);

    const summary = await importPromise;

    expect(importLoading.value).toBe(false);

    expect(domainUpdate).toHaveBeenCalledWith('domain-1', {
      name: 'Updated domain',
      colorCode: '#123456',
    });

    expect(competencyUpdate).toHaveBeenCalledWith('comp-existing', {
      name: 'Existing competency (updated)',
      description: 'Updated description',
      objectives: 'Updated objectives',
    });

    expect(competencyCreate).toHaveBeenCalledWith({
      domainId: 'domain-1',
      name: 'Newly imported competency',
      description: 'Covering robotics fundamentals',
      objectives: 'Enable robotics club projects',
    });

    expect(subUpdate).toHaveBeenCalledWith('sub-existing', {
      name: 'Existing sub (updated)',
      description: 'Fresh description',
      objectives: 'Fresh objectives',
      level: 2,
    });

    expect(subCreate).toHaveBeenCalledWith({
      competencyId: 'comp-existing',
      name: 'Brand-new sub competency',
      description: 'New learning objective',
      objectives: 'Students explore advanced labs',
      level: 1,
    });

    expect(subCreate).toHaveBeenCalledWith({
      competencyId: 'generated-comp-0',
      name: 'Robotics basics',
      description: 'Students assemble basic robot',
      objectives: 'Understand circuits and sensors',
      level: 1,
    });

    expect(resourceUpdate).toHaveBeenCalledWith('res-existing', {
      subCompetencyId: 'sub-existing',
      type: ResourceType.LINK,
      name: 'Existing resource (updated)',
      description: 'Latest reference',
      url: 'https://updated.example.com',
      fileKey: null,
      personUserId: null,
    });

    expect(resourceCreate).toHaveBeenCalledWith({
      subCompetencyId: 'sub-existing',
      type: ResourceType.LINK,
      name: 'New supporting resource',
      description: null,
      url: 'https://new-existing-sub.example.com',
      fileKey: null,
      personUserId: null,
    });

    expect(resourceCreate).toHaveBeenCalledWith({
      subCompetencyId: 'generated-sub-0',
      type: ResourceType.LINK,
      name: 'Starter kit',
      description: null,
      url: 'https://starter-kit.example.com',
      fileKey: null,
      personUserId: null,
    });

    expect(resourceCreate).toHaveBeenCalledWith({
      subCompetencyId: 'generated-sub-1',
      type: ResourceType.LINK,
      name: 'Robotics workbook',
      description: null,
      url: 'https://robotics.example.com',
      fileKey: null,
      personUserId: null,
    });

    expect(evaluationUpdate).toHaveBeenCalledWith('eval-existing', {
      subCompetencyId: 'sub-existing',
      name: 'Existing evaluation (updated)',
      description: null,
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.ORAL,
      durationMin: 45,
      url: null,
      fileKey: null,
    });

    expect(evaluationCreate).toHaveBeenCalledWith({
      subCompetencyId: 'sub-existing',
      name: 'New on-site evaluation',
      description: null,
      mode: EvaluationMode.PEER,
      format: EvaluationFormat.DIGITAL,
      durationMin: null,
      url: null,
      fileKey: null,
    });

    expect(evaluationCreate).toHaveBeenCalledWith({
      subCompetencyId: 'generated-sub-0',
      name: 'Kick-off evaluation',
      description: null,
      mode: EvaluationMode.ADULT,
      format: EvaluationFormat.ORAL,
      durationMin: null,
      url: null,
      fileKey: null,
    });

    expect(evaluationCreate).toHaveBeenCalledWith({
      subCompetencyId: 'generated-sub-1',
      name: 'Robotics showcase',
      description: null,
      mode: EvaluationMode.SOLO,
      format: EvaluationFormat.EXPERIMENT,
      durationMin: null,
      url: null,
      fileKey: null,
    });

    expect(summary).toEqual({
      domainUpdated: true,
      competencies: { created: 1, updated: 1 },
      subCompetencies: { created: 2, updated: 1 },
      resources: { created: 3, updated: 1 },
      evaluations: { created: 3, updated: 1 },
    });
  });
});
