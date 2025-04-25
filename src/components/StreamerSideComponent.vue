<template>
    <v-navigation-drawer app color="#141517" dark permanent>
      <v-list dense nav>
        <!-- 대시보드 -->
        <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/dashboard` }" prepend-icon="mdi-view-dashboard">
          <v-list-item-title>대시보드</v-list-item-title>
        </v-list-item>        
  
        <!-- 방송 관리 -->
        <v-list-group>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-broadcast">
              <v-list-item-title>방송 관리</v-list-item-title>
            </v-list-item>
          </template>
          <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/doBroadcast` }">
            <v-list-item-title>방송하기</v-list-item-title>
          </v-list-item>
          <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/broadcastSetting` }">
            <v-list-item-title>방송 설정</v-list-item-title>
          </v-list-item>
        </v-list-group>
  
  
        <!-- 기타 카테고리 -->
        <v-list-group>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-account-group-outline">
              <v-list-item-title>시청자 관리</v-list-item-title>
            </v-list-item>
          </template>
          <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/followerManagement` }">
            <v-list-item-title>팔로우 관리</v-list-item-title>
          </v-list-item>
        </v-list-group>  
  
        <v-list-group>
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-shield-account">
              <v-list-item-title>채널/권한 관리</v-list-item-title>
            </v-list-item>
          </template>
          <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/managerList` }">
            <v-list-item-title>매니저 목록</v-list-item-title>
          </v-list-item>
        </v-list-group>
  
        <v-list-item :to="{ path: `/streamer/${$route.params.memberId}/info` }" prepend-icon="mdi-information-outline">
          <v-list-item-title>내정보</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
</template>
  
  <script>
  export default {
    name: 'StreamerSidebar'
  };
  </script>
  
  <style scoped>
  .v-list-item-title {
    font-weight: 500;
  }
  .v-navigation-drawer {
  border-right: none !important;
  }
  </style>
  