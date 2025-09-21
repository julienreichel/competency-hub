import { describe, expect, it } from 'vitest';
import {
  Competency,
  CompetencyResource,
  ResourceType,
  SubCompetency,
} from '../../src/models/Competency';

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
