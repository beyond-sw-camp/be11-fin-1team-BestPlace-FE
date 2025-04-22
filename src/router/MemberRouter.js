import GoogleRedirect from '@/components/GoogleRedirect.vue';
import NaverRedirect from '@/components/NaverRedirect.vue';
import LoginPage from '@/views/loginPage.vue';
import MyBerry from '@/views/MyBerry.vue';
import MyClipView from '@/views/MyClipView.vue';

export default [
  {
    path: '/member/login',
    name: 'MemberLogin',
    component: LoginPage
  },
  {
      path: "/member/google/redirect",
      component: GoogleRedirect
  },
  {
      path: "/member/naver/redirect",
      component: NaverRedirect
  },
  {
    path: "/member/my/berry",
    component: MyBerry
  },
  {
    path: "/member/my/clip",
    component: MyClipView
  },
];