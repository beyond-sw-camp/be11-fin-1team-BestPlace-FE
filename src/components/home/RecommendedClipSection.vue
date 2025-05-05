<template>
    <div class="recommended-clip-section">
        <div class="section-header">
            <h1 class="section-title">BestPlace가 추천하는 클립</h1>
        </div>

        <div class="clips-grid">
            <div 
                v-for="clip in displayedClips" 
                :key="clip.id" 
                class="clip-item"
                @click="handleClipClick(clip)"
            >
                <div class="thumbnail-container">
                    <div class="clip-badge">클립</div>
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
        
        <!-- 더보기 버튼 -->
        <div v-if="!showAll && hasMoreClips" class="more-button-container">
            <div class="divider-container">
                <div class="divider"></div>
                <button class="more-button" @click="showMoreClips">
                    더보기 <v-icon size="small">mdi-chevron-down</v-icon>
                </button>
            </div>
        </div>

        <!-- 로딩 표시 -->
        <div v-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="#B084CC"></v-progress-circular>
        </div>

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

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const memberApi = process.env.VUE_APP_MEMBER_API;
const clips = ref([]);
const loading = ref(false);
const showAll = ref(false);
const isLoggedIn = ref(false);
const userIsAdult = ref(false);
const adultAlertModalOpen = ref(false);
const selectedClip = ref(null);
const hasMoreClips = ref(false);

// 표시할 클립 필터링
const displayedClips = computed(() => {
    if (showAll.value) {
        return clips.value;
    } else {
        return clips.value.slice(0, 6);
    }
});

// 더보기 버튼 클릭 핸들러
const showMoreClips = () => {
    showAll.value = true;
};

// 로그인 상태 확인
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

// 추천 클립 가져오기
const fetchRecommendedClips = async () => {
    loading.value = true;
    try {
        let endpoint;
        if (isLoggedIn.value) {
            endpoint = `${memberApi}/video/clip/list/recommend/logined`;
        } else {
            endpoint = `${memberApi}/video/clip/list/recommend`;
        }
        
        const response = await axios.get(endpoint, {
            params: {
                page: 0,
                periodType: 'ALL'
            }
        });
        
        if (response.data && response.data.result) {
            const result = response.data.result;
            clips.value = result.content || [];
            hasMoreClips.value = clips.value.length > 8;
        }
    } catch (error) {
        console.error('추천 클립 목록을 불러오는 중 오류 발생:', error);
    } finally {
        loading.value = false;
    }
};

// 클립 클릭 핸들러
const handleClipClick = (clip) => {
    if (clip.isAdult === 'Y' && (!isLoggedIn.value || !userIsAdult.value)) {
        // 성인 컨텐츠이고 로그인하지 않았거나 성인이 아닌 경우, 모달 표시
        selectedClip.value = clip;
        adultAlertModalOpen.value = true;
    } else {
        // 아니면 클립 페이지로 이동
        router.push(`/clip/${clip.id}`);
    }
};

// 성인 컨텐츠 관련
const shouldBlurThumbnail = (clip) => {
    return clip.isAdult === 'Y' && isLoggedIn.value && userIsAdult.value;
};

const shouldHideThumbnail = (clip) => {
    return clip.isAdult === 'Y' && (!isLoggedIn.value || !userIsAdult.value);
};

// 모달 관련
const closeAdultAlertModal = () => {
    adultAlertModalOpen.value = false;
    selectedClip.value = null;
};

const goToLogin = () => {
    closeAdultAlertModal();
    router.push('/member/login');
};

// 숫자 포맷팅
const formatNumber = (num) => {
    if (num >= 10000) {
        return (num / 10000).toFixed(1) + '만';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + '천';
    }
    return num.toString();
};

onMounted(() => {
    checkLoginStatus();
    fetchRecommendedClips();
});
</script>

<style scoped>
.recommended-clip-section {
    max-width: 1920px;
    margin: 0 auto;
    padding: 24px;
    background: #141517;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.section-title {
    color: #fff;
    font-size: 22px;
    font-weight: 400;
}

.clips-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 15px;
    width: 100%;
    margin: 0 auto;
}

.clip-item {
    cursor: pointer;
    background-color: #18191c;
    border-radius: 8px;
    overflow: hidden;
    padding: 0;
    transition: transform 0.2s;
}

.clip-item:hover .thumbnail {
    opacity: 0.7;
}

.thumbnail-container {
    position: relative;
    overflow: hidden;
    border-radius: 8px;
    width: 100%;
    aspect-ratio: 3 / 5;
    background-color: #000;
}

.clip-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #E05C8C;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    z-index: 2;
}

.thumbnail {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center center;
    background-color: #000;
    transition: opacity 0.3s ease;
}

.blur-thumbnail {
    filter: blur(3px);
    opacity: 0.9;
}

.hide-thumbnail {
    opacity: 0;
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

.clip-info-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 12px;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 2;
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

.streamer-name, .view-count {
    color: #ffffff;
    font-size: 11px;
    display: flex;
    align-items: center;
    text-shadow: none;
}

.streamer-name {
    margin-right: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
}

.view-count {
    white-space: nowrap;
}

.more-button-container {
    margin-top: 30px;
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

.loading-container {
    display: flex;
    justify-content: center;
    margin: 40px 0;
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

@media (max-width: 1200px) {
    .clips-grid {
        grid-template-columns: repeat(6, 1fr);
    }
}

@media (max-width: 900px) {
    .clips-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (max-width: 600px) {
    .clips-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
</style>
