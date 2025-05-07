<template>
    <div class="following-all-videos-section">
        <!-- 섹션 헤더 -->
        <div class="section-header">
            <h2 class="section-title">최근 동영상</h2>
            <button v-if="videos.length > 8" class="see-all-btn" @click="$emit('see-all')">
                전체보기
            </button>
        </div>

        <div v-if="displayedVideos.length > 0" class="videos-grid">
            <div 
                v-for="(video, index) in displayedVideos" 
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
        <v-card v-if="videos.length === 0 && !loading" class="empty-card">
            <v-card-text class="text-center pa-6">
                <v-icon size="64" color="#B084CC" class="mb-4">mdi-video-box-off</v-icon>
                <h3 class="mb-2">팔로잉 중인 스트리머의 동영상이 없습니다</h3>
                <p>관심있는 스트리머를 팔로우하시면 이곳에서 볼 수 있습니다.</p>
            </v-card-text>
        </v-card>

        <!-- 로딩 표시 -->
        <div v-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
        </div>

        <!-- 더보기 버튼 -->
        <div v-if="videos.length > 8" class="more-button-container">
            <div class="divider-container">
                <div class="divider"></div>
                <button class="more-button" @click="showMoreVideos">
                    {{ displayCount < 20 ? '더보기' : '전체보기' }} <v-icon size="small">mdi-chevron-down</v-icon>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const emit = defineEmits(['see-all']);
const router = useRouter();
const memberApi = process.env.VUE_APP_MEMBER_API;
const videos = ref([]);
const loading = ref(false);
const showAll = ref(false);
const displayCount = ref(8); // 처음에 8개만 보여줌
const defaultProfileImage = 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png';
const userIsAdult = ref(false);
const isLoggedIn = ref(false);

// 표시할 비디오 필터링
const displayedVideos = computed(() => {
    return videos.value.slice(0, displayCount.value);
});

// 더보기 버튼 클릭 핸들러
const showMoreVideos = () => {
    if (displayCount.value < 20) {
        // 4개씩(한 줄) 추가로 보여주기
        displayCount.value += 4;
    } else {
        // 전체보기 클릭 시 팔로잉비디오뷰로 전환
        emit('see-all');
    }
};

// 비디오 데이터 가져오기
const fetchFollowingVideos = async () => {
    loading.value = true;
    try {
        // 페이지는 0으로 고정
        const url = `${memberApi}/video/vod/follow/streamer?page=0`;
        const response = await axios.get(url);
        
        if (response.data && response.data.result) {
            const result = response.data.result;
            
            // 받아온 데이터가 있는지 확인
            if (result.content && result.content.length > 0) {
                // 비디오 아이템에 필요한 속성 추가
                const fetchedVideos = result.content.map(video => ({
                    ...video,
                    showPreview: false,
                    hoverTimer: null
                }));
                
                videos.value = fetchedVideos;
            }
        }
    } catch (error) {
        console.error('팔로잉 비디오 목록을 불러오는 중 오류 발생:', error);
    } finally {
        loading.value = false;
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
    const video = displayedVideos.value[index];
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
    const video = displayedVideos.value[index];
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

onMounted(() => {
    checkLoginStatus();
    fetchFollowingVideos();
});
</script>

<style scoped>
.following-all-videos-section {
    width: 100%;
    position: relative;
    margin-bottom: 40px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-title {
    color: #fff;
    font-size: 22px;
    font-weight: 500;
}

.see-all-btn {
    background: transparent;
    color: #aaaaaa;
    border: none;
    padding: 4px 8px;
    font-size: 14px;
    cursor: pointer;
    transition: color 0.2s;
}

.see-all-btn:hover {
    color: #B084CC;
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    margin: 0 auto;
    padding: 0;
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
    font-weight: 700;
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
    font-weight: bold;
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
    font-weight: 600;
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

.empty-card {
    background-color: #141517;
    border-radius: 12px;
    margin-top: 20px;
}

.empty-card h3 {
    color: white;
}

.empty-card p {
    color: #aaa;
}

/* 더보기 버튼 스타일 */
.more-button-container {
    margin-top: 24px;
    width: 100%;
}

.divider-container {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.divider {
    width: 100%;
    height: 1px;
    background-color: #2c2c2c;
}

.more-button {
    position: absolute;
    background: #141517;
    color: #888888;
    border: 1px solid #2c2c2c;
    border-radius: 20px;
    padding: 4px 16px;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.more-button:hover {
    background-color: #1c1c1c;
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
