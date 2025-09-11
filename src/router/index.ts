import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { useAuth } from 'src/composables/useAuth';
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

  // Initialize auth composable for router guards
  const auth = useAuth();

  /**
   * Navigation guard for authentication and authorization
   */
  Router.beforeEach(async (to, from, next) => {
    // Initialize auth state if needed
    if (!auth.user.value && !auth.isLoading.value) {
      await auth.initAuth();
    }

    // Check if route requires authentication
    const requiresAuth = to.meta.requiresAuth !== false; // Default to true unless explicitly false

    if (!requiresAuth) {
      // Public route, allow access
      next();
      return;
    }

    // Check authentication status
    if (!auth.isAuthenticated.value) {
      // Redirect to login if not authenticated, preserving the target route
      next({
        path: '/login',
        query: to.path !== '/' ? { redirect: to.fullPath } : {},
      });
      return;
    }

    // Check role-based access
    const requiredRoles = to.meta.roles as string[] | undefined;
    if (requiredRoles && requiredRoles.length > 0) {
      if (!auth.hasAnyRole(requiredRoles)) {
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
