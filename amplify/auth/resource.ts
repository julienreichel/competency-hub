import { defineAuth } from '@aws-amplify/backend';
import { postConfirmation } from './post-confirmation/resource';

/**
 * Define and configure your auth resource with user groups
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: 'CODE',
      verificationEmailSubject: 'Welcome to Competency Hub!',
      verificationEmailBody: (createCode) => `Your verification code is ${createCode()}`,
    },
  },
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
    givenName: {
      required: true,
      mutable: true,
    },
    familyName: {
      required: true,
      mutable: true,
    },
  },
  groups: ['Student', 'Educator', 'Parent', 'Admin'],
  triggers: {
    postConfirmation,
  },
});
