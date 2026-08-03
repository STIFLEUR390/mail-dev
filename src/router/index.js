import {createRouter, createWebHashHistory} from 'vue-router';

// Lazy-loaded screens: Vite code-splits them so the app shell starts faster.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {path: '/', redirect: '/mailbox'},
    {path: '/mailbox', component: () => import('../screens/Mailbox.vue')},
    {path: '/settings', component: () => import('../screens/Settings.vue')},
  ],
});

export default router;
