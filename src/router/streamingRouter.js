import LiveDetailPage from "@/views/liveDetailPage.vue";

export default [
    {
      path: '/live/:streamId',
      name: 'Live',
      component: LiveDetailPage
    },
  ];