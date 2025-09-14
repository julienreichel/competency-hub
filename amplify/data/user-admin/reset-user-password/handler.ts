import { env } from '$amplify/env/reset-user-password';
import {
  AdminResetUserPasswordCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../resource';

type Handler = Schema['resetUserPassword']['functionHandler'];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (event) => {
  const { userId, newPassword } = event.arguments;

  if (newPassword && newPassword.length > 0) {
    const res = await client.send(
      new AdminSetUserPasswordCommand({
        Username: userId,
        Password: newPassword,
        Permanent: true,
        UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      }),
    );
    return { ok: true, mode: 'set', sdkResult: res };
  }

  const res = await client.send(
    new AdminResetUserPasswordCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
    }),
  );
  return { ok: true, mode: 'reset', sdkResult: res };
};
