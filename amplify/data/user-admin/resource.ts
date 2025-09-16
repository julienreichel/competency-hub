import { defineFunction } from '@aws-amplify/backend';

export const addUserToGroupFn = defineFunction({
  name: 'add-user-to-group',
  entry: './add-user-to-group/handler.ts',
});
