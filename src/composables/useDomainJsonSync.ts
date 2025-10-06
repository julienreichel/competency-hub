import type {
  Competency,
  CreateCompetencyInput,
  UpdateCompetencyInput,
} from 'src/models/Competency';
import type { CompetencyResource, CreateResourceInput } from 'src/models/CompetencyResource';
import { ResourceType } from 'src/models/CompetencyResource';
import type { Domain } from 'src/models/Domain';
import type { Evaluation } from 'src/models/Evaluation';
import { EvaluationFormat, EvaluationMode } from 'src/models/Evaluation';
import { competencyRepository } from 'src/models/repositories/CompetencyRepository';
import { domainRepository } from 'src/models/repositories/DomainRepository';
import {
  evaluationRepository,
  type CreateEvaluationInput,
} from 'src/models/repositories/EvaluationRepository';
import { resourceRepository } from 'src/models/repositories/ResourceRepository';
import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type {
  CreateSubCompetencyInput,
  SubCompetency,
  UpdateSubCompetencyInput,
} from 'src/models/SubCompetency';
import { ref, type Ref } from 'vue';

export interface DomainJsonResource {
  id?: string;
  type: string;
  name: string;
  description?: string | null;
  url?: string | null;
  fileKey?: string | null;
  personUserId?: string | null;
}

export interface DomainJsonEvaluation {
  id?: string;
  name: string;
  description?: string | null;
  mode: string;
  format: string;
  durationMin?: number | null;
  url?: string | null;
  fileKey?: string | null;
}

export interface DomainJsonSubCompetency {
  id?: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  level?: number | null;
  resources?: DomainJsonResource[];
  evaluations?: DomainJsonEvaluation[];
}

export interface DomainJsonCompetency {
  id?: string;
  name: string;
  description?: string | null;
  objectives?: string | null;
  subCompetencies?: DomainJsonSubCompetency[];
}

export interface DomainJsonPayload {
  domain: {
    id?: string;
    name: string;
    colorCode?: string | null;
  };
  competencies: DomainJsonCompetency[];
}

export interface ImportSummary {
  domainUpdated: boolean;
  competencies: { created: number; updated: number };
  subCompetencies: { created: number; updated: number };
  resources: { created: number; updated: number };
  evaluations: { created: number; updated: number };
}

export interface ImportContext {
  currentDomain: Domain;
  existingCompetencies: Competency[];
}

export interface UseDomainJsonSyncResult {
  importLoading: Ref<boolean>;
  exportDomainToJson: (domain: Domain) => string;
  importDomainFromJson: (
    payload: DomainJsonPayload,
    context: ImportContext,
  ) => Promise<ImportSummary>;
}

const JSON_INDENT_SPACES = 2;

const normaliseResourceType = (type: string): ResourceType => {
  const normalised = type as ResourceType;
  if (Object.values(ResourceType).includes(normalised)) {
    return normalised;
  }
  throw new Error(`Invalid resource type: ${type}`);
};

const normaliseEvaluationMode = (mode: string): EvaluationMode => {
  const normalised = mode as EvaluationMode;
  if (Object.values(EvaluationMode).includes(normalised)) {
    return normalised;
  }
  throw new Error(`Invalid evaluation mode: ${mode}`);
};

const normaliseEvaluationFormat = (format: string): EvaluationFormat => {
  const normalised = format as EvaluationFormat;
  if (Object.values(EvaluationFormat).includes(normalised)) {
    return normalised;
  }
  throw new Error(`Invalid evaluation format: ${format}`);
};

const serializeResource = (resource: CompetencyResource): DomainJsonResource => ({
  id: resource.id,
  type: resource.type,
  name: resource.name,
  description: resource.description ?? null,
  url: resource.url ?? null,
  fileKey: resource.fileKey ?? null,
  personUserId: resource.personUserId ?? null,
});

const serializeEvaluation = (evaluation: Evaluation): DomainJsonEvaluation => ({
  id: evaluation.id,
  name: evaluation.name,
  description: evaluation.description ?? null,
  mode: evaluation.mode,
  format: evaluation.format,
  durationMin: evaluation.durationMin ?? null,
  url: evaluation.url ?? null,
  fileKey: evaluation.fileKey ?? null,
});

const serializeSubCompetency = (sub: SubCompetency): DomainJsonSubCompetency => ({
  id: sub.id,
  name: sub.name,
  description: sub.description ?? null,
  objectives: sub.objectives ?? null,
  level: typeof sub.level === 'number' ? sub.level : null,
  resources: (sub.resources ?? []).map(serializeResource),
  evaluations: (sub.evaluations ?? []).map(serializeEvaluation),
});

const serializeCompetency = (competency: Competency): DomainJsonCompetency => ({
  id: competency.id,
  name: competency.name,
  description: competency.description ?? null,
  objectives: competency.objectives ?? null,
  subCompetencies: (competency.subCompetencies ?? []).map(serializeSubCompetency),
});

const defaultSummary = (): ImportSummary => ({
  domainUpdated: false,
  competencies: { created: 0, updated: 0 },
  subCompetencies: { created: 0, updated: 0 },
  resources: { created: 0, updated: 0 },
  evaluations: { created: 0, updated: 0 },
});

const assertValidPayload = (payload: DomainJsonPayload): void => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid import file: expected an object.');
  }
  const domain = payload.domain;
  const competencies = payload.competencies;
  if (!domain || typeof domain !== 'object') {
    throw new Error('Invalid import file: missing domain definition.');
  }
  if (!('name' in domain) || typeof domain.name !== 'string') {
    throw new Error('Invalid import file: domain.name must be a string.');
  }
  if (!Array.isArray(competencies)) {
    throw new Error('Invalid import file: competencies must be an array.');
  }
};

export const parseDomainJson = (raw: string): DomainJsonPayload => {
  let parsed: DomainJsonPayload;
  try {
    parsed = JSON.parse(raw) as DomainJsonPayload;
  } catch {
    throw new Error('Unable to parse JSON file.');
  }
  assertValidPayload(parsed);
  return parsed;
};

export const buildDomainExportPayload = (domain: Domain): DomainJsonPayload => ({
  domain: {
    id: domain.id,
    name: domain.name,
    colorCode: domain.colorCode ?? null,
  },
  competencies: (domain.competencies ?? []).map((competency) => serializeCompetency(competency)),
});

type CompetencyMap = Map<string, Competency>;
type SubCompetencyMap = Map<string, SubCompetency>;
type SubCompetencyMapStore = Map<string, SubCompetencyMap>;

const createCompetencyMap = (competencies: Competency[]): CompetencyMap =>
  new Map(competencies.map((competency) => [competency.id, competency]));

const createSubCompetencyMaps = (competencies: Competency[]): SubCompetencyMapStore => {
  const store: SubCompetencyMapStore = new Map();
  competencies.forEach((competency) => {
    store.set(
      competency.id,
      new Map((competency.subCompetencies ?? []).map((sub) => [sub.id, sub])),
    );
  });
  return store;
};

const ensureSubCompetencyMap = (
  store: SubCompetencyMapStore,
  competencyId: string,
): SubCompetencyMap => {
  if (!store.has(competencyId)) {
    store.set(competencyId, new Map());
  }
  return store.get(competencyId) as SubCompetencyMap;
};

const toOptionalLevel = (value: number | null | undefined): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  return undefined;
};

const prepareCompetencyUpdate = (payload: DomainJsonCompetency): UpdateCompetencyInput => ({
  name: payload.name,
  description: payload.description ?? null,
  objectives: payload.objectives ?? null,
});

const prepareSubCompetencyUpdate = (payload: DomainJsonSubCompetency): UpdateSubCompetencyInput => {
  const optionalLevel = toOptionalLevel(payload.level);
  const update: UpdateSubCompetencyInput = {
    name: payload.name,
    description: payload.description ?? null,
    objectives: payload.objectives ?? null,
  };
  if (optionalLevel !== undefined) {
    update.level = optionalLevel;
  }
  return update;
};

const prepareResourceData = (subId: string, payload: DomainJsonResource): CreateResourceInput => ({
  subCompetencyId: subId,
  type: normaliseResourceType(payload.type),
  name: payload.name,
  description: payload.description ?? null,
  url: payload.url ?? null,
  fileKey: payload.fileKey ?? null,
  personUserId: payload.personUserId ?? null,
});

const prepareEvaluationData = (
  subId: string,
  payload: DomainJsonEvaluation,
): CreateEvaluationInput => ({
  subCompetencyId: subId,
  name: payload.name,
  description: payload.description ?? null,
  mode: normaliseEvaluationMode(payload.mode),
  format: normaliseEvaluationFormat(payload.format),
  durationMin: typeof payload.durationMin === 'number' ? payload.durationMin : null,
  url: payload.url ?? null,
  fileKey: payload.fileKey ?? null,
});

const updateDomainDetails = async (
  payloadDomain: DomainJsonPayload['domain'],
  currentDomain: Domain,
  summary: ImportSummary,
): Promise<void> => {
  const updates: Record<string, unknown> = {};
  if (payloadDomain.name && payloadDomain.name !== currentDomain.name) {
    updates.name = payloadDomain.name;
  }
  if (
    payloadDomain.colorCode !== undefined &&
    payloadDomain.colorCode !== currentDomain.colorCode
  ) {
    updates.colorCode = payloadDomain.colorCode ?? null;
  }
  if (!Object.keys(updates).length) {
    return;
  }
  await domainRepository.update(currentDomain.id, updates);
  summary.domainUpdated = true;
};

const processResources = async (
  resources: DomainJsonResource[],
  sub: SubCompetency,
  summary: ImportSummary,
): Promise<void> => {
  if (!resources.length) {
    return;
  }
  const resourceMap = new Map(
    (sub.resources ?? []).map((resource) => [resource.id, resource] as const),
  );
  for (const resourcePayload of resources) {
    if (!resourcePayload?.name || !resourcePayload.type) {
      continue;
    }
    const preparedData = prepareResourceData(sub.id, resourcePayload);
    const existing = resourcePayload.id ? resourceMap.get(resourcePayload.id) : undefined;
    if (existing) {
      const updated = await resourceRepository.update(existing.id, preparedData);
      resourceMap.set(updated.id, updated);
      summary.resources.updated += 1;
      continue;
    }
    const createData: CreateResourceInput = {
      ...preparedData,
    };
    const created = await resourceRepository.create(createData);
    resourceMap.set(created.id, created);
    summary.resources.created += 1;
  }
};

const processEvaluations = async (
  evaluations: DomainJsonEvaluation[],
  sub: SubCompetency,
  summary: ImportSummary,
): Promise<void> => {
  if (!evaluations.length) {
    return;
  }
  const evaluationMap = new Map(
    (sub.evaluations ?? []).map((evaluation) => [evaluation.id, evaluation] as const),
  );
  for (const evaluationPayload of evaluations) {
    if (!evaluationPayload?.name || !evaluationPayload.mode || !evaluationPayload.format) {
      continue;
    }
    const preparedData = prepareEvaluationData(sub.id, evaluationPayload);
    const existing = evaluationPayload.id ? evaluationMap.get(evaluationPayload.id) : undefined;
    if (existing) {
      const updated = await evaluationRepository.update(existing.id, preparedData);
      evaluationMap.set(updated.id, updated);
      summary.evaluations.updated += 1;
      continue;
    }
    const createData: CreateEvaluationInput = {
      ...preparedData,
    };
    const created = await evaluationRepository.create(createData);
    evaluationMap.set(created.id, created);
    summary.evaluations.created += 1;
  }
};

const processSubCompetency = async (
  subPayload: DomainJsonSubCompetency,
  competencyId: string,
  subMap: SubCompetencyMap,
  summary: ImportSummary,
): Promise<void> => {
  if (!subPayload?.name) {
    return;
  }
  const existing = subPayload.id ? subMap.get(subPayload.id) : undefined;

  if (existing) {
    const updated = await subCompetencyRepository.update(
      existing.id,
      prepareSubCompetencyUpdate(subPayload),
    );
    subMap.set(updated.id, updated);
    summary.subCompetencies.updated += 1;
    await processResources(subPayload.resources ?? [], existing, summary);
    await processEvaluations(subPayload.evaluations ?? [], existing, summary);
    return;
  }

  const optionalLevel = toOptionalLevel(subPayload.level);
  const createInput: CreateSubCompetencyInput = {
    competencyId,
    name: subPayload.name,
    description: subPayload.description ?? null,
    objectives: subPayload.objectives ?? null,
    ...(optionalLevel !== undefined ? { level: optionalLevel } : {}),
  };
  const created = await subCompetencyRepository.create(createInput);
  subMap.set(created.id, created);
  summary.subCompetencies.created += 1;
  await processResources(subPayload.resources ?? [], created, summary);
  await processEvaluations(subPayload.evaluations ?? [], created, summary);
};

const processSubCompetencies = async (
  subPayloads: DomainJsonSubCompetency[] | undefined,
  competencyId: string,
  subMap: SubCompetencyMap,
  summary: ImportSummary,
): Promise<void> => {
  if (!subPayloads?.length) {
    return;
  }
  for (const subPayload of subPayloads) {
    await processSubCompetency(subPayload, competencyId, subMap, summary);
  }
};

interface CompetencyProcessingContext {
  domainId: string;
  competencyMap: CompetencyMap;
  subStore: SubCompetencyMapStore;
  summary: ImportSummary;
}

const processCompetency = async (
  competencyPayload: DomainJsonCompetency,
  context: CompetencyProcessingContext,
): Promise<void> => {
  if (!competencyPayload?.name) {
    return;
  }
  const { domainId, competencyMap, subStore, summary } = context;
  const existing = competencyPayload.id ? competencyMap.get(competencyPayload.id) : undefined;
  const updateData = prepareCompetencyUpdate(competencyPayload);

  if (existing) {
    await competencyRepository.update(existing.id, updateData);
    summary.competencies.updated += 1;
    const subMap = ensureSubCompetencyMap(subStore, existing.id);
    await processSubCompetencies(competencyPayload.subCompetencies, existing.id, subMap, summary);
    return;
  }

  const createInput: CreateCompetencyInput = {
    domainId,
    name: competencyPayload.name,
    description: competencyPayload.description ?? null,
    objectives: competencyPayload.objectives ?? null,
  };
  const created = await competencyRepository.create(createInput);
  summary.competencies.created += 1;
  competencyMap.set(created.id, created);
  const subMap = ensureSubCompetencyMap(subStore, created.id);
  await processSubCompetencies(competencyPayload.subCompetencies, created.id, subMap, summary);
};

const processCompetencies = async (
  competencyPayloads: DomainJsonCompetency[],
  context: CompetencyProcessingContext,
): Promise<void> => {
  for (const competencyPayload of competencyPayloads) {
    await processCompetency(competencyPayload, context);
  }
};

const importDomainHierarchy = async (
  payload: DomainJsonPayload,
  context: ImportContext,
): Promise<ImportSummary> => {
  const summary = defaultSummary();
  await updateDomainDetails(payload.domain, context.currentDomain, summary);
  const competencyMap = createCompetencyMap(context.existingCompetencies);
  const subStore = createSubCompetencyMaps(context.existingCompetencies);
  await processCompetencies(payload.competencies, {
    domainId: context.currentDomain.id,
    competencyMap,
    subStore,
    summary,
  });
  return summary;
};

export function useDomainJsonSync(): UseDomainJsonSyncResult {
  const importLoading = ref(false);

  const exportDomainToJson = (domain: Domain): string => {
    const payload = buildDomainExportPayload(domain);
    return JSON.stringify(payload, null, JSON_INDENT_SPACES);
  };

  const importDomainFromJson = async (
    payload: DomainJsonPayload,
    context: ImportContext,
  ): Promise<ImportSummary> => {
    importLoading.value = true;
    try {
      return await importDomainHierarchy(payload, context);
    } finally {
      importLoading.value = false;
    }
  };

  return {
    importLoading,
    exportDomainToJson,
    importDomainFromJson,
  };
}
