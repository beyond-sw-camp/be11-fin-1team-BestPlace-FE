import LiveDetailPage from "@/views/liveDetailPage.vue";
import LiveListView from "@/views/liveListView.vue";
import SearchView from "@/views/SearchView.vue";
import ChannelView from "@/views/ChannelView.vue";
export default [
    {
      path: '/live/:streamId',
      name: 'Live',
      component: LiveDetailPage
    },
    {
      path: '/lives',
      name: 'Lives',
      component: LiveListView
    },
    {
      path: '/search',
      name: 'Search',
      component: SearchView
    },
    {
      path: '/channel/:memberId',
      name: 'Channel',
      component: ChannelView
    },
  ];