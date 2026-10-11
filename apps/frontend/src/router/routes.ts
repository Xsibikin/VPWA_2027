import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/pages/ChatPage.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/auth',
    component: () => import('@/pages/AuthPage.vue'),
  },
];

export default routes;
