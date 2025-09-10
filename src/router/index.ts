import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route((/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  /**
   * Check if user is authenticated
   */
  async function isAuthenticated(): Promise<boolean> {
    try {
      await getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user roles from attributes
   */
  async function getUserRoles(): Promise<string[]> {
    try {
      const attributes = await fetchUserAttributes();
      const groups = attributes['cognito:groups'];
      return Array.isArray(groups) ? groups : ['Student'];
    } catch {
      return [];
    }
  }

  /**
   * Check if user has required role
   */
  function hasRequiredRole(userRoles: string[], requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No specific roles required
    }
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Navigation guard for authentication and authorization
   */
  Router.beforeEach(async (to, from, next) => {
    // Check if route requires authentication
    const requiresAuth = to.meta.requiresAuth !== false; // Default to true unless explicitly false

    if (!requiresAuth) {
      // Public route, allow access
      next();
      return;
    }

    // Check authentication status
    const authenticated = await isAuthenticated();

    if (!authenticated) {
      // Redirect to login if not authenticated
      next({ path: '/login', query: { redirect: to.fullPath } });
      return;
    }

    // Check role-based access
    const requiredRoles = to.meta.roles as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      const userRoles = await getUserRoles();

      if (!hasRequiredRole(userRoles, requiredRoles)) {
        // User doesn't have required role, redirect to dashboard
        next({ path: '/', replace: true });
        return;
      }
    }

    // All checks passed, allow navigation
    next();
  });

  return Router;
});
