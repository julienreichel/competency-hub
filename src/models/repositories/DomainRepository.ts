import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import { Domain } from '../Domain';

export interface CreateDomainInput {
  name: string;
  colorCode?: string | null;
}

export type UpdateDomainInput = Partial<CreateDomainInput>;

interface DomainFilter extends Record<string, unknown> {
  name?: { contains: string };
}

export class DomainRepository
  implements Repository<Domain, CreateDomainInput, UpdateDomainInput, DomainFilter>
{
  async create(data: CreateDomainInput): Promise<Domain> {
    const raw = await graphQLClient.createDomain(data);
    if (!raw) {
      throw new Error('Failed to create domain');
    }
    return Domain.fromAmplify(raw);
  }

  async findById(id: string, includeHierarchy = false): Promise<Domain | null> {
    const raw = includeHierarchy
      ? await graphQLClient.getDomainWithHierarchy(id)
      : await graphQLClient.getDomain(id);
    if (!raw) {
      return null;
    }
    return Domain.fromAmplify(raw);
  }

  async findAll(filter?: DomainFilter): Promise<Domain[]> {
    const rawDomains = await graphQLClient.listDomains(filter ?? undefined);
    return rawDomains
      .filter(
        (domain): domain is NonNullable<typeof domain> => domain !== null && domain !== undefined,
      )
      .map((domain) => Domain.fromAmplify(domain));
  }

  async update(id: string, data: UpdateDomainInput): Promise<Domain> {
    const raw = await graphQLClient.updateDomain({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update domain ${id}`);
    }
    return Domain.fromAmplify(raw);
  }

  async delete(id: string): Promise<Domain> {
    const domainDetails = await graphQLClient.getDomainWithHierarchy(id);

    if (Array.isArray(domainDetails?.competencies) && domainDetails?.competencies?.length) {
      await Promise.all(
        domainDetails.competencies
          .filter((competency): competency is { id: string } & Record<string, unknown> =>
            Boolean(competency && typeof competency === 'object' && 'id' in competency),
          )
          .map(async (competency) => {
            try {
              await graphQLClient.deleteCompetency(competency.id);
            } catch (error) {
              console.error(`Failed to delete competency ${competency.id} for domain ${id}`, error);
            }
          }),
      );
    }

    const raw = await graphQLClient.deleteDomain(id);
    if (!raw) {
      throw new Error(`Failed to delete domain ${id}`);
    }
    return Domain.fromAmplify(raw);
  }
}

export const domainRepository = new DomainRepository();
