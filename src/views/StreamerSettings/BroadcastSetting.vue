<template>
    <div class="broadcast-setting">
        <h1>스트림 설정</h1>
        
        <div class="stream-setting-container">
            <div class="setting-section">

                <div class="input-group">
                    <div class="label">스트림 URL</div>
                    <div class="input-container">
                        <input type="text" v-model="streamUrl" readonly />
                        <button class="copy-btn" @click="copyToClipboard(streamUrl)">복사</button>
                    </div>
                </div>
                <div class="input-group">
                    <div class="label">스트림 키</div>
                    <div class="input-container">
                        <input 
                        :type="showStreamKey ? 'text' : 'password'" 
                        v-model="streamKey" 
                        readonly 
                        />
                        <button class="copy-btn" @click="copyToClipboard(streamKey)">복사</button>
                        <button class="reissue-btn" @click="reissueStreamKey">재발급</button>
                        <button class="eye-btn" @click="toggleStreamKeyVisibility">
                        {{ showStreamKey ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    </div>
    <!-- --------------------------------------------------------------------------------------------------------- -->
    <div class="broadcast-setting">
        <h1>채팅창 URL</h1>
        
        <div class="stream-setting-container">
            <div class="setting-section">
                <div class="input-group">
                    <div class="label">채팅창 URL</div>
                    <div class="input-container">
                        <input type="text" v-model="chattingUrl" readonly />
                        <button class="copy-btn" @click="copyToClipboard(chattingUrl)">복사</button>
                    </div>
                    <div class="url-info">
                        이 URL을 OBS 브라우저 소스로 추가하여 방송에 채팅창을 표시할 수 있습니다.
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="broadcast-setting">
        <h1>채팅후원 URL</h1>
        
        <div class="stream-setting-container">
            <div class="setting-section">
                <div class="input-group">
                    <div class="label">채팅후원 URL</div>
                    <div class="input-container">
                        <input type="text" v-model="donationUrl" readonly />
                        <button class="copy-btn" @click="copyToClipboard(donationUrl)">복사</button>
                    </div>
                    <div class="url-info">
                        이 URL을 OBS 브라우저 소스로 추가하여 방송에 채팅후원을 표시할 수 있습니다. <br>
                        권장 사이즈는 800x800 입니다.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
export default {
    data() {
        return {
            streamUrl: 'rtmp://rtmp.bepl.site:1935/live',
            streamKey: '••••••••••••••••••••••••••',
            actualStreamKey: '',
            showStreamKey: false,
            roomId: '',
            chattingUrl: '',
            donationUrl: ''
        }
    },
    computed:{
          
    },
    async created(){
        await this.getStreamKey();
        await this.getRoomId();
        this.updateChattingUrl();
        this.updateDonationUrl();
    },
    methods: {
        async getStreamKey() {
            try {
                const response = await axios.get(
                    `${process.env.VUE_APP_STREAMING_API}/streaming/getStreamKey/${this.$route.params.memberId}`, 
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                );
                this.actualStreamKey = response.data.result;
                this.streamKey = this.actualStreamKey; // 화면 표시용
            } catch (error) {
                console.error('스트림 키 가져오는 중 오류 발생:', error);
            }
        },
        async getRoomId() {
            try {
                const response = await axios.get(
                    `${process.env.VUE_APP_STREAMING_API}/streaming/getStreaming/${this.$route.params.memberId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                );
                if (response.data.result && response.data.result.roomId) {
                    this.roomId = response.data.result.roomId;
                    this.updateChattingUrl();
                }
            } catch (error) {
                console.error('방 ID 가져오는 중 오류 발생:', error);
            }
        },
        updateChattingUrl() {
            if (this.roomId) {
                // 환경에 따라 적절한 호스트 URL 사용
                const baseUrl = process.env.NODE_ENV === 'production' 
                    ? `${process.env.VUE_APP_CHATTING_API}` 
                    : `${process.env.VUE_APP_CHATTING_API || 'http://localhost:3000'}`;
                this.chattingUrl = `${baseUrl}/chatting/${this.roomId}`;
            }
        },
        async updateDonationUrl() {
            try {
                const response = await axios.get(
                    `${process.env.VUE_APP_STREAMING_API}/streaming/find/streamId/${this.$route.params.memberId}`,
                );
                const result = response.data.result;
                this.donationUrl = `${process.env.VUE_APP_RedirectUrl}/chat-donation/${result}`;
            } catch (error) {
                console.error('스트리머 ID 가져오는 중 오류 발생:', error);
            }
        },
        async reissueStreamKey() {
            try {
                const response = await axios.post(
                    `${process.env.VUE_APP_STREAMING_API}/streaming/update/StreamKey/${this.$route.params.memberId}`, 
                    null,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        }
                    }
                );
                this.actualStreamKey = response.data.result;
                this.streamKey = this.actualStreamKey;
                alert('스트림 키가 재발급되었습니다.');
            } catch (error) {
                console.error('스트림 키 재발급 중 오류 발생:', error);
            }
        },        
        copyToClipboard(text) {
            const textToCopy = text === this.streamKey ? this.actualStreamKey : text;
            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    alert('클립보드에 복사되었습니다.');
                })
                .catch(err => {
                    console.error('클립보드 복사 실패:', err);
                });
        },
        toggleStreamKeyVisibility() {
            this.showStreamKey = !this.showStreamKey;
        }
        
    }
}
</script>

<style scoped>
.broadcast-setting {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

h1 {
    font-size: 24px;
    margin-bottom: 20px;
}

h2 {
    font-size: 18px;
    margin-bottom: 16px;
}

.stream-setting-container {
    background-color: #1e1e1e; /* 살짝 밝은 짙은 회색 */
    border-radius: 8px;
    padding: 18px;
}

.setting-section {
    margin-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.setting-section:last-child {
    border-bottom: none;
}

.input-group {
    margin-bottom: 16px;
}

.label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
}

.input-container {
    display: flex;
    gap: 8px;
}

input[type="text"], 
input[type="password"] {
    flex: 1;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.copy-btn, .reissue-btn, .save-btn {
    padding: 10px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.copy-btn {
    background-color: #3a3a3a; /* 조금 더 어두운 회색 */
    color: white;
}

.reissue-btn {
    background-color: #7c4dff; /* 예쁜 보라색 (Violet) */
    color: white;
}

.save-btn {
    background-color: #5a5cff;
    color: white;
    padding: 12px 24px;
    font-weight: 500;
}

.radio-group, .checkbox-group {
    margin-bottom: 16px;
}

.radio-option, .checkbox-option {
    margin-bottom: 8px;
    display: flex;
    align-items: center;
}

.toggle-group {
    margin-top: 16px;
}

.toggle-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 30px;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #5a5cff;
}

input:checked + .slider:before {
    transform: translateX(30px);
}

textarea {
    width: 100%;
    height: 120px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    margin-bottom: 16px;
    resize: vertical;
}

.button-group {
    display: flex;
    justify-content: flex-end;
}

.url-info {
    margin-top: 8px;
    font-size: 12px;
    color: #888;
    line-height: 1.4;
}

.eye-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    padding: 10px;
}
</style>
  