import LiveDetailPage from "@/views/liveDetailPage.vue";
import LiveListView from "@/views/liveListView.vue";
import SearchView from "@/views/SearchView.vue";
import ChannelView from "@/views/channel/ChannelView.vue";
import ChannelSettingView from "@/views/ChannelSetting.vue";
import CommunityDetail from "@/views/channel/CommunityDetail.vue";
import HomeTab from "@/views/channel/HomeTab.vue";
import VideosTab from "@/views/channel/VideosTab.vue";
import ClipsTab from "@/views/channel/ClipsTab.vue";
import CommunityTab from "@/views/channel/CommunityTab.vue";
import InfoTab from "@/views/channel/InfoTab.vue";
import ChatDonation from "@/views/ChatDonation.vue";
import MissionDonation from "@/views/missonDonation.vue";

export default [
  {
    path: '/mission-donation/:streamId',
    name: 'MissionDonation',
    component: MissionDonation
  },
  {
    path: '/chat-donation/:streamId',
    name: 'ChatDonation',
    component: ChatDonation
  },
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
      component: ChannelView,
      children: [
        {
          path: '',
          name: 'ChannelHome',
          component: HomeTab
        },
        {
          path: 'videos',
          name: 'ChannelVideos',
          component: VideosTab
        },
        {
          path: 'clips',
          name: 'ChannelClips',
          component: ClipsTab
        },
        {
          path: 'community',
          name: 'ChannelCommunity',
          component: CommunityTab
        },
        {
          path: 'community/detail/:postId',
          name: 'CommunityDetail',
          component: CommunityDetail
        },
        {
          path: 'info',
          name: 'ChannelInfo',
          component: InfoTab
        }
      ]
    },
    {
      path: '/channel/setting/:memberId',
      name: 'ChannelSetting',
      component: ChannelSettingView
    }
  ];