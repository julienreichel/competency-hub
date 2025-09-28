import { graphQLClient } from '../base/GraphQLClient';
import { EvaluationAttempt } from '../EvaluationAttempt';

export interface CreateEvaluationAttemptInput {
  studentId: string;
  evaluationId: string;
  status?: 'NotStarted' | 'InProgress' | 'Completed';
  completionMode?: 'Auto' | 'Manual';
  startedAt?: string | null;
  completedAt?: string | null;
}

export type UpdateEvaluationAttemptInput = Partial<CreateEvaluationAttemptInput>;

export class EvaluationAttemptRepository {
  async create(data: CreateEvaluationAttemptInput): Promise<EvaluationAttempt> {
    const raw = await graphQLClient.createEvaluationAttempt(data);
    if (!raw) {
      throw new Error('Failed to create evaluation attempt');
    }
    return EvaluationAttempt.fromAmplify(raw);
  }

  async update(id: string, data: UpdateEvaluationAttemptInput): Promise<EvaluationAttempt> {
    const raw = await graphQLClient.updateEvaluationAttempt({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update evaluation attempt ${id}`);
    }
    return EvaluationAttempt.fromAmplify(raw);
  }
}

export const evaluationAttemptRepository = new EvaluationAttemptRepository();
