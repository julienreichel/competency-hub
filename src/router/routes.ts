import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  // Public routes (no authentication required)
  {
    path: '/login',
    component: () => import('layouts/AuthLayout.vue'),
    meta: { requiresAuth: false },
    children: [
      {
        path: '',
        name: 'login',
        component: () => import('pages/LoginPage.vue'),
      },
    ],
  },

  // Protected routes (authentication required)
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        component: () => import('pages/ProfilePage.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
      },
      {
        path: 'competencies',
        name: 'competencies',
        component: () => import('pages/CompetenciesPage.vue'),
        meta: { roles: ['Student', 'Parent'] },
      },
      {
        path: 'assessments',
        name: 'assessments',
        component: () => import('pages/AssessmentsPage.vue'),
        meta: { roles: ['Student', 'Parent'] },
      },
      {
        path: 'classes',
        name: 'classes',
        component: () => import('pages/ClassesPage.vue'),
        meta: { roles: ['Educator'] },
      },
      {
        path: 'educator',
        children: [
          {
            path: 'assessments',
            name: 'educator-assessments',
            component: () => import('pages/educator/AssessmentsPage.vue'),
            meta: { roles: ['Educator'] },
          },
        ],
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('pages/ReportsPage.vue'),
        meta: { roles: ['Educator'] },
      },
      {
        path: 'children',
        name: 'children',
        component: () => import('pages/ChildrenPage.vue'),
        meta: { roles: ['Parent'] },
      },
      {
        path: 'admin',
        children: [
          {
            path: 'users',
            name: 'admin-users',
            component: () => import('pages/admin/UsersPage.vue'),
            meta: { roles: ['Admin'] },
          },
          {
            path: 'settings',
            name: 'admin-settings',
            component: () => import('pages/admin/SettingsPage.vue'),
            meta: { roles: ['Admin'] },
          },
        ],
      },
      {
        path: 'help',
        name: 'help',
        component: () => import('pages/HelpPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
