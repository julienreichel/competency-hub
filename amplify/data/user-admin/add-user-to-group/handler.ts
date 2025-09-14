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

// Use 'any' for handler to avoid local type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handler = async (event: any): Promise<any> => {
  const { userId, groupName } = event.arguments;
  const USER_GROUPS = ['Student', 'Educator', 'Parent', 'Admin'];

  // 1. List all groups the user is currently in
  const listRes = await client.send(
    new AdminListGroupsForUserCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    }),
  );

  // 2. Remove user from any of the defined groups
  if (listRes.Groups) {
    for (const group of listRes.Groups) {
      if (
        group.GroupName &&
        USER_GROUPS.includes(group.GroupName) &&
        group.GroupName !== groupName
      ) {
        await client.send(
          new AdminRemoveUserFromGroupCommand({
            Username: userId,
            GroupName: group.GroupName,
            UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
          }),
        );
      }
    }
  }

  // 3. Add user to the new group
  const res = await client.send(
    new AdminAddUserToGroupCommand({
      Username: userId,
      GroupName: groupName,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    }),
  );

  // 4. Update the User model's role field to match the new group
  // (Assumes userId is the User model's id)

  let userUpdateResult = null;
  try {
    userUpdateResult = await dataClient.models.User.update({
      id: userId,
      role: groupName,
    });
  } catch {
    // Optionally log or handle error
  }

  return { ok: true, sdkResult: res, userUpdateResult };
};
