import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import { Competency, type CreateCompetencyInput, type UpdateCompetencyInput } from '../Competency';

interface CompetencyFilter extends Record<string, unknown> {
  domainId?: { eq: string };
  name?: { contains: string };
}

export class CompetencyRepository
  implements Repository<Competency, CreateCompetencyInput, UpdateCompetencyInput, CompetencyFilter>
{
  async create(data: CreateCompetencyInput): Promise<Competency> {
    const raw = await graphQLClient.createCompetency(data);
    if (!raw) {
      throw new Error('Failed to create competency');
    }
    return Competency.fromAmplify(raw);
  }

  async findById(id: string, includeHierarchy = false): Promise<Competency | null> {
    const raw = includeHierarchy
      ? await graphQLClient.getCompetencyWithDetails(id)
      : await graphQLClient.getCompetency(id);
    if (!raw) {
      return null;
    }
    return Competency.fromAmplify(raw);
  }

  async findAll(filter?: CompetencyFilter): Promise<Competency[]> {
    const rawCompetencies = await graphQLClient.listCompetencies(filter ?? undefined);
    return rawCompetencies
      .filter(
        (competency): competency is NonNullable<typeof competency> =>
          competency !== null && competency !== undefined,
      )
      .map((competency) => Competency.fromAmplify(competency));
  }

  async update(id: string, data: UpdateCompetencyInput): Promise<Competency> {
    const raw = await graphQLClient.updateCompetency({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update competency ${id}`);
    }
    return Competency.fromAmplify(raw);
  }

  async delete(id: string): Promise<Competency> {
    const competencyDetails = await graphQLClient.getCompetencyWithDetails(id);

    if (
      Array.isArray(competencyDetails?.subCompetencies) &&
      competencyDetails?.subCompetencies?.length
    ) {
      await Promise.all(
        competencyDetails.subCompetencies
          .filter((sub): sub is { id: string } & Record<string, unknown> =>
            Boolean(sub && typeof sub === 'object' && 'id' in sub),
          )
          .map(async (sub) => {
            try {
              await graphQLClient.deleteSubCompetency(sub.id);
            } catch (error) {
              console.error(
                `Failed to delete sub-competency ${sub.id} for competency ${id}`,
                error,
              );
            }
          }),
      );
    }

    const raw = await graphQLClient.deleteCompetency(id);
    if (!raw) {
      throw new Error(`Failed to delete competency ${id}`);
    }
    return Competency.fromAmplify(raw);
  }

  async findByDomain(domainId: string): Promise<Competency[]> {
    return this.findAll({ domainId: { eq: domainId } });
  }

  async searchByName(domainId: string, search: string): Promise<Competency[]> {
    return this.findAll({
      domainId: { eq: domainId },
      name: { contains: search },
    });
  }
}

export const competencyRepository = new CompetencyRepository();
