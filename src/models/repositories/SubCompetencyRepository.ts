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

  async findById(id: string): Promise<SubCompetency | null> {
    const competency = await graphQLClient.getSubCompetency(id);
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
    const raw = await graphQLClient.deleteSubCompetency(id);
    if (!raw) {
      throw new Error(`Failed to delete sub-competency ${id}`);
    }
    return SubCompetency.fromAmplify(raw);
  }
}

export const subCompetencyRepository = new SubCompetencyRepository();
