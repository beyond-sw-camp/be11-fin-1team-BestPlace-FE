<template>
    <div v-if="followingStreams.length > 0 && !fetchError" class="following-live-section">
        <div class="section-header">
            <h2>팔로잉채널 라이브</h2>
            <button class="view-all-btn" @click="goToAllFollowing">전체보기</button>
        </div>
        <div class="stream-list">
            <div v-for="stream in followingStreams" :key="stream.streamId" class="stream-item">
                <div class="thumbnail-container" @click="goToLiveDetail(stream.streamId)">
                    <img :src="stream.thumbnailUrl" :alt="stream.title" class="thumbnail">
                    <div class="live-badge">LIVE</div>
                    <div class="viewer-count">
                        <span class="viewer-icon">👁</span>
                        {{ stream.viewerCount }}명
                    </div>
                </div>
                <div class="stream-info">
                    <div class="streamer-info">
                        <img :src="stream.streamerProfileUrl" :alt="stream.streamerNickname" class="profile-image" @click.stop="goToStreamerProfile(stream.streamerId)">
                        <div class="streamer-details">
                            <div class="stream-title" @click="goToLiveDetail(stream.streamId)">{{ stream.title }}</div>
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
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const followingStreams = ref([]);
const fetchError = ref(false);

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

const goToAllFollowing = () => {
    router.push('/following?tab=live');
};

const goToCategory = (category) => {
    router.push(`/category/${category}`);
};

const goToLiveDetail = (streamId) => {
    router.push(`/live/${streamId}`);
};

const goToStreamerProfile = (streamerId) => {
    router.push(`/channel/${streamerId}`);
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
    font-weight: bold;
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
</style>
