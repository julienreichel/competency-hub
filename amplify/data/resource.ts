import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates User and Competency database tables with proper
authentication and authorization. The authorization rules specify that:
- Users can manage their own records (owner-based access)
- Admins can manage all users
- Educators can read user data
- All authenticated users can read competencies
- Only Admins and Educators can create/update/delete competencies
=========================================================================*/

const schema = a.schema({
  User: a
    .model({
      name: a.string(),
      role: a.enum(['Student', 'Educator', 'Parent', 'Admin']),
      email: a.string(),
      avatar: a.string(),
      contactInfo: a.string(),
      status: a.enum(['Active', 'Inactive', 'Suspended']),
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
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
