import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LivesView from '@/views/LivesView.vue';
import ClipsView from '@/views/ClipsView.vue';
import CategoryView from '@/views/CategoryView.vue';
import FollowingView from '@/views/FollowingView.vue';
import MyProfileView from '@/views/MyProfileView.vue';
import MemberRouter from './MemberRouter';
import PostRouter from './PostRouter';
import VideoRouter from './VideoRouter';
import StreamingRouter from './streamingRouter';
import streamerRouter from './streamerRouter';


const routes = [
    { path: '/', component: HomeView },
    { path: '/lives', component: LivesView },
    { path: '/clips', component: ClipsView },
    { path: '/category', component: CategoryView },
    { path: '/following', component: FollowingView },
    { path: '/my-profile', component: MyProfileView },
    
    // { path: '/video/vod/:videoId', component: () => import('@/views/VideoDetailView.vue') },
    // { path: '/video/clip/:clipId', component: () => import('@/views/ClipDetailView.vue') },
    ...MemberRouter,
    ...PostRouter,
    ...VideoRouter,
    ...StreamingRouter,
    ...streamerRouter

];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// 글로벌 네비게이션 가드 설정 - 인증이 필요한 페이지 접근 제어
router.beforeEach((to, from, next) => {
    // 인증이 필요한 페이지 경로
    const authRequiredPages = [
        '/my-profile',
        '/post/community/create',
        '/video/vod/create',
        '/video/clip/create'
    ];

    // 현재 페이지가 인증이 필요한지 확인
    const authRequired = authRequiredPages.some(path => to.path.startsWith(path));
    const isLoggedIn = !!localStorage.getItem('token');

    // 인증이 필요하지만 로그인되지 않은 경우
    if (authRequired && !isLoggedIn) {
        console.log('인증이 필요한 페이지에 접근을 시도했으나 로그인되지 않았습니다.');
        next('/member/login');
    } else {
        next();
    }
});

export default router;