import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';
// ✅ NEW: import function resources
import {
  addUserToGroupFn,
  adminCreateUserFn,
  adminDeleteUserFn,
  resetUserPasswordFn,
} from './user-admin/resource';

const schema = a
  .schema({
    User: a
      .model({
        name: a.string(),
        role: a.enum(['Unknown', 'Student', 'Educator', 'Parent', 'Admin']),
        email: a.string().required(),
        avatar: a.string(),
        contactInfo: a.string(),
        status: a.enum(['Active', 'Inactive', 'Suspended']),
        lastActive: a.string(),
      })
      .authorization((allow) => [
        allow.owner(),
        allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
        allow.groups(['Educator']).to(['read']),
      ]),
    Competency: a
      .model({
        domain: a.string(),
        subDomain: a.string(),
        description: a.string(),
        stage: a.string(),
        status: a.enum(['LOCKED', 'UNLOCKED', 'ACQUIRED', 'IN_PROGRESS']),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin', 'Educator']).to(['create', 'update', 'delete']),
      ]),
    addUserToGroup: a
      .mutation()
      .arguments({
        userId: a.string().required(),
        groupName: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(addUserToGroupFn)),

    resetUserPassword: a
      .mutation()
      .arguments({
        userId: a.string().required(),
        newPassword: a.string(), // if provided → set permanent; else → reset flow
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(resetUserPasswordFn)),

    adminDeleteUser: a
      .mutation()
      .arguments({
        userId: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(adminDeleteUserFn)),

    adminCreateUser: a
      .mutation()
      .arguments({
        userId: a.string().required(),
        email: a.string().required(),
        phone: a.string(), // optional
        tempPassword: a.string(), // optional (Cognito can auto-generate)
        suppressMessage: a.boolean(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin')])
      .handler(a.handler.function(adminCreateUserFn)),
  })
  .authorization((allow) => [allow.resource(postConfirmation), allow.resource(addUserToGroupFn)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
