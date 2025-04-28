<template>
  <v-app style="background-color: #141517;">
    <HeaderComponent v-if="!isStreamerRoute && !isClipCreateRoute" @toggle-mini="toggleMini"/>
    <SidebarComponent v-if="!isStreamerRoute && !isClipCreateRoute" :mini="mini" />
    <v-main style="background-color: #141517;" class="main-content">
      <router-view class="full-width"/>
      <FooterComponent v-if="!isStreamerRoute && !isClipCreateRoute"/>
    </v-main>
  </v-app>
</template>

<script>
import SidebarComponent from '@/components/SidebarComponent.vue';
import HeaderComponent from '@/components/HeaderComponent.vue';
import FooterComponent from "@/components/FooterComponent.vue";

export default {
  name: 'App',
  components: {
    FooterComponent,
    HeaderComponent,
    SidebarComponent,
  },
  data() {
    return {
      mini: false,
    };
  },
  computed: {
    isStreamerRoute() {
      return this.$route.path.startsWith("/streamer");
    },
    isClipCreateRoute() {
      return this.$route.path.startsWith("/video/clip/create/");
    }
  },
  methods: {
    toggleMini() {
      this.mini = !this.mini;
      console.log('Mini toggled:', this.mini);
    },
  },
};
</script>

<style>
html, body {
  background-color: #141517 !important;
  color: white;
}

.v-application {
  background-color: #141517 !important;
}

/* 공통 스타일 */
.v-theme--light {
  --v-theme-background: #141517 !important;
  --v-theme-surface: #1e2029 !important;
}

.main-content {
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox에서 스크롤바 숨기기 */
  -ms-overflow-style: none; /* IE와 Edge에서 스크롤바 숨기기 */
  display: flex;
  flex-direction: column;
}

.full-width {
  width: 100%;
}

/* 웹킷 기반 브라우저용 메인 영역 스크롤바 숨기기 */
.main-content::-webkit-scrollbar {
  display: none;
  width: 0;
  background: transparent;
}

/* 모든 스크롤바 숨기기 전역 스타일 */
*::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

* {
  scrollbar-width: none !important; /* Firefox */
  -ms-overflow-style: none !important; /* IE and Edge */
}

</style>