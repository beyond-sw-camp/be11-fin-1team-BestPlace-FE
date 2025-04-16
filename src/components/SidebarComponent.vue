<template>
  <v-navigation-drawer app permanent width="240" color="surface" class="sidebar">
    <div class="sidebar-content">
      <v-list dense>
        <v-list-item to="/lives" class="sidebar-item">
          <template v-slot:prepend>
            <v-icon>mdi-video</v-icon>
          </template>
          <template v-slot:title>
            <span>전체 방송</span>
          </template>
        </v-list-item>
        <v-list-item to="/clips" class="sidebar-item">
          <template v-slot:prepend>
            <v-icon>mdi-video-box</v-icon>
          </template>
          <template v-slot:title>
            <span>인기 클립</span>
          </template>
        </v-list-item>
        <v-list-item to="/category" class="sidebar-item">
          <template v-slot:prepend>
            <v-icon>mdi-tag-multiple</v-icon>
          </template>
          <template v-slot:title>
            <span>카테고리</span>
          </template>
        </v-list-item>
        <v-list-item to="/following" class="sidebar-item">
          <template v-slot:prepend>
            <v-icon>mdi-star</v-icon>
          </template>
          <template v-slot:title>
            <span>팔로잉</span>
          </template>
        </v-list-item>

        <v-divider class="my-4"></v-divider>

        <v-list-subheader>팔로잉 채널</v-list-subheader>
        <div v-if="loading" class="text-center py-2">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        </div>
        <div v-else-if="followedChannels.length === 0" class="text-center pa-2 text-caption">
          팔로우한 채널이 없습니다
        </div>
        <v-list-item
            v-for="channel in followedChannels"
            :key="channel.id"
            :to="`/channel/${channel.id}`"
            class="followed-channel"
        >
          <template v-slot:prepend>
            <!-- 원형 아바타 추가 -->
            <v-avatar size="28" class="channel-avatar">
              <v-img :src="channel.profileImage || '/default-profile.png'" alt="채널 이미지"></v-img>
            </v-avatar>
          </template>
          <template v-slot:title>
            <span class="text-truncate">{{ channel.name }}</span>
          </template>
          <template v-slot:append>
            <v-chip
                v-if="channel.isLive"
                color="error"
                size="x-small"
                class="px-1"
            >
              LIVE
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
    </div>
  </v-navigation-drawer>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      followedChannels: [],
      loading: true
    };
  },

  methods: {
    async fetchFollowedChannels() {
      try {
        this.loading = true;
        // API 요청 헤더에 X-User-Id 추가
        const userId = localStorage.getItem('userId') || '';

        const response = await axios.get('/follow/list', {
          headers: {
            'X-User-Id': userId
          }
        });

        if (response.data && response.data.result) {
          // 팔로우 리스트를 가져와서 채널 정보로 변환
          this.followedChannels = response.data.result.map(channel => {
            return {
              id: channel.id,
              name: channel.name,
              profileImage: channel.profileImage,
              isLive: channel.isLive || false
            };
          });

          // // 테스트용 데이터 추가 (실제 사용 시 제거)
          // if (this.followedChannels.length < 5) {
          //   for (let i = 0; i < 20; i++) {
          //     this.followedChannels.push({
          //       id: 1000 + i,
          //       name: `테스트 채널 ${i+1}`,
          //       profileImage: '/default-profile.png',
          //       isLive: i % 3 === 0
          //     });
          //   }
          // }
        }
      } catch (error) {
        console.error('팔로우 채널 목록을 가져오는 중 오류 발생:', error);
        // 테스트용 데이터 추가 (실제 사용 시 제거)
        // this.followedChannels = Array.from({ length: 20 }, (_, i) => ({
        //   id: 1000 + i,
        //   name: `테스트 채널 ${i+1}`,
        //   profileImage: '/default-profile.png',
        //   isLive: i % 3 === 0
        // }));
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    // 컴포넌트가 마운트되면 팔로우 목록 가져오기
    this.fetchFollowedChannels();
  }
};
</script>

<style>
.sidebar {
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox에서 스크롤바 숨기기 */
  -ms-overflow-style: none; /* IE와 Edge에서 스크롤바 숨기기 */
  padding-right: 5px; /* 스크롤바 영역만큼 패딩 추가 */
}

/* 웹킷 기반 브라우저용 스크롤바 숨기기 */
.sidebar-content::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
}

.sidebar-item {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 16px;
}

.v-icon {
  font-size: 24px;
}

.v-list-item__title {
  font-size: 14px;
  text-align: left;
  margin-left: 16px;
}

.followed-channel {
  min-height: 40px;
  padding: 4px 16px;
  display: flex;
  align-items: center;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

/* 채널 아바타 스타일 */
.channel-avatar {
  margin-right: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* LIVE 라벨이 있는 채널의 아바타에 특별한 테두리 추가 */
.followed-channel:has(.v-chip) .channel-avatar {
  border: 1px solid #ff5252;
}
</style>