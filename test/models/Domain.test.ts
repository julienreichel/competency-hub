import { describe, expect, it } from 'vitest';
import { Competency } from '../../src/models/Competency';
import { Domain, type AmplifyDomain } from '../../src/models/Domain';

describe('Domain model', () => {
  const domainInit = {
    id: 'domain-1',
    name: 'Mathematics',
    colorCode: '#FF0000',
    competencies: [
      {
        id: 'comp-1',
        domainId: 'domain-1',
        name: 'Algebra Basics',
        description: 'Linear equations and inequalities',
        objectives: 'Solve single-variable equations',
        subCompetencies: [
          {
            id: 'sub-1',
            competencyId: 'comp-1',
            name: 'Linear equations',
            level: 1,
            resources: [
              {
                id: 'res-1',
                subCompetencyId: 'sub-1',
                type: 'Link',
                name: 'Tutorial',
                url: 'https://example.com/tutorial',
              },
            ],
          },
        ],
      },
    ],
  };

  it('creates a domain with nested competencies', () => {
    const domain = new Domain(domainInit);

    expect(domain.name).toBe('Mathematics');
    expect(domain.colorCode).toBe('#FF0000');
    expect(domain.competencies).toHaveLength(1);
    expect(domain.competencies[0]).toBeInstanceOf(Competency);
  });

  it('throws when name is empty', () => {
    expect(
      () =>
        new Domain({
          ...domainInit,
          name: '',
        }),
    ).toThrow('Domain name is required');
  });

  it('clones including nested competencies', () => {
    const domain = new Domain(domainInit);
    const clone = domain.clone();

    expect(clone).not.toBe(domain);
    expect(clone.competencies[0]).not.toBe(domain.competencies[0]);
    expect(clone.toJSON()).toEqual(domain.toJSON());
  });

  it('creates fromAmplify with all fields', () => {
    const amplify = {
      id: 'domain-amp',
      name: 'Science',
      colorCode: '#00FF00',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      competencies: [
        {
          id: 'comp-amp',
          domainId: 'domain-amp',
          name: 'Physics',
        },
      ],
    };
    const domain = Domain.fromAmplify(amplify as unknown as AmplifyDomain);
    expect(domain.id).toBe('domain-amp');
    expect(domain.name).toBe('Science');
    expect(domain.colorCode).toBe('#00FF00');
    expect(domain.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(domain.updatedAt).toBe('2024-01-02T00:00:00Z');
    expect(domain.competencies[0] && domain.competencies[0].name).toBe('Physics');
  });

  it('fromAmplify handles missing optional fields', () => {
    const amplify = { id: 'd2', name: 'NoColor', competencies: [] };
    const domain = Domain.fromAmplify(amplify as unknown as AmplifyDomain);
    expect(domain.colorCode).toBeNull();
    expect(domain.createdAt).toBeUndefined();
    expect(domain.updatedAt).toBeUndefined();
    expect(domain.competencies).toEqual([]);
  });

  it('toJSON outputs all fields and correct competencyCount', () => {
    const domain = new Domain({ ...domainInit, competencyCount: 42 });
    const json = domain.toJSON();
    expect(json.id).toBe(domainInit.id);
    expect(json.name).toBe(domainInit.name);
    expect(json.colorCode).toBe(domainInit.colorCode);
    expect(json.competencyCount).toBe(42);
    expect(Array.isArray(json.competencies)).toBe(true);
  });

  it('toJSON falls back to competencies.length if competencyCount is null', () => {
    const domain = new Domain({ ...domainInit, competencyCount: null });
    const json = domain.toJSON();
    expect(json.competencyCount).toBe(domain.competencies.length);
  });

  it('competencyCount logic: explicit, null, fallback', () => {
    const d1 = new Domain({ ...domainInit, competencyCount: 5 });
    expect(d1.competencyCount).toBe(5);
    const d2 = new Domain({ ...domainInit, competencyCount: null });
    expect(d2.competencyCount).toBeNull();
    const d3 = new Domain({ ...domainInit });
    expect(d3.competencyCount).toBe(d3.competencies.length);
  });
});
