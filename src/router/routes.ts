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
        path: 'domains',
        name: 'domains',
        component: () => import('pages/DomainsPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'domains/:domainId',
        name: 'domain-competencies',
        component: () => import('pages/DomainCompetenciesPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'competencies/:competencyId',
        name: 'competency-sub-competency',
        component: () => import('src/pages/CompetencySubCompetencyPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'competencies/:competencyId/sub/:subId',
        name: 'sub-competency-resource',
        component: () => import('src/pages/SubCompetencyResourcePage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'educator',
        children: [
          {
            path: 'students',
            name: 'educator-students',
            component: () => import('pages/educator/StudentsPage.vue'),
            meta: { roles: ['Educator'] },
          },
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
        ],
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
