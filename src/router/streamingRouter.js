import LiveDetailPage from "@/views/liveDetailPage.vue";
import LiveListView from "@/views/liveListView.vue";
export default [
    {
      path: '/live/:streamId',
      name: 'Live',
      component: LiveDetailPage
    },
    {
      path: '/liveList',
      name: 'LiveList',
      component: LiveListView
    }
  ];