import { createRouter, createWebHistory } from 'vue-router';
import ClipsView from '@/views/ClipsView.vue';
import CategoryView from '@/views/CategoryView.vue';
import MyProfileView from '@/views/MyProfileView.vue';
import MemberRouter from './MemberRouter';
import PostRouter from './PostRouter';
import VideoRouter from './VideoRouter';
import StreamingRouter from './streamingRouter';
import streamerRouter from './streamerRouter';
import HomeRouter from './HomeRouter';
import FollowingRouter from './FollowingRouter';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const routes = [
    { path: '/clips', component: ClipsView },
    { path: '/category', component: CategoryView },
    { path: '/my-profile', component: MyProfileView },
    ...MemberRouter,
    ...PostRouter,
    ...VideoRouter,
    ...StreamingRouter,
    ...streamerRouter,
    ...HomeRouter,
    ...FollowingRouter
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;  // 뒤로가기/앞으로가기 -> 이전 위치 복구
        } else {
            return { top: 0 };     // 새로운 페이지 -> 스크롤 맨 위로 이동
        }
    }
});

// 글로벌 네비게이션 가드
router.beforeEach(async (to, from, next) => {
    const authRequiredPages = [
        '/my-profile',
        '/post/community/create',
        '/video/vod/create',
        '/video/clip/create'
    ];

    const authRequired = authRequiredPages.some(path => to.path.startsWith(path));
    const isLoggedIn = !!localStorage.getItem('token');

    if (authRequired && !isLoggedIn) {
        console.log('인증이 필요한 페이지에 접근을 시도했으나 로그인되지 않았습니다.');
        return next('/member/login');
    }

    const token = localStorage.getItem('token');
    const payload = token ? jwtDecode(token) : null;
    const currentMemberId = payload?.sub;

    if (to.path.includes('/streamer/') && to.meta.requiresStreamer && currentMemberId) {
        const streamerId = to.params.memberId;
        
        try {
            const response = await axios.get(
                `${process.env.VUE_APP_STREAMING_API}/manager/checking/${streamerId}?requester=${currentMemberId}`
            );
            
            const isStreamerOrManager = response.data.result === 'Y';

            if (!isStreamerOrManager) {
                console.warn('접근 권한 없음: 스트리머 or channel매니저가 아님');
                return next('/not-authorized');
            }
        } catch (e) {
            console.error('스트리머 권한 확인 중 서버에서 오류 발생', e);
            return next('/error');
        }
    }

    return next();
});

export default router;