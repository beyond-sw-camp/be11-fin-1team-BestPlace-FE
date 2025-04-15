import { createRouter, createWebHistory } from 'vue-router';
import UserRouter from './UserRouter';

const routes = [
    ...UserRouter
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;