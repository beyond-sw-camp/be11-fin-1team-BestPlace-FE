<template>
  <div class="broadcast-page">
    <div class="broadcast-container">
      <div class="stream-section">
        <!-- 비디오 화면 -->
        <div class="video-container">
          <video ref="video" autoplay muted playsinline width="100%"></video>
          <div v-if="!isStreaming" class="stream-placeholder">
            <div class="placeholder-content">
              <div class="placeholder-icon">
                <v-icon size="64">mdi-video-off</v-icon>
              </div>
              <div class="placeholder-text">방송 시작 전입니다.</div>
              <div class="placeholder-subtext">아래에서 방송 정보를 설정하고 방송을 시작하세요.</div>
            </div>
          </div>
        </div>

        <!-- 방송 정보 설정 폼 -->
        <div class="broadcast-settings">
          <h2 class="settings-title">방송 정보 설정</h2>
          
          <div class="form-group">
            <label>방송 제목 *</label>
            <v-text-field
              v-model="title"
              placeholder="방송 제목을 입력하세요"
              variant="outlined"
              counter="100"
              maxlength="100"
              density="comfortable"
              bg-color="#1e2029"
              color="primary"
            ></v-text-field>
          </div>
          
          <div class="form-group">
            <label>카테고리 *</label>
            <v-select
              v-model="category"
              :items="categories"
              item-title="name"
              item-value="id"
              placeholder="카테고리 선택"
              variant="outlined"
              bg-color="#1e2029"
              color="primary"
            ></v-select>
          </div>
          
          <div class="form-group">
            <label>태그</label>
            <v-combobox
              v-model="tags"
              chips
              closable-chips
              multiple
              placeholder="태그를 입력하고 엔터 키를 누르세요"
              variant="outlined"
              counter="5"
              hint="최대 5개까지 입력 가능합니다"
              bg-color="#1e2029"
              color="primary"
            ></v-combobox>
          </div>

          <div class="form-group">
            <label>성인 방송 여부</label>
            <v-switch
              v-model="adultYn"
              :label="adultYn === 'Y' ? '성인 방송' : '일반 방송'"
              color="red"
              true-value="Y"
              false-value="N"
            ></v-switch>
          </div>
          
          <div class="form-group">
            <label>미리보기 이미지</label>
            <div class="thumbnail-upload">
              <div class="thumbnail-preview" @click="triggerFileUpload">
                <img v-if="thumbnailPreview" :src="thumbnailPreview" alt="미리보기" />
                <div v-else class="upload-placeholder">
                  <v-icon size="48">mdi-image-plus</v-icon>
                  <div class="upload-text">이미지 업로드</div>
                </div>
              </div>
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileUpload" 
                accept="image/*" 
                style="display: none"
              />
              <div class="thumbnail-hint">이미지 권장 비율: 16:9 (1280x720)</div>
            </div>
          </div>
          
          <div class="button-group">
            <v-btn
              color="primary"
              size="large"
              block
              @click="updateStream"
              :loading="isStarting"
              :disabled="!title || !category"
            >
              방송 정보 수정
            </v-btn>
          </div>
        </div>
      </div>

      <!-- 채팅 섹션 -->
      <div class="chat-section">
        <div class="chat-header">
          <span class="chat-title">실시간 채팅</span>
          <div class="chat-info">
            <span class="chat-count">{{ messages.length }}</span>
          </div>
        </div>
        <div class="chat-messages" ref="chatContainer">
          <div v-if="messages.length === 0" class="empty-chat">
            <div class="empty-chat-text">방송이 시작되면 채팅이 표시됩니다.</div>
          </div>
          <div
            v-for="message in messages"
            :key="message.messageId"
            class="chat-message"
            :class="{ 'own-message': message.memberId === memberId }"
            @contextmenu.prevent="openContextMenu($event, message)"
          >
            <span class="sender" :style="getUsernameColor(message.sender)">{{ message.sender }}</span>
            <span class="message-content">{{ message.message }}</span>
          </div>
          
          <!-- 컨텍스트 메뉴 추가 -->
          <div
            v-if="contextMenu.visible"
            class="context-menu"
            :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
          >
            <ul>
              <li v-if="!reportedUsers.has(selectedMessage?.memberId)" @click="showReportModal">
                🚨 신고하기
              </li>
              <li v-else @click="showAlreadyReportedModal">
                🚨 이미 신고한 사용자입니다
              </li>
              <li v-if="!isTempBanned(selectedMessage?.memberId)" @click="tempBanUser">
                ⛔ 임시제한
              </li>
              <li v-else @click="releaseTempBan">
                ✅ 임시제한 해제
              </li>
            </ul>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="채팅을 입력하세요"
            :disabled="!isStreaming || !isConnected"
          />
          <button @click="sendMessage" :disabled="!isStreaming || !isConnected">전송</button>
        </div>
      </div>
    </div>

    <!-- 커스텀 모달 컴포넌트 -->
    <v-dialog v-model="showModal" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon 
            left 
            :color="modalType === 'success' ? 'success' : modalType === 'error' ? 'error' : 'primary'"
            class="mr-2"
          >
            {{ modalType === 'success' ? 'mdi-check-circle' : 
               modalType === 'error' ? 'mdi-alert-circle' : 'mdi-information' }}
          </v-icon>
          {{ modalTitle }}
        </v-card-title>
        <v-card-text class="modal-content">
          <p>{{ modalMessage }}</p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn 
            :color="modalType === 'success' ? 'success' : modalType === 'error' ? 'error' : 'primary'" 
            text 
            @click="closeModal"
          >
            확인
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 신고 모달 -->
    <v-dialog v-model="reportModalVisible" max-width="400" persistent>
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="error" class="mr-2">mdi-flag</v-icon>
          채팅 신고하기
        </v-card-title>
        <v-card-text class="modal-content">
          <div class="reported-message mb-4" v-if="selectedMessage">
            <p class="mb-1 text-caption text-grey">신고할 메시지:</p>
            <v-card class="pa-2 reported-message-card">
              <p class="mb-0"><strong>{{ selectedMessage.sender }}</strong>: {{ selectedMessage.message }}</p>
            </v-card>
          </div>
          
          <p class="mb-4">이 메시지를 신고하는 이유를 선택해주세요.</p>
          
          <v-radio-group v-model="reportReason" density="compact">
            <v-radio value="욕설/비하" label="욕설/비하"></v-radio>
            <v-radio value="스팸/광고" label="스팸/광고"></v-radio>
            <v-radio value="성적 콘텐츠" label="성적 콘텐츠"></v-radio>
            <v-radio value="개인정보 유출" label="개인정보 유출"></v-radio>
            <v-radio value="기타" label="기타"></v-radio>
          </v-radio-group>
          
          <v-textarea
            v-if="reportReason === '기타'"
            v-model="reportDescription"
            label="구체적인 신고 내용을 작성해주세요"
            rows="4"
            variant="outlined"
            class="mt-3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cancelReport">취소</v-btn>
          <v-btn color="error" variant="flat" @click="handleReport" :disabled="!reportReason">
            신고하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- 이미 신고한 사용자에 대한 안내 모달 -->
    <v-dialog v-model="alreadyReportedModalVisible" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="warning" class="mr-2">mdi-alert-circle</v-icon>
          신고 내역 안내
        </v-card-title>
        <v-card-text class="modal-content">
          <p>이미 신고한 사용자입니다.</p>
          <p class="modal-sub-text">해당 사용자에 대한 신고가 접수되었으며, 처리 중입니다.</p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="alreadyReportedModalVisible = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 임시제한 모달 추가 -->
    <v-dialog v-model="tempBanModalVisible" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="warning" class="mr-2">mdi-account-cancel</v-icon>
          임시제한 설정
        </v-card-title>
        <v-card-text class="modal-content">
          <div class="reported-message mb-4" v-if="selectedMessage">
            <p class="mb-1 text-caption text-grey">제한할 사용자의 메시지:</p>
            <v-card class="pa-2 reported-message-card">
              <p class="mb-0"><strong>{{ selectedMessage.sender }}</strong>: {{ selectedMessage.message }}</p>
            </v-card>
          </div>
          
          <p>이 사용자의 채팅을 임시적으로 제한하시겠습니까?</p>
          <p class="text-caption text-grey mt-2">
            제한 이력에 따라 시간이 자동으로 설정됩니다:<br>
            첫 번째: 30초 / 두 번째: 1분 / 세 번째: 5분 / 네 번째 이상: 10분
          </p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="tempBanModalVisible = false">취소</v-btn>
          <v-btn color="warning" variant="flat" @click="handleTempBan">
            임시제한 적용
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 임시제한 해제 모달 추가 -->
    <v-dialog v-model="releaseBanModalVisible" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="success" class="mr-2">mdi-account-check</v-icon>
          임시제한 해제
        </v-card-title>
        <v-card-text class="modal-content">
          <div class="reported-message mb-4" v-if="selectedMessage">
            <p class="mb-1 text-caption text-grey">임시제한을 해제할 사용자:</p>
            <v-card class="pa-2 reported-message-card">
              <p class="mb-0"><strong>{{ selectedMessage.sender }}</strong></p>
            </v-card>
          </div>
          
          <p>이 사용자의 임시제한을 해제하시겠습니까?</p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="releaseBanModalVisible = false">취소</v-btn>
          <v-btn color="success" variant="flat" @click="handleReleaseTempBan">
            임시제한 해제
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import Hls from 'hls.js'
import { useRoute } from 'vue-router';

export default {
  setup() {
    const route = useRoute();
    return {
      route
    };
  },
  data() {
    return {
      isStreaming: false,
      isStarting: false,
      streamKey: '',
      streamId: null,
      roomId: null,
      routeMemberId: null,
      
      title: '',
      category: null, // id 저장
      tags: [],
      thumbnailFile: null,
      thumbnailPreview: null,
      adultYn: 'N',
      
      messages: [],
      newMessage: '',
      stompClient: null,
      isConnected: false,
      
      memberId: null,
      userNickname: '',
      
      categories: [], // { id, name } 목록 저장
      
      // 모달 관련 상태 추가
      showModal: false,
      modalTitle: '',
      modalMessage: '',
      modalType: 'info', // 'info', 'success', 'error' 등의 타입
      modalAction: null, // 확인 버튼 클릭 시 실행할 함수 (선택적)

      // 사용자 이름 색상을 위한 색상 배열 추가
      colors: [
        '#FF5E5B', '#D8315B', '#1EA896', '#3E92CC', '#C3BD78', 
        '#7768AE', '#FFB400', '#4AAB95', '#FF7A5A', '#7AC74F',
        '#00A5E0', '#8A4FFF', '#FF9505', '#9A348E', '#0077B6'
      ],
      
      // 컨텍스트 메뉴 관련
      contextMenu: {
        visible: false,
        x: 0,
        y: 0
      },
      selectedMessage: null,
      
      // 신고 관련
      reportedUsers: new Set(),
      reportModalVisible: false,
      alreadyReportedModalVisible: false,
      reportReason: null,
      reportDescription: '',

      // 임시제한 관련
      tempBannedUsers: new Map(), // 사용자 ID를 키로, 제한 정보를 값으로 저장
      tempBanModalVisible: false,
      releaseBanModalVisible: false,
      banCheckTimer: null, // 임시제한 상태 체크 타이머
    };
  },
  
  computed: {
    // 자신의 메시지인지 확인하는 computed 속성
    isOwnMessage() {
      return (memberId) => {
        return this.memberId === memberId;
      };
    }
  },
  
  async created() {
    console.log('DoBroadcast 컴포넌트 created 호출');
    // 라우트에서 memberId 가져오기
    this.routeMemberId = this.route.params.memberId;
    console.log('라우트에서 추출한 memberId:', this.routeMemberId);
    
    // 토큰에서 사용자 정보 가져오기
    const token = localStorage.getItem('token');
    if (token) {
      const payload = jwtDecode(token);
      this.memberId = payload.sub;
      this.userNickname = payload.nickname;
      console.log('토큰에서 추출한 사용자 정보:', {
        memberId: this.memberId,
        nickname: this.userNickname
      });
    } else {
      console.warn('토큰이 없습니다.');
    }

    console.log('초기화 작업 시작');
    
    try {
      // 1. 스트리밍 ID 가져오기
      await this.fetchStreamingId();
      console.log('스트리밍 ID 로드 완료:', this.streamId);
      
      // 2. 카테고리 가져오기
      await this.fetchCategories();
      console.log('카테고리 로드 완료');
      
      // 3. 스트리밍 정보 가져오기
      await this.fetchStreamingInfo();
      console.log('방송 정보 로드 완료');
      
      // 4. 신고 목록 가져오기
      if (this.memberId) {
        await this.loadReportedUsers();
        console.log('신고 목록 로드 완료');
      }
    } catch (error) {
      console.error('초기화 중 오류 발생:', error);
    }
    
    // 컨텍스트 메뉴 외부 클릭 시 닫기 이벤트 리스너 추가
    document.addEventListener('click', this.closeContextMenu);
    console.log('초기화 작업 완료');
  },
  methods: {
    // 파일 업로드 함수
    triggerFileUpload() {
      this.$refs.fileInput.click();
    },

    // 사용자 이름에 대한 일관된 색상 반환
    getUsernameColor(username) {
      // 간단한 해시 함수로 사용자 이름을 숫자로 변환
      const hash = username.split('').reduce((acc, char) => {
        return acc + char.charCodeAt(0);
      }, 0);
      
      // 색상 배열에서 사용자 이름에 해당하는 색상 선택
      const colorIndex = hash % this.colors.length;
      return { color: this.colors[colorIndex] };
    },

    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        this.showMessageModal('파일 크기 제한', '이미지 크기는 5MB 이하여야 합니다.', 'error');
        return;
      }
      
      this.thumbnailFile = file;
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    // 방송 시작 함수
    
    async startStream() {
      if (!this.title || !this.category) {
        this.showMessageModal('입력 필요', '방송 제목과 카테고리는 필수입니다.', 'error');
        return;
      }
      
      this.isStarting = true;
      
      try {
        // 폼 데이터 생성
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('category', this.category);
        formData.append('adultYn', this.adultYn);
        formData.append('streamId', this.streamId); // streamId 추가
        
        if (this.tags.length > 0) {
          this.tags.forEach(tag => {
            formData.append('tags', tag);
          });
        }
        
        if (this.thumbnailFile) {
          formData.append('thumbnail', this.thumbnailFile);
        }
        
        // API 호출하여 스트리밍 생성
        const response = await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/streaming/start`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        // 응답에서 필요한 정보 추출
        const result = response.data.result;
        // streamId는 이미 설정되어 있으므로 덮어쓰지 않음
        this.streamKey = result.streamKey;
        this.roomId = result.roomId;
        
        console.log('방송 시작 성공:', {
          streamId: this.streamId,
          streamKey: this.streamKey,
          roomId: this.roomId
        });
        
        // 채팅방 연결
        await this.connectWebsocket();
        
        // 스트리밍 상태 변경
        this.isStreaming = true;
        
        // 알림 표시
        this.showMessageModal('방송 시작', '방송이 시작되었습니다. OBS와 같은 스트리밍 소프트웨어에서 다음 스트림 키를 사용하세요: ' + this.streamKey, 'success');
        
      } catch (error) {
        console.error('방송 시작 실패:', error);
        this.showMessageModal('방송 시작 실패', '방송 시작에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      } finally {
        this.isStarting = false;
      }
    },
    
    // 웹소켓 연결 함수
    async connectWebsocket() {
      console.log('connectWebsocket 시작: roomId =', this.roomId, 'streamId =', this.streamId);
      if (!this.roomId) {
        console.error('룸 ID가 없습니다.');
        return;
      }

      // 이미 연결된 경우 중복 연결 방지
      if (this.stompClient && this.stompClient.connected) {
        console.log('이미 WebSocket에 연결되어 있습니다.');
        return;
      }

      const sockJs = new SockJS(`${process.env.VUE_APP_STREAMING_API}/connect`);
      this.stompClient = Stomp.over(sockJs);
      this.stompClient.debug = () => {};

      this.stompClient.connect({}, () => {
        console.log('WebSocket 연결 성공');
        this.isConnected = true;

        const subscribeOptions = {};
        // streamId가 있는 경우에만 옵션에 추가
        if (this.streamId) {
          subscribeOptions.streamId = this.streamId;
          console.log('WebSocket 구독 시 streamId 전달:', this.streamId);
        }

        this.stompClient.subscribe(`/topic/${this.roomId}`, (message) => {
          console.log('✅ 메시지 수신:', message);
          try {
            const parsed = JSON.parse(message.body);
            console.log('파싱된 메시지 데이터:', parsed);
            
            // 메시지 유효성 검사
            if (!parsed) {
              console.error('메시지 데이터가 null/undefined입니다');
              return;
            }
            
            // 메시지 객체를 명시적으로 구성하여 저장
            const newMessage = {
              messageId: parsed.messageId || `live-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              roomId: parsed.roomId || this.roomId,
              memberId: parsed.memberId,
              message: parsed.message || '',
              sender: parsed.sender || '익명',
              type: parsed.type || 'TALK',
              createdTime: parsed.createdTime || new Date().toISOString()
            };
            
            console.log('최종 구성된 메시지:', newMessage);
            
            // 메시지 저장 및 스크롤 처리
            this.messages.push(newMessage);
            this.scrollToBottom();
          } catch (err) {
            console.error('메시지 파싱 실패:', err);
          }
        }, subscribeOptions);
      }, (err) => {
        console.error('WebSocket 연결 실패:', err);
        this.isConnected = false;
        
        // 연결 재시도
        setTimeout(() => {
          console.log('WebSocket 재연결 시도...');
          this.connectWebsocket();
        }, 3000);
      });
    },
    
    // 메시지 전송 함수
    sendMessage() {
      if (!this.newMessage.trim() || !this.isConnected || !this.roomId) return;
      
      const messagePayload = {
        message: this.newMessage,
        type: 'TALK'
      };
      
      this.stompClient.send(
        `/publish/${this.roomId}`,
        JSON.stringify(messagePayload),
        {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'content-type': 'application/json'
        }
      );
      
      this.newMessage = '';
    },
    
    // 채팅 스크롤 아래로 이동
    scrollToBottom() {
      this.$nextTick(() => {
        const chatContainer = this.$refs.chatContainer;
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      });
    },
    async fetchCategories() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_STREAMING_API}/category/list`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        this.categories = response.data.result.content;
      } catch (error) {
        console.error('카테고리 불러오기 실패', error);
        this.showMessageModal('카테고리 로드 실패', '카테고리를 불러오는 데 실패했습니다.', 'error');
      }
    },
    async fetchStreamingInfo() {
      try {
        // 스트리머 ID 기반으로 방송 정보 가져오기
        const memberId = this.routeMemberId || this.memberId;
        console.log('방송 정보 조회할 memberId:', memberId);
        
        const response = await axios.get(
          `${process.env.VUE_APP_STREAMING_API}/streaming/getStreaming/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        const result = response.data.result;
        console.log('[fetchStreamingInfo] 방송 정보:', result); 
        
        // 필요한 정보들을 저장 (streamId는 이미 설정되어 있음)
        this.title = result.title;
        this.category = result.categoryId;
        this.tags = result.hashTags;
        this.adultYn = result.adultYn || 'N';
        this.thumbnailPreview = result.thumbnail;
        this.streamKey = result.streamKey; 
        this.roomId = result.roomId;
        
        console.log('fetchStreamingInfo에서 설정된 값:', {
          streamKey: this.streamKey,
          roomId: this.roomId,
          streamId: this.streamId
        });
        
        if (this.streamKey && this.roomId) {
          this.isStreaming = true;
        } else {
          this.isStreaming = false;
        }

        this.initializeStreamingVideo();   // streamKey 설정 후 video 초기화
        
        // 채팅 기록 가져오기
        if (this.roomId) {
          try {
            const chatResponse = await axios.get(`${process.env.VUE_APP_STREAMING_API}/chat/history/${this.roomId}`);
            console.log('채팅 기록 API 응답:', chatResponse);
            
            if (Array.isArray(chatResponse.data)) {
              console.log('채팅 기록 데이터 배열 길이:', chatResponse.data.length);
              
              // 메시지 객체 생성 및 저장
              this.messages = chatResponse.data.map(item => ({
                messageId: item.messageId || `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                roomId: item.roomId || this.roomId,
                memberId: item.memberId,
                message: item.message || '',
                sender: item.sender || '익명',
                type: item.type || 'TALK',
                createdTime: item.createdTime || new Date().toISOString()
              }));
              
              // 메시지 로드 후 맨 아래로 스크롤
              this.$nextTick(() => {
                this.scrollToBottom();
              });
            }
          } catch (chatError) {
            console.error('채팅 기록 불러오기 실패:', chatError);
          }
        }
        
        // roomId와 streamId가 모두 있을 때만 WebSocket 연결
        if (this.roomId && this.streamId) {
          console.log('WebSocket 연결 시작 - roomId와 streamId 확인:', this.roomId, this.streamId);
          await this.connectWebsocket();
        } else {
          console.error('WebSocket 연결 실패 - roomId 또는 streamId가 없음:', {
            roomId: this.roomId,
            streamId: this.streamId
          });
        }
      } catch (error) {
        console.error('방송 정보 불러오기 실패:', error);
        this.showMessageModal('방송 정보 로드 실패', '방송 정보를 불러오는 데 실패했습니다.', 'error');
      }
    },
    initializeStreamingVideo() {
      const el = this.$refs.video;
      if (!el) {
        console.error('[initializeStreamingVideo] video 엘리먼트 못 찾음'); // ✅ 이거 추가
        return;
      }
      if (!this.streamKey) {
        console.error('스트림키가 없습니다.');
        return;
      }

      const hlsSrc = process.env.NODE_ENV === 'production'
        ? `https://hls.배포주소/hls/${this.streamKey}.m3u8`
        : `http://localhost:8088/hls/${this.streamKey}.m3u8`;


      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsSrc);
        hls.attachMedia(el);

      } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
        el.src = hlsSrc;

      }
    },
    async initializeStreaming() {
      await this.fetchStreamingInfo();
    },
    async updateStream() {
      if (!this.title || !this.category) {
        this.showMessageModal('입력 필요', '방송 제목과 카테고리는 필수입니다.', 'error');
        return;
      }

      this.isStarting = true;

      try {
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('categoryId', this.category); // id 보내기
        formData.append('clipYN', 'Y');
        formData.append('adultYn', this.adultYn);
        formData.append('minDonation', 1000);

        if (this.tags.length > 0) {
          this.tags.forEach(tag => {
            formData.append('hashtags', tag);
          });
        }

        if (this.thumbnailFile) {
          formData.append('thumbnail', this.thumbnailFile);
        }

        await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/streaming/update-Streaming`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        this.showMessageModal('수정 완료', '방송 정보가 성공적으로 수정되었습니다.', 'success', () => {
          window.location.reload();
        });

      } catch (error) {
        console.error('방송 정보 수정 실패:', error);
        this.showMessageModal('수정 실패', '방송 수정 실패: ' + (error.response?.data?.message || error.message), 'error');
      } finally {
        this.isStarting = false;
      }
    },
    // 모달 표시 함수
    showMessageModal(title, message, type = 'info', action = null) {
      this.modalTitle = title;
      this.modalMessage = message;
      this.modalType = type;
      this.modalAction = action;
      this.showModal = true;
    },
    
    // 모달 닫기 함수
    closeModal() {
      this.showModal = false;
      // 액션이 있는 경우 실행
      if (this.modalAction) {
        this.modalAction();
        this.modalAction = null;
      }
    },

    openContextMenu(event, message) {
      event.preventDefault()
      console.log('컨텍스트 메뉴 오픈 시도, 메시지 객체:', message)
      
      // 메시지 객체가 유효한지 자세히 검사
      if (!message || typeof message !== 'object') {
        console.error('메시지 객체가 유효하지 않습니다:', message)
        return
      }
      
      // 자신의 메시지는 컨텍스트 메뉴를 열지 않음
      if (message.memberId && this.memberId && message.memberId.toString() === this.memberId.toString()) {
        console.log('자신의 메시지라 컨텍스트 메뉴를 열지 않습니다.')
        return
      }
      
      // messageId가 없는 경우 생성
      if (!message.messageId) {
        console.warn('메시지 ID가 없어 자동 생성합니다')
        message.messageId = `menu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        console.log('자동 생성된 메시지 ID:', message.messageId)
      }
      
      // 임시제한 사용자 목록 업데이트 (만료된 항목 제거)
      const now = new Date()
      this.tempBannedUsers.forEach((banInfo, userId) => {
        if (now > new Date(banInfo.expireAt)) {
          console.log(`사용자 ${userId}의 임시제한이 만료되었습니다.`)
          this.tempBannedUsers.delete(userId)
        }
      })
      
      this.selectedMessage = { ...message }  // 깊은 복사로 참조 문제 방지
      console.log('선택된 메시지:', this.selectedMessage)
      
      // 컨텍스트 메뉴 위치 설정
      let x = event.clientX
      let y = event.clientY
      
      // 화면 우측 경계 체크
      const menuWidth = 150
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 10
      }
      
      // 화면 하단 경계 체크
      const menuHeight = 150
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 10
      }
      
      // 기존 컨텍스트 메뉴를 먼저 닫고 새로 열기
      this.contextMenu.visible = false
      
      // 약간의 지연 후 메뉴 표시
      setTimeout(() => {
        this.contextMenu = {
          visible: true,
          x: x,
          y: y
        }
        console.log('컨텍스트 메뉴가 표시됨:', this.contextMenu)
      }, 50)
    },

    async reportMessage(message) {
      console.log('reportMessage 호출됨, 메시지 객체:', message);
      console.log('메시지 ID 존재 여부:', !!message.messageId);
      
      try {
        // reportReason을 ReportType enum 값으로 변환
        let reportType = 'OTHER';
        if (this.reportReason === '욕설/비하') reportType = 'ABUSE';
        else if (this.reportReason === '스팸/광고') reportType = 'SPAMMING'; 
        else if (this.reportReason === '성적 콘텐츠') reportType = 'SEXUAL';
        
        const reportData = {
          reportedChatMessageId: message.messageId,
          reportReason: this.reportReason === '기타' ? this.reportDescription : this.reportReason,
          reportType: reportType
        };
        
        console.log('신고 데이터:', reportData);
        
        const response = await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/chat/report`,
          reportData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        console.log('신고 API 응답:', response);
        
        this.showMessageModal('신고 완료', '해당 메시지가 성공적으로 신고되었습니다.', 'success');
        this.reportedUsers.add(message.memberId);
        console.log('신고된 사용자 목록에 추가됨:', message.memberId);
        console.log('현재 신고된 사용자 목록 크기:', this.reportedUsers.size);
        
        // 신고 관련 상태 초기화
        this.reportReason = null;
        this.reportDescription = '';
      } catch (error) {
        console.error('메시지 신고 실패:', error);
        console.error('에러 세부 정보:', error.response?.data);
        this.showMessageModal('신고 실패', '메시지 신고에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    async showReportModal() {
      if (this.selectedMessage) {
        this.reportModalVisible = true;
      }
      this.contextMenu.visible = false;
    },

    async showAlreadyReportedModal() {
      this.alreadyReportedModalVisible = true;
      this.contextMenu.visible = false;
    },

    async handleReport() {
      if (this.selectedMessage) {
        await this.reportMessage(this.selectedMessage);
        this.selectedMessage = null;
        this.reportModalVisible = false;
      }
    },

    async cancelReport() {
      this.selectedMessage = null;
      this.reportModalVisible = false;
    },

    // 컨텍스트 메뉴 외부 클릭 시 닫기 이벤트 리스너
    closeContextMenu(event) {
      // 컨텍스트 메뉴가 보이는 상태에서만 처리
      if (!this.contextMenu.visible) return;
      
      // 컨텍스트 메뉴나 해당 항목 클릭이 아닌 경우에만 닫기
      if (!event.target.closest('.context-menu') && !event.target.closest('.chat-message')) {
        this.contextMenu.visible = false;
      }
    },

    // 신고한 사용자 목록 로드 메서드
    async loadReportedUsers() {
      console.log('loadReportedUsers 호출됨');
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_STREAMING_API}/chat/report/mylist`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        console.log('신고 목록 API 응답 형식:', typeof response.data);
        
        // 응답 데이터 구조에 따라 처리
        let reportList = [];
        
        if (response.data?.result && Array.isArray(response.data.result)) {
          // result 필드에 배열이 있는 경우
          reportList = response.data.result;
        } else if (Array.isArray(response.data)) {
          // 직접 배열인 경우
          reportList = response.data;
        } else {
          console.warn('예상과 다른 응답 형식:', response.data);
        }
        
        console.log('처리할 신고 목록:', reportList);
        
        // 신고된 사용자 ID 추출 및 Set에 추가
        reportList.forEach(item => {
          const reportedId = item?.reportedMemberId || item?.memberId || item;
          
          if (reportedId) {
            this.reportedUsers.add(reportedId.toString());
            console.log('신고된 사용자 ID 추가:', reportedId);
          }
        });
        
        console.log('최종 신고된 사용자 목록 크기:', this.reportedUsers.size);
      } catch (error) {
        console.error('신고한 사용자 목록 로드 실패:', error);
        console.error('에러 응답:', error.response?.data);
      }
    },

    // 스트리밍 ID 가져오기
    async fetchStreamingId() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_STREAMING_API}/streaming/get/streamingId`,
          {
            params: { memberId: this.routeMemberId || this.memberId },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (response.data && response.data.result) {
          this.streamId = response.data.result;
          console.log('스트리밍 ID API 응답:', response.data);
          console.log('설정된 스트리밍 ID:', this.streamId);
          return true;
        } else {
          console.error('스트리밍 ID를 가져오지 못했습니다:', response.data);
          return false;
        }
      } catch (error) {
        console.error('스트리밍 ID 조회 실패:', error);
        console.error('에러 응답:', error.response?.data);
        return false;
      }
    },

    // 임시제한 여부 확인
    isTempBanned(memberId) {
      if (!memberId) return false;
      
      const bannedInfo = this.tempBannedUsers.get(memberId.toString());
      if (!bannedInfo) return false;
      
      // 만료 시간이 지났는지 확인
      const now = new Date();
      const expireAt = new Date(bannedInfo.expireAt);
      
      if (now > expireAt) {
        // 만료된 경우 목록에서 제거
        this.tempBannedUsers.delete(memberId.toString());
        return false;
      }
      
      return true;
    },
    
    // 임시제한 모달 표시
    tempBanUser() {
      if (this.selectedMessage) {
        this.tempBanModalVisible = true;
      }
      this.contextMenu.visible = false;
    },
    
    // 임시제한 해제 모달 표시
    releaseTempBan() {
      if (this.selectedMessage) {
        this.releaseBanModalVisible = true;
      }
      this.contextMenu.visible = false;
    },
    
    // 임시제한 적용 처리
    async handleTempBan() {
      if (!this.selectedMessage) {
        this.tempBanModalVisible = false;
        return;
      }
      
      try {
        const response = await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/chat/ban/temp`,
          { messageId: this.selectedMessage.messageId },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        console.log('임시제한 응답:', response.data);
        
        // 성공 시 목록에 추가
        this.tempBannedUsers.set(this.selectedMessage.memberId.toString(), {
          expireAt: new Date(Date.now() + 10 * 60 * 1000), // 기본적으로 10분으로 설정 (실제로는 서버에서 계산)
          nickname: this.selectedMessage.sender
        });
        
        this.showMessageModal('임시제한 적용', `'${this.selectedMessage.sender}'님을 임시제한 했습니다.`, 'success');
      } catch (error) {
        console.error('임시제한 적용 실패:', error);
        this.showMessageModal('임시제한 실패', '임시제한 적용에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      } finally {
        this.tempBanModalVisible = false;
      }
    },
    
    // 임시제한 해제 처리
    async handleReleaseTempBan() {
      if (!this.selectedMessage) {
        this.releaseBanModalVisible = false;
        return;
      }
      
      try {
        const response = await axios.delete(
          `${process.env.VUE_APP_STREAMING_API}/chat/ban/temp/release`,
          {
            data: { targetMessageId: this.selectedMessage.messageId },
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        console.log('임시제한 해제 응답:', response.data);
        
        // 성공 시 목록에서 제거
        this.tempBannedUsers.delete(this.selectedMessage.memberId.toString());
        
        this.showMessageModal('임시제한 해제', `'${this.selectedMessage.sender}'님을 임시제한 해제 했습니다.`, 'success');
      } catch (error) {
        console.error('임시제한 해제 실패:', error);
        this.showMessageModal('임시제한 해제 실패', '임시제한 해제에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      } finally {
        this.releaseBanModalVisible = false;
      }
    },
  },
  onMounted() {
    this.initializeStreaming();
  },
  beforeUnmount() {
    // 컴포넌트 언마운트 시 연결 해제
    if (this.stompClient && this.stompClient.connected) {
      this.stompClient.disconnect();
    }
    
    // 타이머 정리 코드 제거
    
    // 이벤트 리스너 제거
    document.removeEventListener('click', this.closeContextMenu);
  }
};
</script>

<style scoped>
.broadcast-page {
  width: 100%;
  background: #0f0f0f;
  color: #fff;
  min-height: 100vh;
}

.broadcast-container {
  display: flex;
  max-width: 1800px;
  margin: 0 auto;
  height: calc(100vh - 64px);
}

.stream-section {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.video-container {
  width: 100%;
  position: relative;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  padding-top: 56.25%; /* 16:9 비율 */
}

.video-container video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.stream-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #141517;
}

.placeholder-content {
  text-align: center;
  padding: 24px;
}

.placeholder-icon {
  margin-bottom: 16px;
  color: #666;
}

.placeholder-text {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
}

.placeholder-subtext {
  font-size: 16px;
  color: #999;
}

.broadcast-settings {
  margin-top: 24px;
}

.settings-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.thumbnail-upload {
  margin-top: 8px;
}

.thumbnail-preview {
  width: 320px;
  height: 180px;
  background: #1e2029;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  border: 2px dashed #333;
}

.thumbnail-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  text-align: center;
  color: #777;
}

.upload-text {
  margin-top: 12px;
  font-size: 14px;
}

.thumbnail-hint {
  font-size: 12px;
  color: #777;
  margin-top: 4px;
}

.button-group {
  margin-top: 32px;
}

/* 채팅 섹션 스타일 */
.chat-section {
  width: 360px;
  background: #141517;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #222;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 14px;
  font-weight: 600;
}

.chat-count {
  font-size: 13px;
  color: #888;
}

.chat-messages {
  flex: 1;
  overflow-y: scroll; /* auto 대신 scroll 사용하여 항상 스크롤바 표시 */
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-chat-text {
  color: #777;
  font-size: 14px;
  text-align: center;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  padding: 6px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.chat-message:hover {
  background-color: rgba(50, 50, 50, 0.5);
}

.sender {
  color: #727cf5;
  font-weight: 600;
  margin-right: 6px;
  transition: text-shadow 0.2s ease;
}

.chat-message:hover .sender {
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
}

.message-content {
  color: #eee;
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #222;
  display: flex;
  gap: 8px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #2d2d2d;
  border-radius: 4px;
  background: #1e1e1e;
  color: #fff;
  font-size: 13px;
}

.chat-input input:focus {
  outline: none;
  border-color: #727cf5;
}

.chat-input button {
  padding: 8px 16px;
  background: #727cf5;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-input button:hover {
  background: #5a67d8;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 스크롤바 스타일 - 제거 (글로벌 스타일로 대체) */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(45, 45, 45, 0.7); /* 반투명한 어두운 회색 */
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(61, 61, 61, 0.8); /* 호버 시 더 진한 색상 */
}

/* 모달 스타일 */
.custom-modal {
  background-color: #1e2029;
  color: #fff;
  border-radius: 8px;
}

.modal-title {
  display: flex;
  align-items: center;
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-content {
  padding: 20px;
  font-size: 1rem;
}

.modal-sub-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-top: 8px;
}

.modal-actions {
  padding: 12px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* 컨텍스트 메뉴 스타일 */
.context-menu {
  position: fixed;
  background-color: #1e2029;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 8px 0;
  z-index: 9999;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  min-width: 150px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 10px 16px;
  cursor: pointer;
  color: #fff;
  font-size: 14px;
  transition: all 0.2s;
  margin: 0 4px;
  border-radius: 4px;
}

.context-menu li:hover {
  background-color: rgba(114, 124, 245, 0.3);
}

/* 신고 관련 스타일 */
.reported-message-card {
  background-color: #2a2a2a !important;
  border-left: 3px solid #ff5252;
}

.own-message {
  background-color: rgba(114, 124, 245, 0.1);
  margin-left: auto;
  border-radius: 8px;
  max-width: 80%;
}
</style>

<style>
/* 전역 스타일로 채팅 스크롤바 정의 */
.chat-messages::-webkit-scrollbar {
  width: 10px; /* 더 두껍게 만들어 가시성 높임 */
  height: 10px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.7); /* 더 밝은 흰색 */
  border-radius: 4px;
  border: 2px solid transparent; /* 테두리 추가로 가시성 향상 */
  background-clip: padding-box;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* 채팅 컨테이너에 추가적인 스크롤바 표시 설정 */
.chat-messages {
  -ms-overflow-style: none; /* IE/Edge */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: rgba(255, 255, 255, 0.7) transparent; /* Firefox */
}
</style>
  
  