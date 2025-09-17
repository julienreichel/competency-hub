import { defineStorage } from '@aws-amplify/backend-storage';

export const storage = defineStorage({
  name: 'competencyHubStorage',
  access: (allow) => ({
    'public/*': [allow.guest.to(['read']), allow.authenticated.to(['read'])],
    'protected/*': [
      allow.authenticated.to(['read', 'write', 'delete']),
      allow.groups(['Student', 'Parent', 'Educator', 'Admin']).to(['read', 'write', 'delete']),
    ],
  }),
});
