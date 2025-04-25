import StreamerLayout from "@/layouts/StreamerLayout.vue";
import BlockList from "@/views/StreamerSettings/BlockList.vue";
import BroadcastSetting from "@/views/StreamerSettings/BroadcastSetting.vue";
import DoBroadcast from "@/views/StreamerSettings/DoBroadcast.vue";
import FollowerManagement from "@/views/StreamerSettings/FollowerManagement.vue";
import ManagerList from "@/views/StreamerSettings/ManagerList.vue";
import StreamerDashboard from "@/views/StreamerSettings/StreamerDashboard.vue";

export default [
    {
      path: '/streamer/:memberId',
      component: StreamerLayout, // 레이아웃 지정
      meta: { requiresStreamer: true }, // 권한 필요
      children: [
        {
            path: 'dashboard',
            name: 'StreamerDashboard',
            component: StreamerDashboard
        },
        {
            path: 'broadcastSetting',
            name: 'BroadcastSetting',
            component: BroadcastSetting
        },
        {
            path: 'doBroadcast',
            name: 'DoBroadcast',
            component: DoBroadcast
        },
        {
            path: 'followerManagement',
            name: 'FollowerManagement',
            component: FollowerManagement
        },
        {
            path: 'managerList',
            name: 'ManagerList',
            component: ManagerList
        },
        // 지워질지도 모르는 날파리같은 존재임임
        {
            path: 'blockList',
            name: 'BlockList',
            component: BlockList
        },
        
      ]
    }
  ];