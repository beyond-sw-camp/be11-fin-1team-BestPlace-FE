export default [
    {
      path: '/following',
      name: 'FollowingView',
      component: () => import('@/views/FollowingView.vue')
    },
    {
      path: '/following/live',
      name: 'FollowingLive',
      component: () => import('@/views/FollowingView.vue')
    },
    {
      path: '/following/videos',
      name: 'FollowingVideos',
      component: () => import('@/views/FollowingView.vue')
    },
    {
      path: '/following/channels',
      name: 'FollowingChannels',
      component: () => import('@/views/FollowingView.vue')
    }
  ];
