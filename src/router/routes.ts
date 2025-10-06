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
        path: 'me/competencies',
        name: 'my-competencies',
        component: () => import('pages/CompetenciesPage.vue'),
        meta: { roles: ['Student'] },
      },
      {
        path: ':userId/competencies',
        name: 'user-competencies',
        component: () => import('pages/CompetenciesPage.vue'),
        meta: { roles: ['Educator', 'Parent'] },
      },
      {
        path: 'me/assessments',
        name: 'my-assessments',
        component: () => import('pages/AssessmentsPage.vue'),
        meta: { roles: ['Student', 'Parent'] },
      },
      {
        path: ':userId/assessments',
        name: 'user-assessments',
        component: () => import('pages/AssessmentsPage.vue'),
        meta: { roles: ['Educator', 'Parent'] },
      },
      {
        path: 'me/projects',
        name: 'my-projects',
        component: () => import('src/pages/ProjectsPage.vue'),
        meta: { roles: ['Student'] },
      },
      {
        path: 'projects/:projectId',
        name: 'project-detail',
        component: () => import('pages/ProjectDetailPage.vue'),
        meta: { roles: ['Student', 'Educator', 'Admin'] },
      },
      {
        path: 'domains',
        name: 'domains',
        component: () => import('pages/DomainsPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'domains/:domainId',
        name: 'domain',
        component: () => import('src/pages/DomainPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'competencies/:competencyId',
        name: 'competency',
        component: () => import('src/pages/CompetencyPage.vue'),
        meta: { roles: ['Student', 'Admin', 'Educator'] },
      },
      {
        path: 'competencies/:competencyId/sub/:subId',
        name: 'sub-competency',
        component: () => import('src/pages/SubCompetencyPage.vue'),
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
          {
            path: 'projects',
            name: 'educator-projects',
            component: () => import('pages/educator/ProjectsPage.vue'),
            meta: { roles: ['Educator'] },
          },
        ],
      },
      {
        path: 'reports/:studentId',
        name: 'student-report',
        component: () => import('pages/ReportPage.vue'),
        meta: { roles: ['Educator', 'Parent'] },
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
