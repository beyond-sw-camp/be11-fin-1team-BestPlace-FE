import ChattingUrlComponent from "@/views/StreamerSettings/ChattingUrlComponent.vue";
import TransparentLayout from "@/layouts/TransparentLayout.vue";

export default [
  {
    path: '/chatting/:roomId',
    component: TransparentLayout,
    children: [
      {
        path: '',
        name: 'ChattingUrl',
        component: ChattingUrlComponent
      }
    ],
    meta: { 
      hideNav: true, // 네비게이션 바를 숨김
      transparent: true // 배경을 투명하게 설정
    }
  }
]; 