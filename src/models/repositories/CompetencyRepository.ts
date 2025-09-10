import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import {
  Competency,
  type CompetencyGraphQLData,
  type CreateCompetencyData,
  type UpdateCompetencyData,
  CompetencyStatus,
} from '../Competency';

/**
 * Competency filter type for queries
 */
interface CompetencyFilter extends Record<string, unknown> {
  domain?: { eq: string };
  subDomain?: { eq: string };
  status?: { eq: CompetencyStatus };
  stage?: { eq: string };
}

/**
 * Competency repository implementing the Repository pattern
 * Handles data access for Competency entities
 */
export class CompetencyRepository
  implements Repository<Competency, CreateCompetencyData, UpdateCompetencyData, CompetencyFilter>
{
  /**
   * Create a new competency
   * @param data - Competency creation data
   * @returns Promise with created Competency instance
   */
  async create(data: CreateCompetencyData): Promise<Competency> {
    const rawCompetency = await graphQLClient.createCompetency(data);
    return new Competency(rawCompetency as CompetencyGraphQLData);
  }

  /**
   * Find competency by ID
   * @param id - Competency ID
   * @returns Promise with Competency instance or null if not found
   */
  async findById(id: string): Promise<Competency | null> {
    const rawCompetency = await graphQLClient.getCompetency(id);
    return rawCompetency ? new Competency(rawCompetency as CompetencyGraphQLData) : null;
  }

  /**
   * Find all competencies
   * @param filter - Optional filter criteria
   * @returns Promise with array of Competency instances
   */
  async findAll(filter?: CompetencyFilter): Promise<Competency[]> {
    const rawCompetencies = await graphQLClient.listCompetencies(filter);
    return rawCompetencies.map(
      (rawCompetency) => new Competency(rawCompetency as CompetencyGraphQLData),
    );
  }

  /**
   * Update a competency
   * @param id - Competency ID
   * @param data - Updated competency data
   * @returns Promise with updated Competency instance
   */
  async update(id: string, data: UpdateCompetencyData): Promise<Competency> {
    const rawCompetency = await graphQLClient.updateCompetency(id, data);
    return new Competency(rawCompetency as CompetencyGraphQLData);
  }

  /**
   * Delete a competency
   * @param id - Competency ID
   * @returns Promise with deleted Competency instance
   */
  async delete(id: string): Promise<Competency> {
    const rawCompetency = await graphQLClient.deleteCompetency(id);
    return new Competency(rawCompetency as CompetencyGraphQLData);
  }

  /**
   * Find competencies by domain
   * @param domain - Domain to filter by
   * @returns Promise with array of Competency instances
   */
  async findByDomain(domain: string): Promise<Competency[]> {
    return this.findAll({ domain: { eq: domain } });
  }

  /**
   * Find competencies by sub-domain
   * @param subDomain - Sub-domain to filter by
   * @returns Promise with array of Competency instances
   */
  async findBySubDomain(subDomain: string): Promise<Competency[]> {
    return this.findAll({ subDomain: { eq: subDomain } });
  }

  /**
   * Find competencies by status
   * @param status - Status to filter by
   * @returns Promise with array of Competency instances
   */
  async findByStatus(status: CompetencyStatus): Promise<Competency[]> {
    return this.findAll({ status: { eq: status } });
  }

  /**
   * Find competencies by stage
   * @param stage - Stage to filter by
   * @returns Promise with array of Competency instances
   */
  async findByStage(stage: string): Promise<Competency[]> {
    return this.findAll({ stage: { eq: stage } });
  }

  /**
   * Find available competencies (unlocked or in progress)
   * @returns Promise with array of available Competency instances
   */
  async findAvailable(): Promise<Competency[]> {
    const unlocked = await this.findByStatus(CompetencyStatus.UNLOCKED);
    const inProgress = await this.findByStatus(CompetencyStatus.IN_PROGRESS);
    return [...unlocked, ...inProgress];
  }

  /**
   * Find acquired competencies
   * @returns Promise with array of acquired Competency instances
   */
  async findAcquired(): Promise<Competency[]> {
    return this.findByStatus(CompetencyStatus.ACQUIRED);
  }

  /**
   * Find competencies by domain and sub-domain
   * @param domain - Domain to filter by
   * @param subDomain - Sub-domain to filter by
   * @returns Promise with array of Competency instances
   */
  async findByDomainAndSubDomain(domain: string, subDomain: string): Promise<Competency[]> {
    return this.findAll({
      domain: { eq: domain },
      subDomain: { eq: subDomain },
    });
  }
}

// Singleton instance
export const competencyRepository = new CompetencyRepository();
