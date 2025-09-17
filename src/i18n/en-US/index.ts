// Translation keys for competency hub application

export default {
  // Common terms
  common: {
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    submit: 'Submit',
    save: 'Save',
    user: 'User',
    users: 'Users',
    profile: 'Profile',
    role: 'Role',
    status: 'Status',
    email: 'Email',
    name: 'Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    username: 'Username',
    close: 'Close',
  },

  // Admin section
  admin: {
    userManagement: 'User Management',
    addUser: 'Add User',
    addNewUser: 'Add New User',
    bulkImport: 'Bulk Import',
    searchUsers: 'Search users...',
    resetPassword: 'Reset Password',
    activate: 'Activate',
    deactivate: 'Deactivate',
    changeRole: 'Change Role',
    changeRolePrompt: 'Select the new role for the selected users ({count}).',
    bulkRoleSuccess: 'Updated role for {count} user(s).',
    bulkRolePartial: 'Updated {success} user(s); {failed} failed.',
    bulkRoleNoChanges: 'All selected users already have this role.',
    bulkRoleError: 'Could not update the selected users. Please try again.',
    usernameHint: 'Leave blank to auto-generate',
    contactInfo: 'Contact Information',
    userName: 'Full Name',
    avatar: {
      clear: 'Clear',
      regenerate: 'Regenerate',
      random: 'Random',
    },
    editUser: 'Edit User',
    avatarPickerTitle: 'Choose an avatar',
    userDetails: 'User Details',
    lastActive: 'Last Active',
    memberSince: 'Member Since',
    stats: {
      totalUsers: 'Total Users',
      students: 'Students',
      newThisMonth: 'New This Month',
      onlineNow: 'Online Now',
    },
  },

  profile: {
    uploadPhoto: 'Upload Photo',
    uploadInstructions: 'Drag and Drop an image to replace your profile picture.',
    uploadError: 'Could not upload the photo. Please try again.',
  },

  // Validation messages
  validation: {
    required: 'This field is required',
    emailRequired: 'Email is required',
    emailInvalid: 'Please enter a valid email address',
    nameRequired: 'Name is required',
    firstNameRequired: 'First name is required',
    lastNameRequired: 'Last name is required',
    roleRequired: 'Role is required',
  },

  // Login and authentication
  login: {
    welcomeBack: 'Welcome Back',
    enterCredentials: 'Enter your credentials to continue',
    signIn: 'Sign In',
    accessDashboard: 'Access your competency dashboard',
    createAccount: 'Create Account',
    joinPlatform: 'Join the competency learning platform',
    termsAndPrivacy: 'By signing in, you agree to our Terms of Service and Privacy Policy',
    success: 'Login successful',
    signedIn: 'You are now signed in to Competency Hub.',
  },
};
