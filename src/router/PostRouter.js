import PostCreateView from '@/views/PostCommunityViews/PostCreateView.vue';
import PostDetailView from '@/views/PostCommunityViews/PostDetailView.vue';
export default [
    {
        path: '/post/community/create/:memberId',
        name: 'PostCreateView',
        component: PostCreateView
    },
    {
        path: '/post/community/detail/:postId',
        name: 'PostDetailView',
        component: PostDetailView
    }
]