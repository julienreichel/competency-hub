import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import {
  SubCompetency,
  type CreateSubCompetencyInput,
  type UpdateSubCompetencyInput,
} from '../SubCompetency';

interface SubCompetencyFilter extends Record<string, unknown> {
  competencyId?: { eq: string };
}

export class SubCompetencyRepository
  implements
    Repository<
      SubCompetency,
      CreateSubCompetencyInput,
      UpdateSubCompetencyInput,
      SubCompetencyFilter
    >
{
  async create(data: CreateSubCompetencyInput): Promise<SubCompetency> {
    const raw = await graphQLClient.createSubCompetency(data);
    if (!raw) {
      throw new Error('Failed to create sub-competency');
    }
    return SubCompetency.fromAmplify(raw);
  }

  async findById(id: string, withDetails: boolean = false): Promise<SubCompetency | null> {
    const competency = withDetails
      ? await graphQLClient.getSubCompetencyWithDetails(id)
      : await graphQLClient.getSubCompetency(id);
    if (!competency) {
      return null;
    }
    return SubCompetency.fromAmplify(competency);
  }

  async findAll(filter?: SubCompetencyFilter): Promise<SubCompetency[]> {
    const result = await graphQLClient.listSubCompetencies(filter ?? undefined);
    return result
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null && entry !== undefined)
      .map((entry) => SubCompetency.fromAmplify(entry));
  }

  async update(id: string, data: UpdateSubCompetencyInput): Promise<SubCompetency> {
    const raw = await graphQLClient.updateSubCompetency({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update sub-competency ${id}`);
    }
    return SubCompetency.fromAmplify(raw);
  }

  async delete(id: string): Promise<SubCompetency> {
    const subDetails = await graphQLClient.getSubCompetencyWithDetails(id);

    if (Array.isArray(subDetails?.resources) && subDetails?.resources?.length) {
      await Promise.all(
        subDetails.resources
          .filter((resource): resource is { id: string } & Record<string, unknown> =>
            Boolean(resource && typeof resource === 'object' && 'id' in resource),
          )
          .map(async (resource) => {
            try {
              await graphQLClient.deleteResource(resource.id);
            } catch (error) {
              console.error(
                `Failed to delete resource ${resource.id} for sub-competency ${id}`,
                error,
              );
            }
          }),
      );
    }

    const raw = await graphQLClient.deleteSubCompetency(id);
    if (!raw) {
      throw new Error(`Failed to delete sub-competency ${id}`);
    }
    return SubCompetency.fromAmplify(raw);
  }
}

export const subCompetencyRepository = new SubCompetencyRepository();
