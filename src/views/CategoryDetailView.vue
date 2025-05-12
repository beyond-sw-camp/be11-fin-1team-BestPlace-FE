ㄴㄴ<template>
  <div class="category-detail-wrapper">
    <!-- 카테고리 헤더 섹션 -->
    <div class="category-header">
      <div class="category-image">
        <img :src="categoryImage" alt="Category Image" v-if="categoryImage">
      </div>
      <div class="category-info">
        <h1 class="category-name">{{ displayName }}</h1>
      </div>
    </div>

    <!-- 탭 메뉴 -->
    <div class="tab-container">
      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.value" 
          :class="['tab-btn', { active: activeTab === tab.value }]"
          @click="setActiveTab(tab.value)"
          type="button"
        >
          {{ tab.text }}
        </button>
      </div>
    </div>

    <!-- 정렬 옵션 (동영상 탭에서만 표시) -->
    <div class="sort-container" v-if="activeTab === 'video'">
      <div class="sort-options">
        <button 
          :class="['sort-btn', { active: sortOption === 'views' }]" 
          @click="setSortOption('views')"
        >
          인기순
        </button>
        <button 
          :class="['sort-btn', { active: sortOption === 'recent' }]" 
          @click="setSortOption('recent')"
        >
          최신순
        </button>
      </div>
    </div>

    <!-- 정렬 옵션 (클립 탭에서만 표시) -->
    <div class="filter-bar" v-if="activeTab === 'clip'">
      <div class="filter-left">
        <button 
          v-for="period in periods" 
          :key="period.value"
          :class="['sort-btn', { active: selectedPeriod === period.value }]" 
          @click="selectedPeriod = period.value; resetAndLoadClips()"
        >
          {{ period.text }}
        </button>
      </div>
      <div class="filter-right">
        <button 
          :class="['sort-btn', { active: selectedSort === 'popular' }]" 
          @click="selectedSort = 'popular'; resetAndLoadClips()"
        >
          인기순
        </button>
        <button 
          :class="['sort-btn', { active: selectedSort === 'recent' }]" 
          @click="selectedSort = 'recent'; resetAndLoadClips()"
        >
          최신순
        </button>
      </div>
    </div>

    <!-- 정렬 옵션 (라이브 탭에서만 표시) -->
    <div class="sort-container" v-if="activeTab === 'live'">
      <div class="sort-options">
        <button 
          :class="['sort-btn', { active: liveSortOption === 'views' }]" 
          @click="setLiveSortOption('views')"
        >
          인기순
        </button>
        <button 
          :class="['sort-btn', { active: liveSortOption === 'recent' }]" 
          @click="setLiveSortOption('recent')"
        >
          최신순
        </button>
      </div>
    </div>

    <!-- 동영상 목록 (동영상 탭에서만 표시) -->
    <div class="videos-grid" v-if="activeTab === 'video' && videos.length > 0">
      <div 
        v-for="(video, index) in videos" 
        :key="index" 
        class="video-item"
        @mouseenter="startPreviewTimer(index)"
        @mouseleave="stopPreview(index)"
        @click="handleVideoClick(video)"
      >
        <div class="thumbnail-container">
          <img 
            :src="video.thumbnailUrl" 
            alt="Video Thumbnail" 
            class="thumbnail"
            :class="{
              'blur-thumbnail': shouldBlurThumbnail(video),
              'hide-thumbnail': shouldHideThumbnail(video)
            }"
          >
          <video 
            v-if="video.showPreview && video.videoUrl && !shouldHideThumbnail(video) && video.isAdult !== 'Y'" 
            :src="video.videoUrl" 
            class="video-preview" 
            autoplay 
            muted 
            loop
          ></video>
          <div class="duration">{{ video.duration }}</div>
          
          <!-- 연령 제한 표시 -->
          <div v-if="isAdultContent(video)" class="age-restriction-overlay">
            <div class="age-restriction-content">
              <div class="age-icon-circle">19</div>
              <div class="age-text">연령 제한</div>
            </div>
          </div>
        </div>
        <div class="video-info">
          <div class="video-title">{{ video.title }}</div>
          <div class="streamer-info">
            <img :src="video.streamerProfileImageUrl || defaultProfileImage" alt="Streamer Profile" class="profile-image">
            <div class="streamer-detail">
              <div class="streamer-name">{{ video.streamerNickname }}</div>
              <div class="video-time">{{ formatTime(video.createdTime) }}</div>
            </div>
          </div>
          <div v-if="video.hashtags && video.hashtags.length > 0" class="hashtags">
            <span v-for="(tag, i) in video.hashtags" :key="i" class="hashtag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 방송 목록 (라이브 탭에서만 표시) -->
    <div class="broadcasts-grid" v-if="activeTab === 'live' && broadcasts.length > 0">
      <div 
        v-for="(broadcast, index) in broadcasts" 
        :key="index" 
        class="broadcast-item"
        @click="handleBroadcastClick(broadcast)"
        @mouseenter="startBroadcastPreviewTimer(index)"
        @mouseleave="stopBroadcastPreview(index)"
      >
        <div class="thumbnail-container">
          <img 
            :src="broadcast.thumbnailUrl" 
            alt="Broadcast Thumbnail" 
            class="thumbnail"
            :class="{
              'blur-thumbnail': shouldBlurThumbnail(broadcast),
              'hide-thumbnail': shouldHideThumbnail(broadcast)
            }"
          >
          <video 
            v-if="broadcast.showPreview && broadcast.streamKey && !shouldHideThumbnail(broadcast) && broadcast.adultYn !== 'Y'" 
            :src="`https://bestplace-media.s3.ap-northeast-2.amazonaws.com/video/${broadcast.streamKey}/preview.mp4`" 
            class="video-preview" 
            autoplay 
            muted 
            loop
          ></video>
          <div class="live-indicator">LIVE</div>
          <div class="viewer-count">
            <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
            {{ broadcast.viewerCount }}명
          </div>
          
          <!-- 연령 제한 표시 -->
          <div v-if="broadcast.adultYn === 'Y'" class="age-restriction-overlay">
            <div class="age-restriction-content">
              <div class="age-icon-circle">19</div>
              <div class="age-text">연령 제한</div>
            </div>
          </div>
        </div>
        <div class="broadcast-info">
          <div class="broadcast-title">{{ broadcast.title }}</div>
          <div class="streamer-info">
            <img :src="broadcast.streamerProfileUrl || defaultProfileImage" alt="Streamer Profile" class="profile-image">
            <div class="streamer-detail">
              <div class="streamer-name">{{ broadcast.streamerNickname }}</div>
              <div class="tags-container">
                <div v-if="broadcast.hashTag && broadcast.hashTag.length > 0" class="hashtags">
                  <span v-for="(tag, i) in broadcast.hashTag" :key="i" class="hashtag">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 클립 목록 (클립 탭에서만 표시) -->
    <div v-if="activeTab === 'clip'" class="clips-content">      
      <!-- 클립 그리드 -->
      <div class="clips-grid" v-if="clips.length > 0">
        <div 
          v-for="clip in clips" 
          :key="clip.id" 
          class="clip-item"
          @click="handleClipClick(clip)"
        >
          <!-- 썸네일 컨테이너 -->
          <div class="thumbnail-container">
            <img 
              :src="clip.thumbnailUrl" 
              alt="Clip Thumbnail" 
              class="thumbnail"
              :class="{
                'blur-thumbnail': shouldBlurThumbnail(clip),
                'hide-thumbnail': shouldHideThumbnail(clip)
              }"
            >
            
            <!-- 연령 제한 표시 -->
            <div v-if="clip.isAdult === 'Y'" class="age-restriction-overlay">
              <div class="age-restriction-content">
                <div class="age-icon-circle">19</div>
                <div class="age-text">연령 제한</div>
              </div>
            </div>
            
            <!-- 텍스트 오버레이 -->
            <div class="clip-info-overlay">
              <div class="clip-title">{{ clip.title }}</div>
              <div class="clip-meta">
                <span class="streamer-name">{{ clip.streamerNickname }}</span>
                <span class="view-count">
                  <v-icon size="x-small" class="mr-1">mdi-eye</v-icon>
                  {{ formatNumber(clip.views) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 데이터 없음 표시 -->
      <v-card v-if="clips.length === 0 && !loading" class="empty-card">
        <v-card-text class="text-center pa-6">
          <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
          <h3 class="mb-2">클립이 없습니다</h3>
          <p>이 카테고리에 등록된 클립이 없습니다.</p>
        </v-card-text>
      </v-card>
    </div>

    <!-- 로딩 표시 -->
    <div v-if="loading" class="loading-container">
      <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
    </div>
    
    <!-- 데이터 없음 표시 -->
    <v-card v-if="(activeTab === 'live' && broadcasts.length === 0 && !loading) || 
                  (activeTab === 'video' && videos.length === 0 && !loading)" 
           class="empty-card">
      <v-card-text class="text-center pa-6">
        <v-icon size="64" color="#B084CC" class="mb-4">mdi-television</v-icon>
        <h3 class="mb-2">{{ activeTab === 'live' ? '방송이 없습니다' : '동영상이 없습니다' }}</h3>
        <p>{{ activeTab === 'live' ? '이 카테고리에 등록된 방송이 없습니다.' : '이 카테고리에 등록된 동영상이 없습니다.' }}</p>
      </v-card-text>
    </v-card>

    <!-- 무한 스크롤 감지 요소 -->
    <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    
    <!-- 미성년자/비로그인 사용자 알림 모달 -->
    <v-dialog v-model="adultAlertModalOpen" max-width="400" content-class="adult-alert-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">연령 제한 컨텐츠</div>
          <v-btn icon @click="closeAdultAlertModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="adult-alert-icon">
            <div class="age-icon-circle modal-icon">19</div>
          </div>
          <p class="adult-alert-message" v-if="isLoggedIn">
            미성년자는 이용 불가능한 컨텐츠입니다.
          </p>
          <p class="adult-alert-message" v-else>
            이 컨텐츠는 성인만 이용할 수 있습니다.<br>
            로그인 후 성인인증이 필요합니다.
          </p>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            v-if="!isLoggedIn"
            color="#b084cc" 
            block 
            @click="goToLogin"
            class="submit-btn"
          >
            로그인하기
          </v-btn>
          <v-btn 
            v-else
            color="#b084cc" 
            block 
            @click="closeAdultAlertModal"
            class="submit-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

export default {
  name: 'CategoryDetailView',
  data() {
    return {
      displayName: '',
      categoryImage: '',
      activeTab: 'live',
      tabs: [
        { text: '라이브', value: 'live' },
        { text: '동영상', value: 'video' },
        { text: '클립', value: 'clip' }
      ],
      broadcasts: [],
      videos: [],
      clips: [],
      loading: false,
      sortOption: 'views', // 기본값은 인기순
      liveSortOption: 'views', // 라이브 탭 기본값은 인기순
      // 클립 탭 관련 데이터
      selectedPeriod: 'DAYS_7', // 초기값: 주간
      selectedSort: 'popular',   // 초기값: 인기순
      periods: [
        { text: '전체', value: 'ALL' },
        { text: '한달', value: 'DAYS_30' },
        { text: '주간', value: 'DAYS_7' },
        { text: '하루', value: 'HOURS_24' }
      ],
      sortOptions: {
        ALL: [
          { text: '인기순', value: 'popular' },
          { text: '최신순', value: 'recent' }
        ],
        others: [
          { text: '인기순', value: 'popular' },
          { text: '최신순', value: 'recent' }
        ]
      },
      page: 0,
      totalPages: 0,
      hasMoreVideos: true,
      observer: null,
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      // 성인 콘텐츠 관련 추가
      userIsAdult: false,
      isLoggedIn: false,
      adultAlertModalOpen: false,
      selectedVideo: null,
      selectedClip: null
    };
  },
  
  computed: {
    // 라우터 파라미터에서 카테고리 이름을 가져오는 computed 속성
    categoryName() {
      return this.$route.params.categoryName;
    },
    // 현재 선택된 기간에 따라 정렬 옵션 반환
    sorts() {
      return this.selectedPeriod === 'ALL' ? this.sortOptions.ALL : this.sortOptions.others;
    }
  },
  
  created() {
    console.log('라우터 파라미터:', this.$route.params);
    console.log('카테고리 이름:', this.categoryName);
    this.checkLoginStatus();
    
    // 초기에 현재 활성 탭에 대한 데이터 요청 설정
    if (this.activeTab === 'clip') {
      this.initClipDataLoading();
    }
  },
  
  mounted() {
    this.fetchCategoryDetail().then(() => {
      // 카테고리 세부 정보를 가져온 후 필요한 데이터 로드
      if (this.activeTab === 'video') {
        this.fetchVideos();
      } else if (this.activeTab === 'clip') {
        this.initClipDataLoading();
      } else if (this.activeTab === 'live') {
        this.fetchLiveStreams();
      }
    });
    this.setupInfiniteScroll();
  },

  beforeUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  
  watch: {
    activeTab(newTab) {
      console.log('탭 변경됨:', newTab);
      if (newTab === 'video' && this.videos.length === 0) {
        this.page = 0;
        this.hasMoreVideos = true;
        this.fetchVideos();
      } else if (newTab === 'clip') {
        // 클립 탭으로 변경될 때마다 데이터 확인 및 로드
        this.initClipDataLoading();
      } else if (newTab === 'live' && this.broadcasts.length === 0) {
        // 라이브 탭으로 변경될 때 데이터 로드
        this.fetchLiveStreams();
      }
    },
    sortOption() {
      this.page = 0;
      this.videos = [];
      this.hasMoreVideos = true;
      this.fetchVideos();
    },
    selectedPeriod() {
      // 기간이 변경되면 정렬 옵션도 변경되어야 하므로
      // 전체 <-> 나머지 간 전환 시 정렬 옵션을 초기값으로 설정
      if (this.selectedPeriod === 'ALL' && this.selectedSort === 'recent') {
        this.selectedSort = 'popular';
      }
      this.resetAndLoadClips();
    },
    selectedSort() {
      this.resetAndLoadClips();
    },
    liveSortOption() {
      // 라이브 정렬 옵션이 변경되면 데이터 다시 로드
      this.broadcasts = [];
      this.fetchLiveStreams();
    }
  },
  
  methods: {
    checkLoginStatus() {
      const token = localStorage.getItem('token');
      this.isLoggedIn = !!token;
      
      if (this.isLoggedIn) {
        try {
          const decoded = jwtDecode(token);
          if(decoded.isAdult === 'Y'){
            this.userIsAdult = true;
          } else {
            this.userIsAdult = false;
          }
        } catch (error) {
          console.error('토큰 디코딩 중 오류 발생:', error);
          this.userIsAdult = false;
        }
      }
    },

    async fetchCategoryDetail() {
      if (!this.categoryName) {
        console.error('유효하지 않은 카테고리 이름:', this.categoryName);
        return;
      }
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const url = `${apiUrl}/category/detail/${this.categoryName}`;
        console.log('요청 URL:', url);
        
        const response = await axios.get(url);
        console.log('응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const categoryData = response.data.result;
          this.displayName = categoryData.name;
          this.categoryImage = categoryData.image;
        }
      } catch (error) {
        console.error('카테고리 정보를 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },

    async fetchLivesbyViewer() {
      try{
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const url = `${apiUrl}/streaming/streamListViewer/${this.categoryName}`;
        console.log('요청 URL:', url);

        const response = await axios.get(url);
        console.log('응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          this.broadcasts = response.data.result.content.map(broadcast => ({
            ...broadcast,
            isAdult: broadcast.adultYn,
            showPreview: false,
            hoverTimer: null
          }));
        }
      }catch(error){
        console.error('라이브 목록을 불러오는 중 오류 발생:', error);
      }finally{
        this.loading = false;
      }
    },

    async fetchLivesbyStartTime() {
      try{
        const apiUrl = process.env.VUE_APP_STREAMING_API;
        const url = `${apiUrl}/streaming/streamListStartTime/${this.categoryName}`;
        console.log('요청 URL:', url);

        const response = await axios.get(url);
        console.log('응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          this.broadcasts = response.data.result.content.map(broadcast => ({
            ...broadcast,
            isAdult: broadcast.adultYn,
            showPreview: false,
            hoverTimer: null
          }));
        }
      }catch(error){
        console.error('라이브 목록을 불러오는 중 오류 발생:', error);
      }finally{
        this.loading = false;
      }
    },

    async fetchVideos() {
      if (this.loading || !this.hasMoreVideos) return;
      
      this.loading = true;
      
      try {
        const apiUrl = process.env.VUE_APP_MEMBER_API;
        const sortEndpoint = this.sortOption === 'views' ? 'views' : 'recent';
        const url = `${apiUrl}/video/vod/list/category/${sortEndpoint}`;
        
        const response = await axios.get(url, {
          params: {
            page: this.page,
            category: this.displayName
          }
        });
        
        console.log('동영상 응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          const newVideos = result.content.map(video => ({
            ...video,
            showPreview: false,
            hoverTimer: null,
            videoUrl: video.url // API 응답에 url 필드가 있다고 가정합니다
          }));
          this.videos = [...this.videos, ...newVideos];
          this.totalPages = result.totalPages;
          this.hasMoreVideos = this.page < this.totalPages - 1;
          this.page++;
        }
      } catch (error) {
        console.error('동영상 목록을 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },
    
    setActiveTab(tab) {
      this.activeTab = tab;
    },

    setSortOption(option) {
      this.sortOption = option;
    },

    setLiveSortOption(option) {
      this.liveSortOption = option;
    },

    setupInfiniteScroll() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      };
      
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !this.loading) {
          if (this.activeTab === 'video') {
            this.fetchVideos();
          } else if (this.activeTab === 'clip') {
            this.loadClips();
          }
        }
      }, options);
      
      if (this.$refs.infiniteScrollTrigger) {
        this.observer.observe(this.$refs.infiniteScrollTrigger);
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const date = new Date(timestamp);
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) {
        return `${diffInSeconds}초 전`;
      } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}분 전`;
      } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}시간 전`;
      } else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
      } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 604800)}주 전`;
      } else if (diffInSeconds < 31536000) {
        return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
      } else {
        return `${Math.floor(diffInSeconds / 31536000)}년 전`;
      }
    },

    formatHashtags(hashtags) {
      // 빈 값인 경우 처리
      if (!hashtags) return [];
      console.log('hashtags:', hashtags);
      // 문자열인 경우 처리
      if (typeof hashtags === 'string') {
        // ['클립', '테스트'] 형태인지 확인
        if (hashtags.startsWith('[') && hashtags.endsWith(']')) {
          try {
            // JSON 파싱 시도
            return JSON.parse(hashtags.replace(/'/g, '"'));
          } catch (e) {
            // 파싱 실패시 기본 형태로 분리
            const clean = hashtags.replace(/^\[|\]$/g, '').replace(/'/g, '').replace(/"/g, '');
            return clean.split(',').map(tag => tag.trim());
          }
        }
        // 일반 문자열이면 그대로 반환
        return [hashtags];
      }
      
      // 배열인 경우 그대로 반환
      if (Array.isArray(hashtags)) {
        return hashtags;
      }
      
      return [];
    },

    // 썸네일 미리보기 관련 메서드
    startPreviewTimer(index) {
      const video = this.videos[index];
      if (!video || !video.videoUrl) return;
      
      // 성인 컨텐츠인 경우 미리보기 시작하지 않음
      if (video.isAdult === 'Y') return;
      
      // 기존 타이머가 있으면 클리어
      if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
      }
      
      // 0.5초 후에 미리보기 표시
      video.hoverTimer = setTimeout(() => {
        video.showPreview = true;
      }, 500);
    },
    
    stopPreview(index) {
      const video = this.videos[index];
      if (!video) return;
      
      // 타이머가 있으면 클리어
      if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
        video.hoverTimer = null;
      }
      
      // 미리보기 숨기기
      video.showPreview = false;
    },

    // 성인 콘텐츠 관련 메서드
    isAdultContent(video) {
      return video.isAdult === 'Y';
    },
    
    shouldBlurThumbnail(video) {
      // 성인 컨텐츠이고, 로그인한 사용자가 성인인 경우 흐리게 표시
      return this.isAdultContent(video) && this.isLoggedIn && this.userIsAdult;
    },
    
    shouldHideThumbnail(video) {
      // 성인 컨텐츠이고, 로그인하지 않았거나 성인이 아닌 경우 숨김
      return this.isAdultContent(video) && (!this.isLoggedIn || !this.userIsAdult);
    },
    
    handleVideoClick(video) {
      if (video.isAdult === 'Y' && (!this.isLoggedIn || !this.userIsAdult)) {
        // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
        this.selectedVideo = video;
        this.adultAlertModalOpen = true;
      } else {
        // 아니면 동영상 페이지로 이동
        this.$router.push(`/vod/${video.id}`);
      }
    },
    
    closeAdultAlertModal() {
      this.adultAlertModalOpen = false;
      this.selectedVideo = null;
    },
    
    goToLogin() {
      this.closeAdultAlertModal();
      // 로그인 페이지로 이동
      this.$router.push('/member/login');
    },
    
    // 클립 데이터 초기 로딩 관리
    initClipDataLoading() {
      console.log('클립 데이터 초기화 확인. 현재 clips 수:', this.clips.length);
      // 클립 데이터가 없거나 명시적 새로고침인 경우 로드
      if (this.clips.length === 0) {
        console.log('클립 데이터 로드 시작');
        this.page = 0;
        this.hasMoreVideos = true;
        this.retryLoadClips(3); // 최대 3번 재시도
      }
    },
    
    // 클립 로드 메서드에 재시도 로직 추가
    async retryLoadClips(maxAttempts) {
      let attempts = 0;
      let success = false;
      
      while (attempts < maxAttempts && !success) {
        attempts++;
        try {
          console.log(`클립 로드 시도 ${attempts}/${maxAttempts}`);
          await this.loadClips();
          if (this.clips.length > 0) {
            console.log('클립 로드 성공!');
            success = true;
          } else {
            console.log('클립 데이터 없음. 재시도 중...');
            // 잠시 대기 후 재시도
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`클립 로드 시도 ${attempts} 실패:`, error);
          // 잠시 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (!success) {
        console.error('클립 로드 최대 시도 횟수 초과');
      }
    },
    
    async loadClips() {
      if (this.loading || !this.hasMoreVideos) return;
      
      this.loading = true;
      const apiUrl = process.env.VUE_APP_MEMBER_API;
      
      try {
        let endpoint;
        let params = {
          page: this.page,
          periodType: this.selectedPeriod,
          category: this.displayName
        };
        
        if (this.selectedSort === 'popular') {
          endpoint = `${apiUrl}/video/clip/list/category/views`;
        } else if (this.selectedSort === 'recent') {
          endpoint = `${apiUrl}/video/clip/list/category/recent`;
        }
        
        console.log('클립 요청 URL:', endpoint);
        console.log('클립 요청 파라미터:', params);
        
        const response = await axios.get(endpoint, { params });
        console.log('클립 응답 데이터:', response.data);
        
        if (response.data && response.data.result) {
          const result = response.data.result;
          this.clips = [...this.clips, ...result.content];
          this.totalPages = result.totalPages;
          this.hasMoreVideos = this.page < this.totalPages - 1;
          this.page++;
          console.log('로드된 클립 수:', this.clips.length);
        } else {
          console.warn('클립 응답에 결과 데이터가 없음');
        }
      } catch (error) {
        console.error('클립 로드 중 오류 발생:', error);
        throw error; // 재시도를 위해 오류 다시 발생
      } finally {
        this.loading = false;
      }
    },
    
    resetAndLoadClips() {
      this.clips = [];
      this.page = 0;
      this.hasMoreVideos = true;
      this.retryLoadClips(3);
    },
    
    formatNumber(num) {
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
      } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + '천';
      }
      return num.toString();
    },
    
    handleClipClick(clip) {
      if (clip.isAdult === 'Y' && (!this.isLoggedIn || !this.userIsAdult)) {
        // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
        this.selectedClip = clip;
        this.adultAlertModalOpen = true;
      } else {
        // 아니면 클립 페이지로 이동
        this.$router.push(`/clip/${clip.id}`);
      }
    },

    async fetchLiveStreams() {
      this.loading = true;
      
      try {
        if (this.liveSortOption === 'views') {
          await this.fetchLivesbyViewer();
        } else {
          await this.fetchLivesbyStartTime();
        }
      } catch (error) {
        console.error('라이브 방송 목록을 불러오는 중 오류 발생:', error);
      } finally {
        this.loading = false;
      }
    },

    handleBroadcastClick(broadcast) {
      // 성인 컨텐츠 처리
      if (broadcast.adultYn === 'Y' && (!this.isLoggedIn || !this.userIsAdult)) {
        this.adultAlertModalOpen = true;
      } else {
        // 방송 시청 페이지로 이동
        this.$router.push(`/live/${broadcast.streamId}`);
      }
    },

    // 방송 썸네일 미리보기 관련 메서드
    startBroadcastPreviewTimer(index) {
      const broadcast = this.broadcasts[index];
      if (!broadcast || !broadcast.streamKey) return;
      
      // 성인 컨텐츠인 경우 미리보기 시작하지 않음
      if (broadcast.adultYn === 'Y') return;
      
      // 기존 타이머가 있으면 클리어
      if (broadcast.hoverTimer) {
        clearTimeout(broadcast.hoverTimer);
      }
      
      // 0.5초 후에 미리보기 표시
      broadcast.hoverTimer = setTimeout(() => {
        broadcast.showPreview = true;
      }, 500);
    },
    
    stopBroadcastPreview(index) {
      const broadcast = this.broadcasts[index];
      if (!broadcast) return;
      
      // 타이머가 있으면 클리어
      if (broadcast.hoverTimer) {
        clearTimeout(broadcast.hoverTimer);
        broadcast.hoverTimer = null;
      }
      
      // 미리보기 숨기기
      broadcast.showPreview = false;
    },
  }
};
</script>

<style scoped>
.category-detail-wrapper {
  width: 100%;
  background-color: #141517;
  color: white;
  min-height: 100vh;
}

.category-header {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  margin-top: -15px;
}

.category-info {
  padding-top: 10px;
}

.category-name {
  font-size: 28px;
  font-weight: 500;
  margin-top: 15px;
  color: #ffffff;
}

.category-image {
  width: 180px;
  height: 240px;
  overflow: hidden;
  border-radius: 8px;
  margin-top: 15px;
}

.category-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tab-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 24px;
  border-bottom: 1px solid #2a2a2a;
  position: relative;
  z-index: 50;
}

.tabs {
  display: flex;
  gap: 20px;
  position: relative;
  z-index: 50;
}

.tab-btn {
  padding: 15px 5px;
  font-size: 16px;
  font-weight: 500;
  color: #aaaaaa;
  cursor: pointer !important;
  position: relative;
  z-index: 50;
  background: none;
  border: none;
  outline: none;
  pointer-events: auto;
}

.tab-btn.active {
  color: white;
  font-weight: 500;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #B084CC;
}

.sort-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 10px 24px 0 24px;
}

.sort-options {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.sort-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn.active {
  background: #B084CC;
  color: #fff;
}

.broadcasts-grid, .videos-grid {
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
}

.broadcast-item, .video-item {
  cursor: pointer;
  transition: transform 0.2s;
}

.broadcast-item:hover, .video-item:hover {
  transform: none;
}

.thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 8px;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.video-item:hover .thumbnail {
  opacity: 0.6;
}

.video-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 2;
}

.duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.replay-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #7f3dbd;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.adult-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #ff2e2e;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
  z-index: 2;
}

.broadcast-info, .video-info {
  padding: 10px 0;
}

.broadcast-title, .video-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #ffffff;
}

.streamer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.streamer-profile {
  flex-shrink: 0;
}

.profile-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  -o-object-fit: cover;
  object-fit: cover;
  cursor: pointer;
}

.live-badge {
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #ff2e2e;
  color: white;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 8px;
  font-weight: 500;
}

.streamer-name {
  font-size: 14px;
  color: #adb5bd;
  font-weight: 500;
}

.broadcast-time, .video-time {
  font-size: 12px;
  color: #6c757d;
}

.tags-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.category-badge {
  background-color: #B084CC;
  color: black;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  overflow: hidden;
  margin-top: 0;
}

.hashtag {
  font-size: 12px;
  color: #aaaaaa;
  background-color: transparent;
  padding: 1px 4px;
  border-radius: 4px;
  display: inline-block;
  border: 1px solid #aaaaaa;
}

.loading-container {
  display: flex;
  justify-content: center;
  margin: 40px 0;
}

.empty-card {
  background-color: #1A1B1E !important;
  color: white;
  border-radius: 12px;
  margin: 30px auto;
  max-width: 500px;
}

.empty-card h3 {
  color: white;
}

.empty-card p {
  color: #aaaaaa;
}

.infinite-scroll-trigger {
  height: 20px;
  width: 100%;
  margin-top: 20px;
}

/* 반응형 그리드 */
@media (max-width: 1200px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .broadcasts-grid, .videos-grid {
    grid-template-columns: repeat(1, 1fr);
  }
  
  .category-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .category-image {
    margin-top: 20px;
  }
}

.videos-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  max-width: 1920px;
  margin: 0 auto;
  padding: 10px 24px 24px 24px;
}

.video-item {
  background-color: #141517;
  border-radius: 8px;
  padding: 8px;
  overflow: hidden;
}

.videos-grid .thumbnail-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 6px;
}

.videos-grid .thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  margin: 6px 0;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.profile-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  -o-object-fit: cover;
  object-fit: cover;
  cursor: pointer;
}

.streamer-name {
  font-size: 12px;
  color: #adb5bd;
  font-weight: 500;
}

.video-time {
  font-size: 11px;
  color: #6c757d;
}

.hashtags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.age-restriction-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  border-radius: 8px;
}

.age-restriction-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.age-icon-circle {
  width: 48px;
  height: 48px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: 10px;
}

.age-text {
  color: white;
  font-size: 16px;
  font-weight: 500;
}

.blur-thumbnail {
  filter: blur(3px);
  opacity: 0.9;
}

.hide-thumbnail {
  opacity: 0;
}

/* 모달 스타일 */
.adult-alert-modal {
  background: transparent !important;
  box-shadow: none !important;
}

.modal-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

.modal-content {
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.adult-alert-icon {
  margin-bottom: 20px;
}

.modal-icon {
  width: 60px;
  height: 60px;
  font-size: 24px;
}

.adult-alert-message {
  font-size: 16px;
  line-height: 1.6;
  color: #eee;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
  text-transform: none;
}

.clips-content {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 24px;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
}

.filter-btn {
  background-color: #222222 !important;
  color: #aaaaaa !important;
  min-width: 60px;
  font-size: 14px;
  letter-spacing: 0;
  text-transform: none;
  border-radius: 20px !important;
  box-shadow: none !important;
}

.filter-btn.active {
  background-color: #B084CC !important;
  color: white !important;
  font-weight: 500;
}

.clip-card {
  background-color: #0F0F0F !important;
  border-radius: 12px;
  overflow: hidden;
  transition: none !important;
  height: 100%;
  margin-bottom: 24px;
  box-shadow: none !important;
}

.clip-card:hover {
  transform: none !important;
  box-shadow: none !important;
}

.clips-content .thumbnail-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  aspect-ratio: 9 / 16;
  background-color: #000;
}

.clips-content .thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center center;
  background-color: #000;
}

.clip-info-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 2;
  pointer-events: none;
}

.clip-title {
  color: #ffffff;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
  text-shadow: none;
}

.clip-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clip-meta .streamer-name, .view-count {
  color: #ffffff;
  font-size: 11px;
  display: flex;
  align-items: center;
  text-shadow: none;
}

.age-icon-circle {
  width: 36px;
  height: 36px;
  background-color: rgba(255, 255, 255, 0.9);
  color: black;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  margin-bottom: 8px;
}

.age-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

/* 추가 스타일 - Vuetify 카드 효과 무효화 */
.v-card--hover {
  box-shadow: none !important;
}

.v-card {
  box-shadow: none !important;
}

.v-card:hover {
  box-shadow: none !important;
}

.v-card::before,
.v-card::after {
  display: none !important;
}

/* 툴팁 비활성화 */
.v-tooltip {
  display: none !important;
}

.clips-content .sort-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 15px;
}

.clips-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 20px;
  width: 100%;
  max-width: 1920px;
  margin: 10px auto 0 auto;
  padding: 0;
}

.clip-item {
  cursor: pointer;
  background-color: #18191c;
  border-radius: 8px;
  overflow: hidden;
  padding: 0;
}

.sort-options-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left-options {
  display: flex;
  gap: 8px;
}

.right-options {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.filter-bar {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 10px 24px 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  gap: 15px;
}

.filter-right {
  display: flex;
  gap: 15px;
}

.sort-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  background: #2c2c2c;
  color: #7B7B7B;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-btn.active {
  background: #B084CC;
  color: #fff;
}

.broadcasts-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  max-width: 1920px;
  margin: 0 auto;
  padding: 10px 24px 24px 24px;
}

.broadcast-item {
  background-color: #141517;
  border-radius: 8px;
  padding: 8px;
  overflow: hidden;
}

.live-indicator {
  position: absolute;
  top: 8px;
  left: 8px;
  background-color: #ff2e2e;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  z-index: 2;
}

.viewer-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  z-index: 2;
}

.category-badge {
  background-color: #B084CC;
  color: black;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  display: inline-block;
}

/* 라이브 탭 프로필 이미지 스타일 */
.broadcast-item .profile-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}

/* 동영상 탭 프로필 이미지 스타일 */
.video-item .profile-image {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  flex-shrink: 0;
}
</style>

