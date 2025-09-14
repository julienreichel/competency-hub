import { env } from '$amplify/env/post-confirmation';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { PostConfirmationTriggerHandler } from 'aws-lambda';
import { type Schema } from '../../data/resource';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

export const handler: PostConfirmationTriggerHandler = async (event) => {
  await client.models.User.create({
    email: event.request.userAttributes.email,
    id: event.request.userAttributes.sub,
    name:
      `${event.request.userAttributes.given_name || ''} ${event.request.userAttributes.family_name || ''}`.trim() ||
      event.request.userAttributes.email,
    role: 'Unknown',
    status: 'Active',
    avatar: '',
    contactInfo: '',
    lastActive: new Date().toISOString(),
  });
  return event;
};
