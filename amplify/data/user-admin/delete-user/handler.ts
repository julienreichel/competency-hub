import { env } from '$amplify/env/admin-delete-user';
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../resource';

type Handler = Schema['adminDeleteUser']['functionHandler'];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (event) => {
  const { userId } = event.arguments;

  const res = await client.send(
    new AdminDeleteUserCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    }),
  );

  return { ok: true, sdkResult: res };
};
