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
        owner: a.string().required(),
        educators: a.hasMany('TeachingAssignment', 'studentId'),
        students: a.hasMany('TeachingAssignment', 'educatorId'),
        parents: a.hasMany('ParentLink', 'studentId'),
        children: a.hasMany('ParentLink', 'parentId'),
        helperResources: a.hasMany('Resource', 'personUserId'),
        studentProgress: a.hasMany('StudentSubCompetencyProgress', 'studentId'),
        evaluationAttempts: a.hasMany('EvaluationAttempt', 'studentId'),
        projects: a.hasMany('Project', 'studentId'),
        messageThreads: a.hasMany('ThreadParticipant', 'userId'),
        createdThreads: a.hasMany('MessageThread', 'createdById'),
        sentMessages: a.hasMany('Message', 'senderId'),
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
    Domain: a
      .model({
        name: a.string().required(),
        colorCode: a.string(),
        competencies: a.hasMany('Competency', 'domainId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin']).to(['create', 'update', 'delete']),
      ]),
    Competency: a
      .model({
        domainId: a.id().required(),
        domain: a.belongsTo('Domain', 'domainId'),
        name: a.string().required(),
        description: a.string(),
        objectives: a.string(),
        subCompetencies: a.hasMany('SubCompetency', 'competencyId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin', 'Educator']).to(['create', 'update', 'delete']),
      ]),
    SubCompetency: a
      .model({
        competencyId: a.id().required(),
        competency: a.belongsTo('Competency', 'competencyId'),
        name: a.string().required(),
        description: a.string(),
        objectives: a.string(),
        level: a.integer().default(0),
        resources: a.hasMany('Resource', 'subCompetencyId'),
        studentProgress: a.hasMany('StudentSubCompetencyProgress', 'subCompetencyId'),
        evaluations: a.hasMany('Evaluation', 'subCompetencyId'),
        projects: a.hasMany('Project', 'subCompetencyId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin', 'Educator']).to(['create', 'update', 'delete']),
      ]),
    Resource: a
      .model({
        subCompetencyId: a.id().required(),
        subCompetency: a.belongsTo('SubCompetency', 'subCompetencyId'),
        type: a.enum(['Link', 'Human', 'Document', 'Location']),
        name: a.string().required(),
        description: a.string(),
        url: a.string(),
        fileKey: a.string(),
        personUserId: a.id(),
        person: a.belongsTo('User', 'personUserId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Admin', 'Educator']).to(['create', 'update', 'delete']),
      ]),
    // --- Student Progress Tracking ---
    StudentSubCompetencyProgress: a
      .model({
        studentId: a.id().required(),
        student: a.belongsTo('User', 'studentId'),
        subCompetencyId: a.id().required(),
        subCompetency: a.belongsTo('SubCompetency', 'subCompetencyId'),
        status: a.enum(['NotStarted', 'InProgress', 'PendingValidation', 'Validated']),
        percent: a.float().default(0),
        lockOverride: a.enum(['Locked', 'Unlocked']),
        recommended: a.boolean(),
        updatedAt: a.string(),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.owner().to(['create', 'update', 'read']),
        allow.groups(['Student']).to(['update', 'read']),
        allow.groups(['Educator', 'Admin']).to(['create', 'update', 'read']),
      ]),

    Evaluation: a
      .model({
        subCompetencyId: a.id().required(),
        subCompetency: a.belongsTo('SubCompetency', 'subCompetencyId'),
        name: a.string().required(),
        description: a.string(),
        mode: a.enum(['Solo', 'Peer', 'Adult']),
        format: a.enum(['Experiment', 'PaperPencil', 'Oral', 'Digital']),
        durationMin: a.integer(),
        url: a.string(),
        fileKey: a.string(),
        attempts: a.hasMany('EvaluationAttempt', 'evaluationId'),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.groups(['Educator', 'Admin']).to(['create', 'update', 'delete']),
      ]),

    EvaluationAttempt: a
      .model({
        studentId: a.id().required(),
        student: a.belongsTo('User', 'studentId'),
        evaluationId: a.id().required(),
        evaluation: a.belongsTo('Evaluation', 'evaluationId'),
        status: a.enum(['NotStarted', 'InProgress', 'Completed']),
        completionMode: a.enum(['Auto', 'Manual']),
        startedAt: a.datetime(),
        completedAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.authenticated().to(['read']),
        allow.owner().to(['create', 'update', 'read']),
        allow.groups(['Educator', 'Admin']).to(['create', 'update', 'read']),
      ]),

    Project: a
      .model({
        studentId: a.id().required(),
        student: a.belongsTo('User', 'studentId'),
        subCompetencyId: a.id().required(),
        subCompetency: a.belongsTo('SubCompetency', 'subCompetencyId'),
        name: a.string().required(),
        description: a.string(),
        fileKey: a.string(),
        status: a.enum(['Draft', 'Submitted', 'Approved', 'Rejected']),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.groups(['Educator', 'Admin']).to(['read', 'update']),
        allow.authenticated().to(['read']),
      ]),

    MessageThread: a
      .model({
        name: a.string().required(),
        createdById: a.id().required(),
        createdBy: a.belongsTo('User', 'createdById'),
        participants: a.hasMany('ThreadParticipant', 'threadId'),
        messages: a.hasMany('Message', 'threadId'),
        lastMessageAt: a.datetime(),
        archived: a.boolean().default(false),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read']),
        allow.groups(['Educator', 'Admin']).to(['create', 'read', 'update']),
      ]),

    Message: a
      .model({
        threadId: a.id().required(),
        thread: a.belongsTo('MessageThread', 'threadId'),
        senderId: a.id().required(),
        sender: a.belongsTo('User', 'senderId'),
        body: a.string().required(),
        kind: a.enum([
          'Message',
          'ValidationSubmitted',
          'ProjectSubmitted',
          'ProjectApproved',
          'ProjectRejected',
        ]),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'read']),
        allow.authenticated().to(['read']),
        allow.groups(['Educator', 'Admin']).to(['create', 'read']),
      ]),

    ThreadParticipant: a
      .model({
        threadId: a.id().required(),
        thread: a.belongsTo('MessageThread', 'threadId'),
        userId: a.id().required(),
        user: a.belongsTo('User', 'userId'),
        lastReadAt: a.datetime(),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'read', 'update', 'delete']),
        allow.authenticated().to(['read', 'update']),
      ]),

    addUserToGroup: a
      .mutation()
      .arguments({
        userId: a.string().required(),
        groupName: a.string().required(),
      })
      .returns(a.json())
      .authorization((allow) => [allow.group('Admin'), allow.authenticated()])
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
