import { subCompetencyRepository } from 'src/models/repositories/SubCompetencyRepository';
import type { StudentSubCompetencyProgress } from 'src/models/StudentSubCompetencyProgress';
import type { SubCompetency } from 'src/models/SubCompetency';
import type { User } from 'src/models/User';
import { ref, type Ref } from 'vue';
import { useUsers } from './useUsers';

interface ReportPeriod {
  startDate: Date;
  endDate: Date;
}

interface ReportFilters {
  domainFilter?: string | null;
  includeDetails: boolean;
}

interface ProgressHistoryEntry {
  status: string;
  percentage: number;
  updatedAt: string;
  evidenceDate?: string | null;
}

interface SubCompetencyProgress {
  subCompetency: SubCompetency;
  currentStatus: string;
  currentPercentage: number;
  progressDelta: number;
  lastEvidenceDate?: Date | null;
  newlyAcquired: boolean;
  hasActivity: boolean;
}

interface CompetencyProgress {
  competencyId: string;
  competencyName: string;
  subCompetencies: SubCompetencyProgress[];
  progressDelta: number;
  completionPercentage: number;
}

interface DomainProgress {
  domainId: string;
  domainName: string;
  domainColor?: string | null;
  competencies: CompetencyProgress[];
  overallProgress: number;
  progressDelta: number;
  itemsChanged: number;
}

interface ReportSummary {
  totalDomainsCovered: number;
  competenciesAdvanced: number;
  competenciesAcquired: number;
  totalActivity: number;
  periodStartDate: Date;
  periodEndDate: Date;
}

interface ReportData {
  student: User;
  period: ReportPeriod;
  summary: ReportSummary;
  domains: DomainProgress[];
  generatedAt: Date;
  generatedBy: User | null;
}

const NEWLY_ACQUIRED_STATUSES = ['Validated'];
const PROGRESS_THRESHOLD = 5; // 5% minimum change to count as "advanced"

// Helper functions for progress calculations
function createMockProgressHistory(progress: StudentSubCompetencyProgress): ProgressHistoryEntry[] {
  // For now, create a simple history based on current state
  // In a real implementation, this would come from a proper history table
  return [
    {
      status: progress.status,
      percentage: progress.percent,
      updatedAt: progress.updatedAt || new Date().toISOString(),
      evidenceDate: progress.updatedAt,
    },
  ];
}

function calculateProgressDelta(
  subCompetency: SubCompetency,
  period: ReportPeriod,
): { delta: number; newlyAcquired: boolean; hasActivity: boolean } {
  const progress = subCompetency.studentProgress?.[0];
  if (!progress) {
    return { delta: 0, newlyAcquired: false, hasActivity: false };
  }

  // Create mock history for now - in real implementation, fetch from progress history table
  const progressHistory = createMockProgressHistory(progress);

  // Find progress at period start and end
  const historyInPeriod = progressHistory.filter((entry: ProgressHistoryEntry) => {
    const entryDate = new Date(entry.updatedAt);
    return entryDate >= period.startDate && entryDate <= period.endDate;
  });

  const hasActivity = historyInPeriod.length > 0;

  // Get baseline (last entry before period start)
  const baselineEntry = progressHistory
    .filter((entry: ProgressHistoryEntry) => new Date(entry.updatedAt) < period.startDate)
    .sort(
      (a: ProgressHistoryEntry, b: ProgressHistoryEntry) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

  // Get end state (current or last in period)
  const endEntry = progressHistory
    .filter((entry: ProgressHistoryEntry) => new Date(entry.updatedAt) <= period.endDate)
    .sort(
      (a: ProgressHistoryEntry, b: ProgressHistoryEntry) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )[0];

  const baselinePercentage = baselineEntry?.percentage ?? 0;
  const endPercentage = endEntry?.percentage ?? baselinePercentage;
  const delta = endPercentage - baselinePercentage;

  // Check if newly acquired in period
  const newlyAcquired = historyInPeriod.some(
    (entry: ProgressHistoryEntry) =>
      NEWLY_ACQUIRED_STATUSES.includes(entry.status) &&
      !NEWLY_ACQUIRED_STATUSES.includes(baselineEntry?.status ?? ''),
  );

  return { delta, newlyAcquired, hasActivity };
}

function getLastEvidenceDate(subCompetency: SubCompetency): Date | null {
  const progress = subCompetency.studentProgress?.[0];
  if (!progress) {
    return null;
  }

  // Create mock history for now
  const progressHistory = createMockProgressHistory(progress);

  const lastEntry = progressHistory
    .filter((entry: ProgressHistoryEntry) => entry.evidenceDate)
    .sort(
      (a: ProgressHistoryEntry, b: ProgressHistoryEntry) =>
        new Date(b.evidenceDate || '').getTime() - new Date(a.evidenceDate || '').getTime(),
    )[0];

  return lastEntry?.evidenceDate ? new Date(lastEntry.evidenceDate) : null;
}

function groupByDomain(subCompetencies: SubCompetency[], period: ReportPeriod): DomainProgress[] {
  const domainMap = new Map<string, DomainProgress>();

  subCompetencies.forEach((sub) => {
    const domain = sub.competency?.domain;
    const competency = sub.competency;

    if (!domain || !competency) return;

    const { delta, newlyAcquired, hasActivity } = calculateProgressDelta(sub, period);
    const lastEvidenceDate = getLastEvidenceDate(sub);

    const subProgress: SubCompetencyProgress = {
      subCompetency: sub,
      currentStatus: sub.getStatus(),
      currentPercentage: sub.studentProgress?.[0]?.percent ?? 0,
      progressDelta: delta,
      lastEvidenceDate: lastEvidenceDate ?? null,
      newlyAcquired,
      hasActivity,
    };

    // Get or create domain entry
    if (!domainMap.has(domain.id)) {
      domainMap.set(domain.id, {
        domainId: domain.id,
        domainName: domain.name,
        domainColor: domain.colorCode ?? null,
        competencies: [],
        overallProgress: 0,
        progressDelta: 0,
        itemsChanged: 0,
      });
    }

    const domainProgress = domainMap.get(domain.id)!;

    // Get or create competency entry
    let competencyProgress = domainProgress.competencies.find(
      (c) => c.competencyId === competency.id,
    );

    if (!competencyProgress) {
      competencyProgress = {
        competencyId: competency.id,
        competencyName: competency.name,
        subCompetencies: [],
        progressDelta: 0,
        completionPercentage: 0,
      };
      domainProgress.competencies.push(competencyProgress);
    }

    competencyProgress.subCompetencies.push(subProgress);
  });

  // Calculate rollups
  return Array.from(domainMap.values()).map((domain) => {
    let totalProgress = 0;
    let totalDelta = 0;
    let itemsChanged = 0;

    domain.competencies.forEach((competency) => {
      let competencyProgress = 0;
      let competencyDelta = 0;

      competency.subCompetencies.forEach((sub) => {
        competencyProgress += sub.currentPercentage;
        competencyDelta += sub.progressDelta;
        if (sub.hasActivity || Math.abs(sub.progressDelta) >= PROGRESS_THRESHOLD) {
          itemsChanged++;
        }
      });

      competency.completionPercentage =
        competency.subCompetencies.length > 0
          ? competencyProgress / competency.subCompetencies.length
          : 0;
      competency.progressDelta = competencyDelta;

      totalProgress += competency.completionPercentage;
      totalDelta += competency.progressDelta;
    });

    return {
      ...domain,
      overallProgress:
        domain.competencies.length > 0 ? totalProgress / domain.competencies.length : 0,
      progressDelta: totalDelta,
      itemsChanged,
    };
  });
}

async function fetchReportData(
  studentId: string,
  period: ReportPeriod,
  filters: ReportFilters,
): Promise<ReportData> {
  const { getUserById, getCurrentUser } = useUsers();

  const [student, currentUser] = await Promise.all([getUserById(studentId), getCurrentUser()]);

  if (!student) {
    throw new Error('Student not found');
  }

  // Get all sub-competency IDs from student progress
  const progressIds = Array.from(
    new Set(
      (student.studentProgress ?? [])
        .map((progress) => progress.subCompetencyId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  if (progressIds.length === 0) {
    throw new Error('No progress data found for student');
  }

  // Fetch all sub-competencies with their hierarchies
  const subCompetencies = await Promise.all(
    progressIds.map(async (id) => {
      const sub = await subCompetencyRepository.findById(id);
      if (sub && student) {
        sub.attachUserProgress(student);
      }
      return sub;
    }),
  );

  const validSubCompetencies = subCompetencies.filter((sub): sub is SubCompetency => sub !== null);

  // Apply domain filter if specified
  const filteredSubCompetencies = filters.domainFilter
    ? validSubCompetencies.filter((sub) => sub.competency?.domain?.name === filters.domainFilter)
    : validSubCompetencies;

  // Group by domain and calculate progress
  const domains = groupByDomain(filteredSubCompetencies, period);

  // Calculate summary statistics
  const summary: ReportSummary = {
    totalDomainsCovered: domains.length,
    competenciesAdvanced: domains.reduce(
      (sum, domain) =>
        sum +
        domain.competencies.filter((c) => Math.abs(c.progressDelta) >= PROGRESS_THRESHOLD).length,
      0,
    ),
    competenciesAcquired: domains.reduce(
      (sum, domain) =>
        sum +
        domain.competencies.filter((c) => c.subCompetencies.some((sub) => sub.newlyAcquired))
          .length,
      0,
    ),
    totalActivity: domains.reduce((sum, domain) => sum + domain.itemsChanged, 0),
    periodStartDate: period.startDate,
    periodEndDate: period.endDate,
  };

  return {
    student,
    period,
    summary,
    domains,
    generatedAt: new Date(),
    generatedBy: currentUser,
  };
}

export function useReportData(): {
  loading: Ref<boolean>;
  error: Ref<string | null>;
  reportData: Ref<ReportData | null>;
  generateReport: (
    studentId: string,
    period: ReportPeriod,
    filters: ReportFilters,
  ) => Promise<ReportData | null>;
  generateDomainSummary: (
    user: User,
    period?: ReportPeriod,
  ) => Promise<{ name: string; color: string; progress: number }[]>;
} {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const reportData = ref<ReportData | null>(null);

  const generateReport = async (
    studentId: string,
    period: ReportPeriod,
    filters: ReportFilters,
  ): Promise<ReportData | null> => {
    loading.value = true;
    error.value = null;

    try {
      const report = await fetchReportData(studentId, period, filters);
      reportData.value = report;
      return report;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      error.value = message;
      console.error('Report generation error:', err);
      return null;
    } finally {
      loading.value = false;
    }
  };

  const generateDomainSummary = async (
    user: User,
    period?: ReportPeriod,
  ): Promise<{ name: string; color: string; progress: number }[]> => {
    const progress = user.studentProgress || [];

    if (progress.length === 0) {
      return [];
    }

    // Get unique sub-competency IDs
    const progressIds = Array.from(
      new Set(progress.map((p) => p.subCompetencyId).filter((id): id is string => Boolean(id))),
    );

    if (progressIds.length === 0) {
      return [];
    }

    // Fetch sub-competencies with their domain information
    const subCompetencies = await Promise.all(
      progressIds.map(async (id) => {
        const sub = await subCompetencyRepository.findById(id);
        if (!sub || !sub.competency?.domain) return null;

        // Add the student progress to the sub-competency
        const studentProgress = progress.find((p) => p.subCompetencyId === id);
        if (studentProgress) {
          sub.studentProgress = [studentProgress];
        }

        return sub;
      }),
    );

    // Filter out null values
    const validSubCompetencies = subCompetencies.filter((sub): sub is NonNullable<typeof sub> =>
      Boolean(sub),
    );

    // Use default period covering all time if not provided
    const reportPeriod: ReportPeriod = period || {
      startDate: new Date(0), // Beginning of time
      endDate: new Date(), // Current time
    };

    // Use the existing groupByDomain function to get detailed domain data
    const domainData = groupByDomain(validSubCompetencies, reportPeriod);

    // Transform to simplified format for summary use
    return domainData
      .map((domain) => ({
        name: domain.domainName,
        color: domain.domainColor ?? 'grey',
        progress: Math.round(domain.overallProgress),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  return {
    loading,
    error,
    reportData,
    generateReport,
    generateDomainSummary,
  };
}
