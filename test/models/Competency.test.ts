import { describe, expect, it } from 'vitest';
import { Competency, type AmplifyCompetency } from '../../src/models/Competency';
import { CompetencyResource, ResourceType } from '../../src/models/CompetencyResource';
import { SubCompetency } from '../../src/models/SubCompetency';
describe('Competency taxonomy models', () => {
  const resourceInit = {
    id: 'resource-1',
    subCompetencyId: 'sub-1',
    type: ResourceType.LINK,
    name: 'Intro video',
    description: 'Watch before class',
    url: 'https://example.com/video',
  };

  const subCompetencyInit = {
    id: 'sub-1',
    competencyId: 'comp-1',
    name: 'Stage 1',
    description: 'First stage',
    objectives: 'Understand basics',
    level: 1,
    resources: [resourceInit],
  };

  const competencyInit = {
    id: 'comp-1',
    domainId: 'domain-1',
    name: 'Foundations',
    description: 'Fundamental knowledge',
    objectives: 'Build confidence',
    subCompetencies: [subCompetencyInit],
  };

  describe('CompetencyResource', () => {
    it('creates a resource with valid data', () => {
      const resource = new CompetencyResource(resourceInit);

      expect(resource.type).toBe(ResourceType.LINK);
      expect(resource.url).toBe('https://example.com/video');
      expect(resource.person).toBeNull();
    });

    it('throws when URL is missing for link resources', () => {
      expect(
        () =>
          new CompetencyResource({
            ...resourceInit,
            url: null,
          }),
      ).toThrow('Resource URL is required for link and document types');
    });

    it('allows cloning', () => {
      const resource = new CompetencyResource(resourceInit);
      const clone = resource.clone();

      expect(clone).not.toBe(resource);
      expect(clone.toJSON()).toEqual(resource.toJSON());
    });

    it('fromAmplify maps all fields and nested sub-competencies', () => {
      const amplify = {
        id: 'comp-amp',
        domainId: 'domain-amp',
        name: 'Amplify Comp',
        description: 'desc',
        objectives: 'obj',
        subCompetencies: [
          {
            id: 'sub-amp',
            competencyId: 'comp-amp',
            name: 'SubAmp',
          },
        ],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      };
      const comp = Competency.fromAmplify(amplify as unknown as AmplifyCompetency);
      expect(comp.id).toBe('comp-amp');
      expect(comp.subCompetencies[0]?.name).toBe('SubAmp');
      expect(comp.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(comp.updatedAt).toBe('2024-01-02T00:00:00Z');
    });

    it('toJSON outputs all fields and nested arrays', () => {
      const comp = new Competency(competencyInit);
      const json = comp.toJSON();
      expect(json.id).toBe(competencyInit.id);
      expect(Array.isArray(json.subCompetencies)).toBe(true);
    });

    it('withUpdatedSubCompetencies returns new instance with updated subs', () => {
      const comp = new Competency(competencyInit);
      const newSub = new SubCompetency({
        ...competencyInit.subCompetencies[0],
        id: 'sub-new',
        name: 'NewSub',
        competencyId: competencyInit.id, // ensure required field
      });
      const updated = comp.withUpdatedSubCompetencies([newSub]);
      expect(updated).not.toBe(comp);
      expect(updated.subCompetencies[0]?.id).toBe('sub-new');
    });

    it('getStatus returns correct status for all branches', () => {
      // Locked: all subs locked
      const subLocked = {
        getStatus: () => 'Locked',
        name: 'LockedSub',
        competencyId: 'comp-1',
        id: 'sub-locked',
        studentProgress: [
          {
            id: 'sp-locked',
            studentId: 'student-1',
            subCompetencyId: 'sub-locked',
            status: 'Locked',
            percent: 0,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const compLocked = new Competency({
        ...competencyInit,
        subCompetencies: [subLocked, subLocked],
      });
      expect(compLocked.getStatus()).toBe('Locked');
      // Validated: all subs validated
      const subValidated = {
        getStatus: () => 'Validated',
        name: 'ValidatedSub',
        competencyId: 'comp-1',
        id: 'sub-validated',
        studentProgress: [
          {
            id: 'sp-validated',
            studentId: 'student-1',
            subCompetencyId: 'sub-validated',
            status: 'Validated',
            percent: 100,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const compValidated = new Competency({
        ...competencyInit,
        subCompetencies: [subValidated, subValidated],
      });
      expect(compValidated.getStatus()).toBe('Validated');
      // InProgress: any sub in progress, pending, or validated
      const subInProgress = {
        getStatus: () => 'InProgress',
        name: 'InProgressSub',
        competencyId: 'comp-1',
        id: 'sub-inprogress',
        studentProgress: [
          {
            id: 'sp-inprogress',
            studentId: 'student-1',
            subCompetencyId: 'sub-inprogress',
            status: 'InProgress',
            percent: 50,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const subPending = {
        getStatus: () => 'PendingValidation',
        name: 'PendingSub',
        competencyId: 'comp-1',
        id: 'sub-pending',
        studentProgress: [
          {
            id: 'sp-pending',
            studentId: 'student-1',
            subCompetencyId: 'sub-pending',
            status: 'PendingValidation',
            percent: 0,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const compInProgress = new Competency({
        ...competencyInit,
        subCompetencies: [subLocked, subInProgress],
      });
      expect(compInProgress.getStatus()).toBe('InProgress');
      const compPending = new Competency({
        ...competencyInit,
        subCompetencies: [subLocked, subPending],
      });
      expect(compPending.getStatus()).toBe('InProgress');
      // NotStarted: none of the above
      const subNotStarted = {
        getStatus: () => 'NotStarted',
        name: 'NotStartedSub',
        competencyId: 'comp-1',
        id: 'sub-notstarted',
        studentProgress: [
          {
            id: 'sp-notstarted',
            studentId: 'student-1',
            subCompetencyId: 'sub-notstarted',
            status: 'NotStarted',
            percent: 0,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const compNotStarted = new Competency({
        ...competencyInit,
        subCompetencies: [subNotStarted],
      });
      expect(compNotStarted.getStatus()).toBe('NotStarted');
      // Locked if no subCompetencies
      const compNone = new Competency({ ...competencyInit, subCompetencies: [] });
      expect(compNone.getStatus()).toBe('Locked');
    });

    it('getProgress returns correct percent', () => {
      const subValidated = {
        getStatus: () => 'Validated',
        name: 'ValidatedSub',
        competencyId: 'comp-1',
        id: 'sub-validated',
        studentProgress: [
          {
            id: 'sp-validated',
            studentId: 'student-1',
            subCompetencyId: 'sub-validated',
            status: 'Validated',
            percent: 100,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const subLocked = {
        getStatus: () => 'Locked',
        name: 'LockedSub',
        competencyId: 'comp-1',
        id: 'sub-locked',
        studentProgress: [
          {
            id: 'sp-locked',
            studentId: 'student-1',
            subCompetencyId: 'sub-locked',
            status: 'Locked',
            percent: 0,
            updatedAt: null,
          },
        ],
      } as unknown as SubCompetency;
      const compNone = new Competency({ ...competencyInit, subCompetencies: [] });
      expect(compNone.getProgress()).toBe(0);
      const compPartial = new Competency({
        ...competencyInit,
        subCompetencies: [subValidated, subLocked],
      });
      expect(compPartial.getProgress()).toBe(50);
      const compFull = new Competency({
        ...competencyInit,
        subCompetencies: [subValidated, subValidated],
      });
      expect(compFull.getProgress()).toBe(100);
    });
  });

  describe('SubCompetency', () => {
    it('creates a sub-competency with nested resources', () => {
      const stage = new SubCompetency(subCompetencyInit);

      expect(stage.resources).toHaveLength(1);
      expect(stage.resources[0]?.name).toBe('Intro video');
      expect(stage.level).toBe(1);
    });

    it('throws when name is empty', () => {
      expect(
        () =>
          new SubCompetency({
            ...subCompetencyInit,
            name: '',
          }),
      ).toThrow('Sub-competency name is required');
    });
  });

  describe('Competency', () => {
    it('creates a competency with nested hierarchy', () => {
      const competency = new Competency(competencyInit);

      expect(competency.domainId).toBe('domain-1');
      expect(competency.subCompetencies).toHaveLength(1);
      expect(competency.subCompetencies[0]?.resources[0]?.name).toBe('Intro video');
    });

    it('throws when name is empty', () => {
      expect(
        () =>
          new Competency({
            ...competencyInit,
            name: '',
          }),
      ).toThrow('Competency name is required');
    });

    it('throws when domainId is missing', () => {
      expect(
        () =>
          new Competency({
            ...competencyInit,
            domainId: '',
          }),
      ).toThrow('Competency domainId is required');
    });

    it('clones including nested structures', () => {
      const competency = new Competency(competencyInit);
      const clone = competency.clone();

      expect(clone).not.toBe(competency);
      expect(clone.subCompetencies[0]).not.toBe(competency.subCompetencies[0]);
      expect(clone.toJSON()).toEqual(competency.toJSON());
    });
  });
});
