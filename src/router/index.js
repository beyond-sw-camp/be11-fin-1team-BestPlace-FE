import { createRouter, createWebHistory } from 'vue-router';
import ClipsView from '@/views/ClipsView.vue';
import CategoryView from '@/views/CategoryView.vue';
import MyProfileView from '@/views/MyProfileView.vue';
import MemberRouter from './MemberRouter';
import PostRouter from './PostRouter';
import VideoRouter from './VideoRouter';
import StreamingRouter from './streamingRouter';
import streamerRouter from './streamerRouter';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';


const routes = [
    { path: '/clips', component: ClipsView },
    { path: '/category', component: CategoryView },
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
router.beforeEach(async (to, from, next) => {
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
    } 

    const token = localStorage.getItem('token');
    const payload = token ? jwtDecode(token) : null;
    const currentMemberId = payload?.sub;
    
    // /streamer/:memberId 경로 패턴 체크
    if (to.path.includes('/streamer/') && to.meta.requiresStreamer && currentMemberId) {
        const streamerId = to.params.memberId; // URL에서 스트리머 ID 추출
        
        try {
            // 현재 로그인한 사용자가 해당 스트리머의 매니저인지 체크
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