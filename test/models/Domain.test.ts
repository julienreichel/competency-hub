import { describe, expect, it } from 'vitest';
import { Competency } from '../../src/models/Competency';
import { Domain } from '../../src/models/Domain';

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
            order: 1,
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
});
