import { env } from '$amplify/env/admin-create-user';
import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import type { Schema } from '../../resource';

type Handler = Schema['adminCreateUser']['functionHandler'];
const client = new CognitoIdentityProviderClient();

export const handler: Handler = async (event) => {
  const { userId, email, phone, tempPassword, suppressMessage } = event.arguments;

  const res = await client.send(
    new AdminCreateUserCommand({
      Username: userId,
      UserPoolId: env.AMPLIFY_AUTH_USERPOOL_ID,
      TemporaryPassword: tempPassword ?? undefined,
      MessageAction: suppressMessage ? 'SUPPRESS' : undefined,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        ...(phone ? [{ Name: 'phone_number', Value: phone }] : []),
      ],
      DesiredDeliveryMediums: suppressMessage ? undefined : ['EMAIL'],
    }),
  );

  return { ok: true, sdkResult: res };
};
