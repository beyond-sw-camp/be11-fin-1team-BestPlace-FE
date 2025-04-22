import VodDetailPage from "@/views/vodDetailPage.vue";
import CategoryDetailView from "@/views/CategoryDetailView.vue";

export default [
  {
    path: '/vod/:vodId',
    name: 'VOD',
    component: VodDetailPage
  },
  {
    path: '/category/:categoryId',
    name: 'Category',
    component: CategoryDetailView
  },
];