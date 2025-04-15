import { createRouter, createWebHistory } from 'vue-router';
import MemberRouter from './MemberRouter';

const routes = [
    ...MemberRouter
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;