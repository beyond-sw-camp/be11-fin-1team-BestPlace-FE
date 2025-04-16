<template>
  <div class="channel-page">
    <!-- 상단 프로필 섹션 -->
    <div class="profile-header">
      <div class="profile-banner">
        <img v-if="userProfile.bannerImg" :src="userProfile.bannerImg" alt="배너 이미지">
      </div>

      <div class="profile-info">
        <div class="profile-avatar">
          <v-avatar size="100">
            <v-img :src="userProfile.profileImage || 'https://via.placeholder.com/100'" />
          </v-avatar>
        </div>

        <div class="profile-details">
          <h1>{{ userProfile.nickname || '사용자' }}</h1>
          <div class="follower-info">
            팔로워 {{ userProfile.followers || 0 }}명 · 프로필 보기 >
          </div>
          <div class="channel-description">
            {{ userProfile.email }}
          </div>
        </div>

        <div class="profile-actions">
          <v-btn color="primary" class="action-btn">
            <v-icon left>mdi-video</v-icon>
            방송하기
          </v-btn>

          <v-btn variant="outlined" class="action-btn">
            <v-icon>mdi-cog</v-icon>
            채널 관리
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 탭 메뉴 -->
    <div class="tab-container">
      <v-tabs v-model="activeTab" color="primary" class="channel-tabs">
        <v-tab value="home">홈</v-tab>
        <v-tab value="videos">동영상</v-tab>
        <v-tab value="clips">클립</v-tab>
        <v-tab value="community">커뮤니티</v-tab>
        <v-tab value="about">정보</v-tab>
      </v-tabs>

      <!-- 동영상 탭에 있으면 서브 필터 표시 -->
      <div v-if="activeTab === 'videos'" class="sub-filters">
        <v-chip-group>
          <v-chip class="filter-chip" variant="outlined" color="primary">전체</v-chip>
          <v-chip class="filter-chip" variant="outlined">지난 방송</v-chip>
          <v-chip class="filter-chip" variant="outlined">업로드한 영상</v-chip>
        </v-chip-group>
        <div class="sort-options">
          <span>최신순</span>
          <span class="sort-divider">•</span>
          <span>인기순</span>
        </div>
      </div>
    </div>

    <!-- 탭 내용 -->
    <v-window v-model="activeTab" class="tab-content">
      <!-- 홈 탭 -->
      <v-window-item value="home">
        <div v-if="isLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="noContent" class="no-content-container">
          <div class="no-content-icon">
            <v-icon size="100" color="grey-darken-1">mdi-video-off</v-icon>
          </div>
          <div class="no-content-message">
            콘텐츠가 없습니다
          </div>
        </div>

        <div v-else class="home-content pa-4">
          <!-- 커뮤니티 게시물 섹션 -->
          <div v-if="recentCommunityPosts.length > 0" class="section mb-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3>최근 게시물</h3>
              <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  @click="activeTab = 'community'"
              >
                더보기
              </v-btn>
            </div>

            <v-row>
              <v-col
                  v-for="post in recentCommunityPosts"
                  :key="post.id"
                  cols="12"
                  sm="6"
                  md="4"
              >
                <v-card
                    class="post-card"
                    @click="viewPostDetail(post.id)"
                >
                  <v-img
                      v-if="post.imageUrls && post.imageUrls.length > 0"
                      :src="post.imageUrls[0]"
                      height="140"
                      cover
                  ></v-img>

                  <v-card-title class="text-truncate">{{ post.title }}</v-card-title>

                  <v-card-text>
                    <p class="text-truncate-2">{{ post.content }}</p>
                    <div class="d-flex align-center mt-2">
                      <span class="text-caption">{{ formatDate(post.createdTime) }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 비디오 섹션 -->
          <div v-if="recentVideos.length > 0" class="section mb-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3>최근 동영상</h3>
              <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  @click="activeTab = 'videos'"
              >
                더보기
              </v-btn>
            </div>

            <v-row>
              <v-col
                  v-for="video in recentVideos"
                  :key="video.id"
                  cols="12"
                  sm="6"
                  md="4"
              >
                <v-card class="video-card">
                  <!-- 비디오 컨텐츠 -->
                  <v-img
                      :src="video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=동영상'"
                      height="140"
                      cover
                  >
                    <div class="position-absolute pa-2" style="bottom: 0; right: 0;">
                      <div class="video-duration">{{ formatDuration(video.duration) }}</div>
                    </div>
                  </v-img>

                  <v-card-title class="text-truncate">{{ video.title }}</v-card-title>

                  <v-card-text>
                    <div class="d-flex align-center mt-2">
                      <v-icon size="small" class="mr-1">mdi-eye</v-icon>
                      <span class="text-caption">{{ video.views }}</span>
                      <span class="text-caption ml-auto">{{ formatDate(video.createdTime) }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- 클립 섹션 -->
          <div v-if="recentClips.length > 0" class="section mb-6">
            <div class="d-flex align-center justify-space-between mb-4">
              <h3>인기 클립</h3>
              <v-btn
                  variant="text"
                  color="primary"
                  size="small"
                  @click="activeTab = 'clips'"
              >
                더보기
              </v-btn>
            </div>

            <v-row>
              <v-col
                  v-for="clip in recentClips"
                  :key="clip.id"
                  cols="12"
                  sm="6"
                  md="4"
              >
                <v-card class="clip-card">
                  <!-- 클립 컨텐츠 -->
                  <v-img
                      :src="clip.thumbnailUrl || 'https://via.placeholder.com/300x180?text=클립'"
                      height="140"
                      cover
                  >
                    <div class="position-absolute pa-2" style="bottom: 0; right: 0;">
                      <div class="video-duration">{{ formatDuration(clip.duration) }}</div>
                    </div>
                  </v-img>

                  <v-card-title class="text-truncate">{{ clip.title }}</v-card-title>

                  <v-card-text>
                    <div class="d-flex align-center mt-2">
                      <v-icon size="small" class="mr-1">mdi-heart</v-icon>
                      <span class="text-caption">{{ clip.likeCount }}</span>
                      <span class="text-caption ml-auto">{{ formatDate(clip.createdTime) }}</span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-window-item>

      <!-- 동영상 탭 -->
      <v-window-item value="videos">
        <div v-if="videosLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="videosError" class="text-center pa-6">
          <v-alert type="error">{{ videosError }}</v-alert>
          <v-btn color="primary" @click="fetchVideos" class="mt-4">다시 시도</v-btn>
        </div>

        <div v-else-if="videos.length === 0" class="no-content-container">
          <div class="no-content-icon">
            <v-icon size="100" color="grey-darken-1">mdi-video-off</v-icon>
          </div>
          <div class="no-content-message">
            영상이 하나도 없네요...
          </div>
          <v-btn color="primary" class="upload-btn" rounded>
            동영상 업로드
          </v-btn>
        </div>

        <div v-else class="videos-grid pa-4">
          <v-row>
            <v-col
                v-for="video in videos"
                :key="video.id"
                cols="12"
                sm="6"
                md="4"
            >
              <v-card
                  class="video-card"
                  @click="viewVideoDetail(video.id)"
              >
                <v-img
                    :src="video.thumbnailUrl || 'https://via.placeholder.com/300x180?text=동영상'"
                    height="180"
                    cover
                >
                  <div class="position-absolute pa-2" style="bottom: 0; right: 0;">
                    <div class="video-duration">{{ formatDuration(video.duration) }}</div>
                  </div>
                </v-img>

                <v-card-title class="text-truncate">{{ video.title }}</v-card-title>

                <v-card-text>
                  <div class="d-flex align-center mt-2">
                    <v-icon size="small" class="mr-1">mdi-eye</v-icon>
                    <span class="text-caption">{{ video.views }}</span>
                    <span class="text-caption ml-auto">{{ formatDate(video.createdTime) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div v-if="videos.length >= 9" class="text-center mt-4">
            <v-btn variant="outlined" @click="loadMoreVideos">더 보기</v-btn>
          </div>
        </div>
      </v-window-item>

      <!-- 클립 탭 -->
      <v-window-item value="clips">
        <div v-if="clipsLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="clipsError" class="text-center pa-6">
          <v-alert type="error">{{ clipsError }}</v-alert>
          <v-btn color="primary" @click="fetchClips" class="mt-4">다시 시도</v-btn>
        </div>

        <div v-else-if="clips.length === 0" class="no-content-container">
          <div class="no-content-icon">
            <v-icon size="100" color="grey-darken-1">mdi-video-box-off</v-icon>
          </div>
          <div class="no-content-message">
            클립이 하나도 없네요...
          </div>
          <v-btn color="primary" class="upload-btn" rounded>
            클립 만들기
          </v-btn>
        </div>

        <div v-else class="clips-grid pa-4">
          <v-row>
            <v-col
                v-for="clip in clips"
                :key="clip.id"
                cols="12"
                sm="6"
                md="4"
            >
              <v-card
                  class="clip-card"
                  @click="viewClipDetail(clip.id)"
              >
                <v-img
                    :src="clip.thumbnailUrl || 'https://via.placeholder.com/300x180?text=클립'"
                    height="180"
                    cover
                >
                  <div class="position-absolute pa-2" style="bottom: 0; right: 0;">
                    <div class="video-duration">{{ formatDuration(clip.duration) }}</div>
                  </div>
                </v-img>

                <v-card-title class="text-truncate">{{ clip.title }}</v-card-title>

                <v-card-text>
                  <div class="d-flex align-center mt-2">
                    <v-icon size="small" class="mr-1">mdi-heart</v-icon>
                    <span class="text-caption">{{ clip.likeCount }}</span>
                    <span class="text-caption ml-auto">{{ formatDate(clip.createdTime) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div v-if="clips.length >= 9" class="text-center mt-4">
            <v-btn variant="outlined" @click="loadMoreClips">더 보기</v-btn>
          </div>
        </div>
      </v-window-item>

      <!-- 커뮤니티 탭 -->
      <v-window-item value="community">
        <div v-if="postsLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="postsError" class="text-center pa-6">
          <v-alert type="error">{{ postsError }}</v-alert>
          <v-btn color="primary" @click="fetchCommunityPosts" class="mt-4">다시 시도</v-btn>
        </div>

        <div v-else-if="communityPosts.length === 0" class="no-content-container">
          <div class="no-content-icon">
            <v-icon size="100" color="grey-darken-1">mdi-forum-outline</v-icon>
          </div>
          <div class="no-content-message">
            게시물이 하나도 없네요...
          </div>
          <v-btn color="primary" class="upload-btn" rounded @click="navigateToCreatePost">
            게시물 작성
          </v-btn>
        </div>

        <div v-else class="posts-grid pa-4">
          <v-row>
            <v-col
                v-for="post in communityPosts"
                :key="post.id"
                cols="12"
                sm="6"
                md="4"
            >
              <v-card
                  class="post-card"
                  @click="viewPostDetail(post.id)"
              >
                <v-img
                    v-if="post.imageUrls && post.imageUrls.length > 0"
                    :src="post.imageUrls[0]"
                    height="180"
                    cover
                ></v-img>

                <v-card-title class="text-truncate">{{ post.title }}</v-card-title>

                <v-card-text>
                  <p class="text-truncate-2">{{ post.content }}</p>
                  <div class="d-flex align-center mt-2">
                    <v-icon size="small" class="mr-1">mdi-eye</v-icon>
                    <span class="text-caption">{{ post.views }}</span>

                    <v-icon size="small" class="ml-3 mr-1">mdi-heart</v-icon>
                    <span class="text-caption">{{ post.likeCount }}</span>

                    <span class="text-caption ml-auto">{{ formatDate(post.createdTime) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div v-if="communityPosts.length >= 9" class="text-center mt-4">
            <v-btn variant="outlined" @click="loadMorePosts">더 보기</v-btn>
          </div>
        </div>
      </v-window-item>

      <!-- 정보 탭 -->
      <v-window-item value="about">
        <v-card color="surface" class="pa-6">
          <v-card-text>
            <h3 class="mb-4">채널 정보</h3>
            <p class="mb-4">{{ userProfile.description || '아직 채널 설명이 없습니다.' }}</p>

            <h4 class="mb-2">통계</h4>
            <p>가입일: {{ userProfile.joinDate || '정보 없음' }}</p>
            <p>총 조회수: {{ userProfile.totalViews || 0 }}</p>
            <p>베리 잔액: {{ userProfile.berryBalance || 0 }}</p>
            <p>스트리머 여부: {{ userProfile.streamer === 'Y' ? '스트리머' : '일반 사용자' }}</p>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import axios from 'axios';

export default {
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
      pageSize: 9 // 페이지 크기
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
            const posts = response.data.result.content || [];

            if (this.postPage === 0) {
              this.communityPosts = posts;
            } else {
              this.communityPosts = [...this.communityPosts, ...posts];
            }

            console.log('게시물 로드됨:', this.communityPosts);
          }
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // API 오류를 무시하고 빈 배열로 설정
          if (this.postPage === 0) {
            this.communityPosts = [];
          }
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
        this.videosError = '동영상을 불러오는 중 오류가 발생했습니다.';

        // API가 없는 경우 예시 데이터
        if (this.videoPage === 0) {
          this.videos = [];
        }
      } finally {
        this.videosLoading = false;
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
        this.clipsError = '클립을 불러오는 중 오류가 발생했습니다.';

        // API가 없는 경우 예시 데이터
        if (this.clipPage === 0) {
          this.clips = [];
        }
      } finally {
        this.clipsLoading = false;
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

    // 날짜 포맷팅
    formatDate(dateString) {
      if (!dateString) return '';

      const date = new Date(dateString);
      const now = new Date();

      // 오늘 날짜인 경우
      if (date.toDateString() === now.toDateString()) {
        return `오늘 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 어제 날짜인 경우
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 일주일 이내인 경우
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (date > oneWeekAgo) {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        return `${days[date.getDay()]}요일 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      }

      // 그 외의 경우
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    },

    // 동영상 길이 포맷팅
    formatDuration(seconds) {
      if (!seconds) return '00:00';

      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);

      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
      }

      return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    },

    // 더 많은 게시물 로드
    loadMorePosts() {
      this.postPage++;
      this.fetchCommunityPosts();
    },

    // 더 많은 비디오 로드
    loadMoreVideos() {
      this.videoPage++;
      this.fetchVideos();
    },

    // 더 많은 클립 로드
    loadMoreClips() {
      this.clipPage++;
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

.profile-header {
  margin-bottom: 24px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #1e2029;
}

.profile-banner {
  height: 180px;
  background-color: #2d2d39;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info {
  padding: 20px;
  display: flex;
  align-items: flex-start;
}

.profile-avatar {
  margin-right: 20px;
}

.profile-details {
  flex: 1;
}

.profile-details h1 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #ffffff;
}

.follower-info {
  font-size: 14px;
  color: #c4bab4;
  margin-bottom: 8px;
}

.channel-description {
  font-size: 14px;
  color: #c4bab4;
}

.profile-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  min-width: auto;
}

.tab-container {
  background-color: #1e2029;
  border-radius: 8px 8px 0 0;
}

.channel-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sub-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.filter-chip {
  margin-right: 8px;
}

.sort-options {
  font-size: 14px;
  color: #c4bab4;
}

.sort-divider {
  margin: 0 8px;
}

.tab-content {
  background-color: #1e2029;
  min-height: 400px;
  border-radius: 0 0 8px 8px;
  margin-bottom: 24px;
}

.no-content-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
  text-align: center;
}

.no-content-icon {
  margin-bottom: 20px;
}

.no-content-message {
  font-size: 18px;
  color: #c4bab4;
  margin-bottom: 30px;
}

.upload-btn {
  min-width: 180px;
  font-size: 16px;
  height: 48px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.post-card, .video-card, .clip-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease;
}

.post-card:hover, .video-card:hover, .clip-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.posts-grid, .videos-grid, .clips-grid {
  min-height: 300px;
}

.section h3 {
  font-size: 20px;
  color: #ffffff;
}

.position-absolute {
  position: absolute;
}

.video-duration {
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
</style>