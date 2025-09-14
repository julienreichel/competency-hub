import { defineFunction } from '@aws-amplify/backend';

export const addUserToGroupFn = defineFunction({
  name: 'add-user-to-group',
  entry: './add-user-to-group/handler.ts',
});
export const resetUserPasswordFn = defineFunction({
  name: 'reset-user-password',
  entry: './reset-user-password/handler.ts',
});
export const adminDeleteUserFn = defineFunction({
  name: 'admin-delete-user',
  entry: './delete-user/handler.ts',
});
export const adminCreateUserFn = defineFunction({
  name: 'admin-create-user',
  entry: './create-user/handler.ts',
});
