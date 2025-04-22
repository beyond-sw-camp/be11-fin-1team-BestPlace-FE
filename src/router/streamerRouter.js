import BlockList from "@/views/StreamerSettings/BlockList.vue";
import BroadcastSetting from "@/views/StreamerSettings/BroadcastSetting.vue";
import DoBroadcast from "@/views/StreamerSettings/DoBroadcast.vue";
import FollowerManagement from "@/views/StreamerSettings/FollowerManagement.vue";
import StreamerDashboard from "@/views/StreamerSettings/StreamerDashboard.vue";

export default [
    {
        path: '/streamer/dashboard',
        name: 'StreamerDashboard',
        component: StreamerDashboard
    },
    {
        path: '/streamer/broadcastSetting',
        name: 'BroadcastSetting',
        component: BroadcastSetting
    },
    {
        path: '/streamer/blockList',
        name: 'BlockList',
        component: BlockList
    },
    {
        path: '/streamer/doBrodcast',
        name: 'doBrodcast',
        component: DoBroadcast
    },
    {
        path: '/streamer/followerManagement',
        name: 'followerManagement',
        component: FollowerManagement
    },
    
]