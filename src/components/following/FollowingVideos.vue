<template>
    <div class="following-videos-section">
        <EmptyFollowing v-if="isEmpty || hasError" />
        <template v-else>
            <div v-if="videos.length > 0" class="videos-grid">
                <div 
                    v-for="(video, index) in videos" 
                    :key="video.id"
                    class="video-item"
                    @mouseenter="startPreviewTimer(index)"
                    @mouseleave="stopPreview(index)"
                    @click="goToVideoDetail(video.id)"
                >
                    <div class="thumbnail-container">
                        <div class="vod-badge">다시보기</div>
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
                            v-if="video.showPreview && video.url && !shouldHideThumbnail(video) && video.isAdult !== 'Y'" 
                            :src="video.url" 
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
                        <div class="profile-row">
                            <div class="streamer-profile">
                                <img :src="video.streamerProfileImageUrl || defaultProfileImage" alt="Streamer Profile" class="profile-img">
                            </div>
                            <div class="video-details">
                                <div class="video-title">{{ video.title }}</div>
                                <div 
                                    class="streamer-nickname"
                                    @click.stop="goToStreamerProfile(video.streamerId)"
                                >{{ video.streamerNickname }}</div>
                                <div class="video-meta">
                                    <span class="view-count">조회수 {{ video.views || 0 }}회</span>
                                    <span class="dot-separator">·</span>
                                    <span class="video-time">{{ formatTime(video.createdTime) }}</span>
                                </div>
                                <!-- 태그 컨테이너 -->
                                <div class="tags-container">
                                    <!-- 카테고리 태그 -->
                                    <span 
                                        v-if="video.category" 
                                        class="category-tag"
                                        @click.stop="goToCategory(video.category)"
                                    >
                                        {{ video.category }}
                                    </span>
                                    
                                    <!-- 해시태그 목록 -->
                                    <span 
                                        v-for="(tag, i) in formatHashtags(video.hashtags)" 
                                        :key="i" 
                                        class="hashtag"
                                    >
                                        {{ tag }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 데이터 없음 표시 -->
            <div v-else class="empty-videos">
                <div class="empty-videos-content">
                    <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
                    <h3>팔로잉 중인 스트리머의 동영상이 없습니다</h3>
                    <p>관심있는 스트리머를 팔로우하시면 이곳에서 볼 수 있습니다.</p>
                </div>
            </div>
        </template>

        <!-- 로딩 표시 -->
        <div v-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
        </div>

        <!-- 무한 스크롤 감지용 요소 -->
        <div ref="infiniteScrollTrigger" class="infinite-scroll-trigger"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import EmptyFollowing from './EmptyFollowing.vue';

const router = useRouter();
const memberApi = process.env.VUE_APP_MEMBER_API;
const videos = ref([]);
const loading = ref(false);
const page = ref(0);
const hasMore = ref(true);
const defaultProfileImage = 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png';
const userIsAdult = ref(false);
const isLoggedIn = ref(false);
const observer = ref(null);
const infiniteScrollTrigger = ref(null);
const isEmpty = ref(false);
const hasError = ref(false);

// 팔로우 리스트 확인
const checkFollowingList = async () => {
    try {
        const response = await axios.get(`${memberApi}/follow/list`);
        console.log('팔로우 리스트 응답:', response.data);
        if (response.data.status_code === 200) {
            const followingList = response.data.result;
            isEmpty.value = !followingList || followingList.length === 0;
            console.log('팔로우 리스트 상태:', isEmpty.value);
        } else {
            hasError.value = true;
        }
    } catch (error) {
        console.error('팔로우 리스트 로딩 중 에러 발생:', error);
        hasError.value = true;
    }
};

// 비디오 데이터 가져오기
const fetchFollowingVideos = async () => {
    if (loading.value || !hasMore.value) return;
    
    loading.value = true;
    try {
        const url = `${memberApi}/video/vod/follow/streamer?page=${page.value}`;
        const response = await axios.get(url);
        
        if (response.data && response.data.result) {
            const result = response.data.result;
            
            // 받아온 데이터가 있는지 확인
            if (result.content && result.content.length > 0) {
                // 비디오 아이템에 필요한 속성 추가
                const newVideos = result.content.map(video => ({
                    ...video,
                    showPreview: false,
                    hoverTimer: null
                }));
                
                // 기존 비디오 목록에 추가
                videos.value = [...videos.value, ...newVideos];
                
                // 다음 페이지로 설정
                page.value++;
                
                // 더 불러올 데이터가 있는지 확인
                hasMore.value = !result.last;
            } else {
                hasMore.value = false;
            }
        }
    } catch (error) {
        console.error('팔로잉 비디오 목록을 불러오는 중 오류 발생:', error);
        hasMore.value = false;
    } finally {
        loading.value = false;
    }
};

// 무한 스크롤 설정
const setupInfiniteScroll = () => {
    observer.value = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !loading.value && hasMore.value) {
            fetchFollowingVideos();
        }
    }, { threshold: 0.1 });
    
    if (infiniteScrollTrigger.value) {
        observer.value.observe(infiniteScrollTrigger.value);
    }
};

const goToVideoDetail = (videoId) => {
    router.push(`/vod/${videoId}`);
};

const goToStreamerProfile = (streamerId) => {
    router.push(`/channel/${streamerId}`);
};

const goToCategory = (category) => {
    router.push(`/category/${category}`);
};

// 로그인 상태 및 성인 여부 확인
const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    isLoggedIn.value = !!token;
    
    if (isLoggedIn.value) {
        try {
            const decoded = jwtDecode(token);
            userIsAdult.value = decoded.isAdult === 'Y';
        } catch (error) {
            console.error('토큰 디코딩 중 오류 발생:', error);
            userIsAdult.value = false;
        }
    }
};

// 성인 컨텐츠 관련 함수
const isAdultContent = (video) => {
    return video.isAdult === 'Y';
};

const shouldBlurThumbnail = (video) => {
    return isAdultContent(video) && isLoggedIn.value && userIsAdult.value;
};

const shouldHideThumbnail = (video) => {
    return isAdultContent(video) && (!isLoggedIn.value || !userIsAdult.value);
};

// 시간 포맷팅
const formatTime = (timestamp) => {
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
};

// 썸네일 미리보기 관련 메서드
const startPreviewTimer = (index) => {
    const video = videos.value[index];
    if (!video || !video.url) return;
    
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
};

const stopPreview = (index) => {
    const video = videos.value[index];
    if (!video) return;
    
    // 타이머가 있으면 클리어
    if (video.hoverTimer) {
        clearTimeout(video.hoverTimer);
        video.hoverTimer = null;
    }
    
    // 미리보기 숨김
    video.showPreview = false;
};

// 해시태그 포맷팅
const formatHashtags = (hashtags) => {
    // 빈 값인 경우 처리
    if (!hashtags) return [];
    
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
};

onMounted(async () => {
    await checkFollowingList();
    console.log('팔로우 리스트 체크 후 상태:', { isEmpty: isEmpty.value, hasError: hasError.value });
    if (!isEmpty.value && !hasError.value) {
        checkLoginStatus();
        fetchFollowingVideos();
        setupInfiniteScroll();
    }
});

onUnmounted(() => {
    // observer 해제
    if (observer.value) {
        observer.value.disconnect();
    }
});
</script>

<style scoped>
.following-videos-section {
    width: 100%;
    position: relative;
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    margin: 0 auto;
    padding: 20px 0;
}

.video-item {
    cursor: pointer;
    background-color: #141517;
    border-radius: 8px;
    padding: 8px;
    overflow: hidden;
}

.thumbnail-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: 6px;
}

.vod-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #4b53e1;
    color: #fff;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: 3px;
    z-index: 2;
}

.thumbnail {
    position: relative;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
}

.video-item:hover .thumbnail {
    opacity: 0.7;
}

.blur-thumbnail {
    filter: blur(3px);
    opacity: 0.9;
}

.hide-thumbnail {
    opacity: 0;
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
    color: white;
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
}

.age-restriction-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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

.video-info {
    padding: 10px;
}

.video-title {
    font-size: 16px;
    font-weight: 500;
    color: #ffffff;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    margin-bottom: 6px;
}

.profile-row {
    display: flex;
    gap: 12px;
}

.streamer-profile {
    flex-shrink: 0;
}

.profile-img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
}

.video-details {
    flex: 1;
    padding-top: 2px;
}

.streamer-nickname {
    font-size: 14px;
    color: #adb5bd;
    margin-bottom: 4px;
    cursor: pointer;
}

.streamer-nickname:hover {
    text-decoration: underline;
    color: #B084CC;
}

.video-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: #adb5bd;
    margin-bottom: 6px;
}

.dot-separator {
    color: #adb5bd;
}

.tags-container {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    margin-top: 6px;
    max-height: 24px;
    overflow: hidden;
}

.category-tag {
    font-size: 12px;
    background-color: #B084CC;
    color: black;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
}

.hashtag {
    font-size: 12px;
    color: #aaaaaa;
    background-color: transparent;
    padding: 1px 6px;
    border-radius: 3px;
    display: inline-block;
    border: 1px solid #aaaaaa;
}

.loading-container {
    display: flex;
    justify-content: center;
    margin: 40px 0;
}

.infinite-scroll-trigger {
    height: 20px;
    width: 100%;
    margin-top: 20px;
}

.empty-videos {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 48px 0;
    text-align: center;
}

.empty-videos-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
}

.empty-videos-content h3 {
    color: #ffffff;
    font-size: 18px;
    font-weight: 500;
}

.empty-videos-content p {
    color: #aaaaaa;
    font-size: 14px;
}

@media (max-width: 1200px) {
    .videos-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 900px) {
    .videos-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .videos-grid {
        grid-template-columns: 1fr;
    }
}
</style>
