<!-- views/MyProfileView.vue -->
<template>
  <div class="channel-page">
    <!-- 상단 프로필 섹션 -->
    <profile-header :profile="userProfile"/>

    <!-- 탭 메뉴 -->
    <profile-tabs
        :activeTab="activeTab"
        @update:activeTab="activeTab = $event"
    />

    <!-- 탭 내용 -->
    <v-window v-model="activeTab" class="tab-content">
      <!-- 홈 탭 -->
      <v-window-item value="home">
        <profile-home-tab
            :recentPosts="recentCommunityPosts"
            :recentVideos="recentVideos"
            :recentClips="recentClips"
            :isLoading="isLoading"
            @switch-tab="activeTab = $event"
            @view-post="viewPostDetail"
            @view-video="viewVideoDetail"
            @view-clip="viewClipDetail"
        />
      </v-window-item>

      <!-- 동영상 탭 -->
      <v-window-item value="videos">
        <profile-videos-tab
            :videos="videos"
            :isLoading="videosLoading"
            :error="videosError"
            :hasMoreVideos="videos.length >= pageSize"
            :loadingMore="loadingMoreVideos"
            @load-more="loadMoreVideos"
            @view-video="viewVideoDetail"
            @retry="fetchVideos"
        />
      </v-window-item>

      <!-- 클립 탭 -->
      <v-window-item value="clips">
        <profile-clips-tab
            :clips="clips"
            :isLoading="clipsLoading"
            :error="clipsError"
            :hasMoreClips="clips.length >= pageSize"
            :loadingMore="loadingMoreClips"
            @load-more="loadMoreClips"
            @view-clip="viewClipDetail"
            @retry="fetchClips"
        />
      </v-window-item>

      <!-- 커뮤니티 탭 -->
      <v-window-item value="community">
        <profile-community-tab
            :posts="communityPosts"
            :isLoading="postsLoading"
            :error="postsError"
            :hasMorePosts="communityPosts.length >= pageSize"
            :loadingMore="loadingMorePosts"
            @load-more="loadMorePosts"
            @view-post="viewPostDetail"
            @create-post="navigateToCreatePost"
            @retry="fetchCommunityPosts"
        />
      </v-window-item>

      <!-- 정보 탭 -->
      <v-window-item value="about">
        <profile-about-tab :profile="userProfile"/>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import ProfileHeader from '@/components/profile/ProfileHeader.vue';
import ProfileTabs from '@/components/profile/Tabs/ProfileTabs.vue';
import ProfileHomeTab from '@/components/profile/Tabs/ProfileHomeTab.vue';
import ProfileVideosTab from '@/components/profile/Tabs/ProfileVideosTab.vue';
import ProfileClipsTab from '@/components/profile/Tabs/ProfileClipsTab.vue';
import ProfileCommunityTab from '@/components/profile/Tabs/ProfileCommunityTab.vue';
import ProfileAboutTab from '@/components/profile/Tabs/ProfileAboutTab.vue';
import axios from 'axios';

export default {
  name: 'MyProfileView',
  components: {
    ProfileHeader,
    ProfileTabs,
    ProfileHomeTab,
    ProfileVideosTab,
    ProfileClipsTab,
    ProfileCommunityTab,
    ProfileAboutTab
  },
  data() {
    return {
      activeTab: 'home',
      defaultAvatar: require('@/assets/default-avatar.png'),
      userProfile: {
        nickname: '',
        email: '',
        profileImage: '',
        bannerImg: null,
        followers: 0,
        following: 0,
        description: '',
        joinDate: '',
        totalViews: 0,
        berryBalance: 0,
        adult: '',
        gender: '',
        birthYear: '',
        streamer: ''
      },
      communityPosts: [], // 커뮤니티 게시물
      videos: [], // 동영상
      clips: [], // 클립
      isLoading: false, // 전체 로딩 상태
      postsLoading: false, // 게시물 로딩 상태
      postsError: null, // 게시물 에러 상태
      videosLoading: false, // 비디오 로딩 상태
      videosError: null, // 비디오 에러 상태
      clipsLoading: false, // 클립 로딩 상태
      clipsError: null, // 클립 에러 상태
      postPage: 0, // 게시물 페이지
      videoPage: 0, // 비디오 페이지
      clipPage: 0, // 클립 페이지
      pageSize: 9, // 페이지 크기
      loadingMorePosts: false, // 추가 게시물 로딩 중
      loadingMoreVideos: false, // 추가 비디오 로딩 중
      loadingMoreClips: false // 추가 클립 로딩 중
    };
  },
  computed: {
    // 홈 탭에 표시할 최근 게시물 (각 카테고리별로 최대 3개)
    recentCommunityPosts() {
      return this.communityPosts.slice(0, 3);
    },
    recentVideos() {
      return this.videos.slice(0, 3);
    },
    recentClips() {
      return this.clips.slice(0, 3);
    },
    // 모든 컨텐츠가 없는지 확인
    noContent() {
      return this.communityPosts.length === 0 && this.videos.length === 0 && this.clips.length === 0;
    }
  },
  watch: {
    // URL 쿼리 변화 감지
    '$route.query': {
      handler(query) {
        if (query.refresh === 'true') {
          // 새로고침 필요한 탭 확인
          if (query.tab) {
            this.activeTab = query.tab;
          }

          // 데이터 새로고침
          if (query.tab === 'community') {
            this.fetchCommunityPosts();
          } else if (query.tab === 'videos') {
            this.fetchVideos();
          } else if (query.tab === 'clips') {
            this.fetchClips();
          }

          // 쿼리 파라미터 제거 (히스토리에 남지 않게)
          this.$router.replace({
            path: this.$route.path,
            query: {}
          });
        }
      },
      immediate: true
    },
    // 탭 변경 감지
    activeTab(newTab) {
      if (newTab === 'community' && this.communityPosts.length === 0 && !this.postsLoading) {
        this.fetchCommunityPosts();
      } else if (newTab === 'videos' && this.videos.length === 0 && !this.videosLoading) {
        this.fetchVideos();
      } else if (newTab === 'clips' && this.clips.length === 0 && !this.clipsLoading) {
        this.fetchClips();
      } else if (newTab === 'home' && this.noContent && !this.isLoading) {
        this.fetchHomeData();
      }
    }
  },
  mounted() {
    this.fetchUserProfile();
    this.fetchHomeData();
  },
  methods: {
    async fetchUserProfile() {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        // API 호출 - 사용자 정보 가져오기
        const response = await axios.get(`http://localhost:8080/member-service/member/detail/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-User-Id': userId
          }
        });

        // 응답 처리
        if (response.data && response.data.result) {
          const userData = response.data.result;
          this.userProfile = {
            nickname: userData.name || '사용자',
            email: userData.email || '',
            profileImage: userData.profileImg || this.defaultAvatar,
            bannerImg: null, // 백엔드에서 제공하지 않는 정보
            followers: 0, // 백엔드에서 제공하지 않는 정보
            following: 0, // 백엔드에서 제공하지 않는 정보
            description: '안녕하세요! 저의 채널에 오신 것을 환영합니다.',
            joinDate: userData.createdTime ? new Date(userData.createdTime).toLocaleDateString('ko-KR') : '정보 없음',
            totalViews: 0, // 백엔드에서 제공하지 않는 정보
            berryBalance: userData.berryBalance || 0,
            adult: userData.adult || 'N',
            gender: userData.gender || '미설정',
            birthYear: userData.birthYear || '미설정',
            streamer: userData.streamer || 'N'
          };
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
      }
    },

    // 홈 탭 데이터 로드
    async fetchHomeData() {
      this.isLoading = true;

      try {
        // 병렬로 여러 종류의 컨텐츠 가져오기
        await Promise.all([
          this.fetchCommunityPosts(),
          this.fetchVideos(),
          this.fetchClips()
        ]);
      } catch (error) {
        console.error('홈 데이터 로드 중 오류:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // 커뮤니티 게시물 가져오기
    async fetchCommunityPosts() {
      if (this.postsLoading) return;

      this.postsLoading = true;
      this.postsError = null;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        // 백엔드 API 호출 - 사용자의 게시물 가져오기
        try {
          const response = await axios.get(
              `http://localhost:8080/member-service/post/community/${userId}/list`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'X-User-Id': userId
                },
                params: {
                  page: this.postPage,
                  size: this.pageSize
                }
              }
          );

          // 응답 처리
          if (response.data && response.data.result) {
            const posts = response.data.result || [];

            if (this.postPage === 0) {
              this.communityPosts = posts;
            } else {
              this.communityPosts = [...this.communityPosts, ...posts];
            }

            console.log('게시물 로드됨:', this.communityPosts);
          }
        } catch (error) {
          console.error('API 호출 오류:', error);

          // API 오류를 표시하지 않음(중요!)
          // this.postsError = '게시물을 불러오는 중 오류가 발생했습니다.';
        }
      } catch (error) {
        console.error('게시물 로드 중 오류:', error);
        if (this.postPage === 0) {
          this.communityPosts = [];
        }
      } finally {
        this.postsLoading = false;
        this.loadingMorePosts = false;
      }
    },

    // 비디오 가져오기
    async fetchVideos() {
      if (this.videosLoading) return;

      this.videosLoading = true;
      this.videosError = null;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        // 백엔드 API 호출 - VOD 목록 가져오기
        const response = await axios.get(
            `http://localhost:8080/member-service/videoPost/vod/list/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              },
              params: {
                page: this.videoPage,
                size: this.pageSize
              }
            }
        );

        // 응답 처리
        if (response.data && response.data.result) {
          const videos = response.data.result.content || [];

          if (this.videoPage === 0) {
            this.videos = videos;
          } else {
            this.videos = [...this.videos, ...videos];
          }
        }
      } catch (error) {
        console.error('동영상 로드 중 오류:', error);

        // API가 없는 경우 예시 데이터
        if (this.videoPage === 0) {
          this.videos = [];
        } else {
          this.videosError = '동영상을 불러오는 중 오류가 발생했습니다.';
        }
      } finally {
        this.videosLoading = false;
        this.loadingMoreVideos = false;
      }
    },

    // 클립 가져오기
    async fetchClips() {
      if (this.clipsLoading) return;

      this.clipsLoading = true;
      this.clipsError = null;

      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
          this.$router.push('/member/login');
          return;
        }

        // 백엔드 API 호출 - 클립 목록 가져오기
        const response = await axios.get(
            `http://localhost:8080/member-service/videoPost/clip/list/${userId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-User-Id': userId
              },
              params: {
                page: this.clipPage,
                size: this.pageSize
              }
            }
        );

        // 응답 처리
        if (response.data && response.data.result) {
          const clips = response.data.result.content || [];

          if (this.clipPage === 0) {
            this.clips = clips;
          } else {
            this.clips = [...this.clips, ...clips];
          }
        }
      } catch (error) {
        console.error('클립 로드 중 오류:', error);

        // API가 없는 경우 예시 데이터
        if (this.clipPage === 0) {
          this.clips = [];
        } else {
          this.clipsError = '클립을 불러오는 중 오류가 발생했습니다.';
        }
      } finally {
        this.clipsLoading = false;
        this.loadingMoreClips = false;
      }
    },

    // 게시물 상세 보기
    viewPostDetail(postId) {
      this.$router.push(`/post/community/detail/${postId}`);
    },

    // 비디오 상세 보기
    viewVideoDetail(videoId) {
      this.$router.push(`/video/vod/${videoId}`);
    },

    // 클립 상세 보기
    viewClipDetail(clipId) {
      this.$router.push(`/video/clip/${clipId}`);
    },

    // 게시물 작성 페이지로 이동
    navigateToCreatePost() {
      // 사용자 ID가 없는 경우 처리
      if (!localStorage.getItem('userId')) {
        console.error('사용자 ID가 없습니다.');
        return;
      }

      // localStorage에서 사용자 ID를 가져와 라우팅
      const userId = localStorage.getItem('userId');
      console.log('게시물 작성 페이지로 이동합니다. 사용자 ID:', userId);

      // 라우터 이동 시도 로그
      console.log('라우터 푸시 시도:', `/post/community/create/${userId}`);
      this.$router.push(`/post/community/create/${userId}`).then(() => {
        console.log('라우터 푸시 성공');
      }).catch(err => {
        console.error('라우터 푸시 실패:', err);
      });
    },

    // 더 많은 게시물 로드
    loadMorePosts() {
      this.postPage++;
      this.loadingMorePosts = true;
      this.fetchCommunityPosts();
    },

    // 더 많은 비디오 로드
    loadMoreVideos() {
      this.videoPage++;
      this.loadingMoreVideos = true;
      this.fetchVideos();
    },

    // 더 많은 클립 로드
    loadMoreClips() {
      this.clipPage++;
      this.loadingMoreClips = true;
      this.fetchClips();
    }
  }
};
</script>

<style scoped>
.channel-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.tab-content {
  background-color: #1e2029;
  min-height: 400px;
  border-radius: 0 0 8px 8px;
  margin-bottom: 24px;
}
</style>