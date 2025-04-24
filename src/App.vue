<template>
  <v-app>
    <HeaderComponent v-if="!isStreamerRoute" @toggle-mini="toggleMini"/>
    <SidebarComponent v-if="!isStreamerRoute" :mini="mini" />
    <v-main class="main-content">
      <router-view/>
    <FooterComponent v-if="!isStreamerRoute"/>
    </v-main>
  </v-app>
</template>

<script>
import SidebarComponent from '@/components/SidebarComponent.vue';
import HeaderComponent from '@/components/HeaderComponent.vue';
import FooterComponent from "@/components/FooterComponent.vue";

export default {
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
.v-application {
  background-color: #121212 !important;
  color: white;
}

.main-content {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox에서 스크롤바 숨기기 */
  -ms-overflow-style: none; /* IE와 Edge에서 스크롤바 숨기기 */
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