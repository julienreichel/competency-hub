import { graphQLClient } from '../base/GraphQLClient';
import { Evaluation, type EvaluationFormat, type EvaluationMode } from '../Evaluation';

export interface CreateEvaluationInput {
  id?: string;
  subCompetencyId: string;
  name: string;
  description?: string | null;
  mode: EvaluationMode;
  format: EvaluationFormat;
  durationMin?: number | null;
  url?: string | null;
  fileKey?: string | null;
}

export type UpdateEvaluationInput = Partial<CreateEvaluationInput>;

export class EvaluationRepository {
  async create(data: CreateEvaluationInput): Promise<Evaluation> {
    const raw = await graphQLClient.createEvaluation(data);
    if (!raw) {
      throw new Error('Failed to create evaluation');
    }
    return Evaluation.fromAmplify(raw);
  }

  async findById(id: string): Promise<Evaluation | null> {
    const raw = await graphQLClient.getEvaluation(id);
    return raw ? Evaluation.fromAmplify(raw) : null;
  }

  async update(id: string, data: UpdateEvaluationInput): Promise<Evaluation> {
    const raw = await graphQLClient.updateEvaluation({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update evaluation ${id}`);
    }
    return Evaluation.fromAmplify(raw);
  }

  async delete(id: string): Promise<Evaluation> {
    const raw = await graphQLClient.deleteEvaluation(id);
    if (!raw) {
      throw new Error(`Failed to delete evaluation ${id}`);
    }
    return Evaluation.fromAmplify(raw);
  }
}

export const evaluationRepository = new EvaluationRepository();
