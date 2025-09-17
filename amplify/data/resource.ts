import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { postConfirmation } from '../auth/post-confirmation/resource';
// ✅ NEW: import function resources
import { addUserToGroupFn } from './user-admin/resource';

const schema = a
  .schema({
    User: a
      .model({
        name: a.string(),
        role: a.enum(['Unknown', 'Student', 'Educator', 'Parent', 'Admin']),
        email: a.string().required(),
        avatar: a.string(),
        picture: a.string(),
        contactInfo: a.string(),
        lastActive: a.string(),
        educators: a.hasMany('TeachingAssignment', 'studentId'),
        students: a.hasMany('TeachingAssignment', 'educatorId'),
        parents: a.hasMany('ParentLink', 'studentId'),
        children: a.hasMany('ParentLink', 'parentId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.owner().to(['read', 'update']),
        allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
      ]),
    TeachingAssignment: a
      .model({
        studentId: a.id().required(),
        student: a.belongsTo('User', 'studentId'),
        educatorId: a.id().required(),
        educator: a.belongsTo('User', 'educatorId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read', 'create', 'delete']),
        allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
      ]),
    ParentLink: a
      .model({
        studentId: a.id().required(),
        student: a.belongsTo('User', 'studentId'),
        parentId: a.id().required(),
        parent: a.belongsTo('User', 'parentId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin']).to(['create', 'read', 'update', 'delete']),
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
  })
  .authorization((allow) => [allow.resource(postConfirmation), allow.resource(addUserToGroupFn)]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
