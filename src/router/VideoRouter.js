import VodDetailPage from "@/views/vodDetailPage.vue";
import CategoryDetailView from "@/views/CategoryDetailView.vue";
import ClipCreateView from "@/views/ClipCreateView.vue";

export default [
  {
    path: '/vod/:vodId',
    name: 'VOD',
    component: VodDetailPage
  },
  {
    path: '/category/:categoryName',
    name: 'Category',
    component: CategoryDetailView
  },
  {
    path: '/video/clip/create/:vodId',
    name: 'ClipCreate',
    component: ClipCreateView
  }
];