import type { EvaluationStatus } from 'src/models/EvaluationAttempt';
import type {
  ProgressStatus,
  StudentSubCompetencyProgress,
} from 'src/models/StudentSubCompetencyProgress';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';

export type EvaluationStatusKey = EvaluationStatus;
export type StudentProgressStatusKey = ProgressStatus | 'Locked';

export interface EvaluationStatusSummary {
  id: string;
  name: string;
  status: EvaluationStatusKey;
  statusIcon: string;
  statusColor: string;
}

export interface StudentProgressRow {
  id: string;
  student: User;
  progress: StudentSubCompetencyProgress;
  subCompetency: SubCompetency;
  domainName: string;
  domainValue: string | null;
  competencyName: string;
  subCompetencyName: string;
  evaluationsStatusSummaries: EvaluationStatusSummary[];
}

export type StudentProgressTableVariant = 'manager' | 'pending-validation';
