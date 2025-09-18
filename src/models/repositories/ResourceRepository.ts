import type { Repository } from '../base/BaseModel';
import { graphQLClient } from '../base/GraphQLClient';
import {
  CompetencyResource,
  type CreateResourceInput,
  type UpdateResourceInput,
} from '../Competency';

interface ResourceFilter extends Record<string, unknown> {
  subCompetencyId?: { eq: string };
  type?: { eq: string };
}

export class ResourceRepository
  implements
    Repository<CompetencyResource, CreateResourceInput, UpdateResourceInput, ResourceFilter>
{
  async create(data: CreateResourceInput): Promise<CompetencyResource> {
    const raw = await graphQLClient.createResource(data);
    if (!raw) {
      throw new Error('Failed to create resource');
    }
    return CompetencyResource.fromAmplify(raw);
  }

  async findById(id: string): Promise<CompetencyResource | null> {
    const raw = await graphQLClient.getResource(id);
    if (!raw) {
      return null;
    }
    return CompetencyResource.fromAmplify(raw);
  }

  async findAll(filter?: ResourceFilter): Promise<CompetencyResource[]> {
    const rawResources = await graphQLClient.listResources(filter ?? undefined);
    return rawResources
      .filter(
        (resource): resource is NonNullable<typeof resource> =>
          resource !== null && resource !== undefined,
      )
      .map((resource) => CompetencyResource.fromAmplify(resource));
  }

  async update(id: string, data: UpdateResourceInput): Promise<CompetencyResource> {
    const raw = await graphQLClient.updateResource({ id, ...data });
    if (!raw) {
      throw new Error(`Failed to update resource ${id}`);
    }
    return CompetencyResource.fromAmplify(raw);
  }

  async delete(id: string): Promise<CompetencyResource> {
    const raw = await graphQLClient.deleteResource(id);
    if (!raw) {
      throw new Error(`Failed to delete resource ${id}`);
    }
    return CompetencyResource.fromAmplify(raw);
  }
}

export const resourceRepository = new ResourceRepository();
