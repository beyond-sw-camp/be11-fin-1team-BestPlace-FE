<template>
    <div v-if="followingStreams.length > 0 && !fetchError" class="following-live-section">
        <div class="section-header">
            <h2>팔로잉채널 라이브</h2>
            <button class="view-all-btn" @click="goToAllFollowing">전체보기</button>
        </div>
        <div class="stream-list">
            <div v-for="stream in followingStreams" :key="stream.streamId" class="stream-item">
                <div class="thumbnail-container" @click="goToLiveDetail(stream.streamId, stream)">
                    <img :src="stream.thumbnailUrl" :alt="stream.title" class="thumbnail"
                        :class="{
                            'blur-thumbnail': shouldBlurThumbnail(stream),
                            'hide-thumbnail': shouldHideThumbnail(stream)
                        }">
                    <div class="live-badge">LIVE</div>
                    <div class="viewer-count">
                        <span class="viewer-icon">👁</span>
                        {{ stream.viewerCount }}명
                    </div>
                    <!-- 연령 제한 표시 -->
                    <div v-if="isAdultContent(stream)" class="age-restriction-overlay">
                        <div class="age-restriction-content">
                            <div class="age-icon-circle">19</div>
                            <div class="age-text">연령 제한</div>
                        </div>
                    </div>
                </div>
                <div class="stream-info">
                    <div class="streamer-info">
                        <img :src="stream.streamerProfileUrl" :alt="stream.streamerNickname" class="profile-image" @click.stop="goToStreamerProfile(stream.streamerId)">
                        <div class="streamer-details">
                            <div class="stream-title" @click="goToLiveDetail(stream.streamId, stream)">{{ stream.title }}</div>
                            <div class="streamer-name" @click.stop="goToStreamerProfile(stream.streamerId)">{{ stream.streamerNickname }}</div>
                        </div>
                    </div>
                    <div class="stream-meta">
                        <div class="tag-container">
                            <span class="category" @click.stop="goToCategory(stream.category)">{{ stream.category }}</span>
                            <div class="hashtags" v-if="getVisibleHashtags(stream).length > 0">
                                <span v-for="(tag, idx) in getVisibleHashtags(stream)" :key="tag + '-' + idx" class="hashtag">{{ tag }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

const router = useRouter();
const followingStreams = ref([]);
const fetchError = ref(false);

// 성인 콘텐츠 관련 상태 추가
const userIsAdult = ref(false);
const isLoggedIn = ref(false);
const adultAlertModalOpen = ref(false);
const selectedStream = ref(null);

const fetchFollowingStreams = async () => {
    try {
        const streamingApi = process.env.VUE_APP_STREAMING_API;
        const response = await axios.get(`${streamingApi}/streaming/followList`);
        console.log('팔로우 방송목록',response.data.result);
        if (response.data.status_code === 200) {
            followingStreams.value = response.data.result.slice(0, 4);
            fetchError.value = false;
        } else {
            fetchError.value = true;
        }
    } catch (error) {
        console.error('팔로잉 라이브 목록을 가져오는데 실패했습니다:', error);
        fetchError.value = true;
    }
};

const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    isLoggedIn.value = !!token;
    
    if (isLoggedIn.value) {
        try {
            const decoded = jwtDecode(token);
            if(decoded.isAdult === 'Y'){
                userIsAdult.value = true;
            } else {
                userIsAdult.value = false;
            }
        } catch (error) {
            console.error('토큰 디코딩 중 오류 발생:', error);
            userIsAdult.value = false;
        }
    }
};

const goToAllFollowing = () => {
    router.push('/following?tab=live');
};

const goToCategory = (category) => {
    router.push(`/category/${category}`);
};

const goToLiveDetail = (streamId, stream) => {
    // 성인 컨텐츠 처리
    if (stream.adultYn === 'Y' && (!isLoggedIn.value || !userIsAdult.value)) {
        selectedStream.value = stream;
        adultAlertModalOpen.value = true;
    } else {
        router.push(`/live/${streamId}`);
    }
};

const goToStreamerProfile = (streamerId) => {
    router.push(`/channel/${streamerId}`);
};

// 성인 콘텐츠 관련 메서드
const isAdultContent = (stream) => {
    return stream.adultYn === 'Y';
};

const shouldBlurThumbnail = (stream) => {
    // 성인 컨텐츠이고, 로그인한 사용자가 성인인 경우 흐리게 표시
    return isAdultContent(stream) && isLoggedIn.value && userIsAdult.value;
};

const shouldHideThumbnail = (stream) => {
    // 성인 컨텐츠이고, 로그인하지 않았거나 성인이 아닌 경우 숨김
    return isAdultContent(stream) && (!isLoggedIn.value || !userIsAdult.value);
};

const closeAdultAlertModal = () => {
    adultAlertModalOpen.value = false;
    selectedStream.value = null;
};

const goToLogin = () => {
    closeAdultAlertModal();
    // 로그인 페이지로 이동
    router.push('/member/login');
};

// 카테고리+해시태그 20자 제한, 해시태그 자르기
function getVisibleHashtags(stream) {
    if (!stream.hashTag || !Array.isArray(stream.hashTag)) return [];
    const category = stream.category || '';
    let totalLength = category.length;
    const result = [];
    for (const tag of stream.hashTag) {
        if (totalLength + tag.length > 20) break;
        result.push(tag);
        totalLength += tag.length;
    }
    return result;
}

function isHashtagTruncated(stream) {
    if (!stream.hashTag || !Array.isArray(stream.hashTag)) return false;
    const category = stream.category || '';
    let totalLength = category.length;
    for (const tag of stream.hashTag) {
        if (totalLength + tag.length > 20) return true;
        totalLength += tag.length;
    }
    return false;
}

onMounted(() => {
    checkLoginStatus();
    fetchFollowingStreams();
});
</script>

<style scoped>
.following-live-section {
    padding: 20px;
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.section-header h2 {
    font-size: 1.5rem;
}

.view-all-btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.stream-list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.stream-item {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.thumbnail-container {
    position: relative;
    aspect-ratio: 16/9;
    cursor: pointer;
}

.thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.live-badge {
    position: absolute;
    top: 8px;
    left: 8px;
    background: #FF0000;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    z-index: 2;
}

.viewer-count {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 2;
}

.viewer-icon {
    font-size: 14px;
}

.stream-info {
    padding: 12px;
}

.streamer-info {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-top: 8px;
}

.profile-image {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
    cursor: pointer;
}

.streamer-details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.stream-title {
    font-size: 16px;
    font-weight: 500;
    color: #fff;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    cursor: pointer;
}

.streamer-name {
    color: #7B7B7B;
    font-size: 14px;
    cursor: pointer;
}

.stream-meta {
    margin-top: 8px;
}

.tag-container {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
    overflow: hidden;
    max-width: 100%;
    height: 28px;
}

.category {
    background-color: #B084CC;
    color: #000000;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    padding: 1px 5px;
    border-radius: 3px;
    flex-shrink: 0;
    height: 22px;
    display: flex;
    align-items: center;
}

.hashtags {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
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

.hashtag.more {
    background: transparent;
    color: #aaa;
    padding: 0 4px;
    margin: 0;
}

/* 연령 제한 관련 스타일 */
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
</style>
