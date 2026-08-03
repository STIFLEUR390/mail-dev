import {createRouter, createWebHashHistory} from 'vue-router';
import Mailbox from '../screens/Mailbox.vue';
import Settings from '../screens/Settings.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {path: '/', redirect: '/mailbox'},
    {path: '/mailbox', component: Mailbox},
    {path: '/settings', component: Settings},
  ],
});

export default router;
