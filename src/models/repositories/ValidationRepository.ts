import { graphQLClient } from '../base/GraphQLClient';
import {
  ValidationRequest,
  type ValidationRequestInit,
  type ValidationRequestUpdate,
} from '../ValidationRequest';

export class ValidationRepository {
  static async createRequest({
    studentId,
    subCompetencyId,
    studentNote,
  }: ValidationRequestInit): Promise<ValidationRequest> {
    const raw = await graphQLClient.createValidationRequest({
      studentId,
      subCompetencyId,
      status: 'Pending',
      studentNote: studentNote ?? null,
    });
    if (!raw) {
      throw new Error('Failed to create validation');
    }
    return ValidationRequest.fromAmplify(raw);
  }

  static async decide({
    id,
    status,
    educatorId,
    educatorNote,
  }: ValidationRequestUpdate): Promise<ValidationRequest> {
    if (!id) {
      throw new Error('Missing id to update validation');
    }
    if (!educatorId) {
      throw new Error('Missing educatorId to update validation');
    }
    const raw = await graphQLClient.updateValidationRequest({
      id,
      status: status || 'Approved',
      educatorId,
      educatorNote: !educatorNote ? null : educatorNote,
    });
    if (!raw) {
      throw new Error(`Failed to update validation ${id}`);
    }
    return ValidationRequest.fromAmplify(raw);
  }
}
