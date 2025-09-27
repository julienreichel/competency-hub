import { env } from '$amplify/env/add-user-to-group';
import {
  AdminAddUserToGroupCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
// import type { Schema } from '../../resource';
const client = new CognitoIdentityProviderClient();

import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { type Schema } from '../../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const dataClient = generateClient<Schema>();

type AllowedGroup = 'Student' | 'Parent' | 'Educator' | 'Admin';
type HandlerResult = { ok: true; user?: unknown } | { ok: false; reason: string };

const USER_GROUPS: AllowedGroup[] = ['Student', 'Educator', 'Parent', 'Admin'];
const SELF_ASSIGN_GROUPS: AllowedGroup[] = ['Student', 'Parent'];

function normaliseGroups(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input as string[];
  if (typeof input === 'string') return input.split(',').map((value) => value.trim());
  return [];
}

function getCallerContext(event: { identity?: Record<string, unknown> }): {
  groups: string[];
  callerUserId: string;
  callerIsAdmin: boolean;
} {
  const identity = event.identity ?? {};
  const directGroups = normaliseGroups((identity as { groups?: unknown }).groups);
  const claimsGroups = normaliseGroups(
    ((identity as { claims?: Record<string, unknown> }).claims ?? {})['cognito:groups'],
  );
  const groups = directGroups.length ? directGroups : claimsGroups;
  const callerUserId = (identity.sub ?? identity.username) as string;
  const callerIsAdmin = groups.includes('Admin');

  return { groups, callerUserId, callerIsAdmin };
}

function validateRequest(
  targetGroup: AllowedGroup,
  userId: string,
  context: ReturnType<typeof getCallerContext>,
): HandlerResult | null {
  if (!context.callerIsAdmin) {
    if (!SELF_ASSIGN_GROUPS.includes(targetGroup)) {
      return { ok: false, reason: 'Only Student or Parent assignments allowed.' };
    }
    if (!context.callerUserId || context.callerUserId !== userId) {
      return { ok: false, reason: 'Users can only update their own role.' };
    }
  }
  return null;
}

async function fetchExistingGroups(userId: string): Promise<string[]> {
  const listRes = await client.send(
    new AdminListGroupsForUserCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    }),
  );
  return (listRes.Groups ?? [])
    .map((group) => group.GroupName)
    .filter((name): name is string => Boolean(name));
}

async function syncCognitoGroups(
  userId: string,
  existingGroups: string[],
  targetGroup: AllowedGroup,
  callerIsAdmin: boolean,
): Promise<HandlerResult | null> {
  if (!callerIsAdmin) {
    const currentAssign = existingGroups.find((name) => USER_GROUPS.includes(name as AllowedGroup));
    if (currentAssign && currentAssign !== targetGroup) {
      return {
        ok: false,
        reason: 'Role already assigned. Contact an administrator for changes.',
      };
    }
    if (!existingGroups.includes(targetGroup)) {
      await client.send(
        new AdminAddUserToGroupCommand({
          Username: userId,
          GroupName: targetGroup,
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
        }),
      );
    }
    return null;
  }

  for (const group of existingGroups) {
    if (USER_GROUPS.includes(group as AllowedGroup) && group !== targetGroup) {
      await client.send(
        new AdminRemoveUserFromGroupCommand({
          Username: userId,
          GroupName: group,
          UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
        }),
      );
    }
  }

  if (!existingGroups.includes(targetGroup)) {
    await client.send(
      new AdminAddUserToGroupCommand({
        Username: userId,
        GroupName: targetGroup,
        UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      }),
    );
  }

  return null;
}

async function updateUserRole(userId: string, targetGroup: AllowedGroup): Promise<HandlerResult> {
  try {
    const userUpdateResult = await dataClient.models.User.update({
      id: userId,
      role: targetGroup,
    });
    return { ok: true, user: userUpdateResult?.data };
  } catch (error) {
    console.error('Failed to update user role', error);
    return { ok: false, reason: 'Failed to update user record.' };
  }
}

// Use 'any' for handler to avoid local type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any): Promise<HandlerResult> => {
  const { userId, groupName } = event.arguments as { userId: string; groupName: string };
  if (!USER_GROUPS.includes(groupName as AllowedGroup)) {
    return { ok: false, reason: 'Invalid group requested.' };
  }

  const targetGroup = groupName as AllowedGroup;
  const context = getCallerContext(event);
  const validationError = validateRequest(targetGroup, userId, context);
  if (validationError) {
    return validationError;
  }

  const existingGroups = await fetchExistingGroups(userId);
  const syncError = await syncCognitoGroups(
    userId,
    existingGroups,
    targetGroup,
    context.callerIsAdmin,
  );
  if (syncError) {
    return syncError;
  }

  return updateUserRole(userId, targetGroup);
};
