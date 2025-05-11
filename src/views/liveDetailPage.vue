<template>
  <div class="live-detail-container" v-bind="$attrs">
    <div class="stream-content">
      <div class="live-main">
        <div class="video-section">
          <div class="video-container">
            <video
              ref="video"
              autoplay
              muted
              playsinline
              width="1440"
            ></video>
            <div class="video-controls">
              <div class="control-group">
                <div class="volume-control">
                  <button class="control-button" @click="toggleMute">
                    <svg v-if="isMuted" viewBox="0 0 24 24">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                    </svg>
                    <svg v-else-if="volume > 0.5" viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                    <svg v-else viewBox="0 0 24 24">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                    </svg>
                  </button>
                  <div class="volume-slider">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      :value="volume"
                      @input="changeVolume"
                    />
                  </div>
                </div>
                <button class="control-button" @click="togglePlay">
                  <svg v-if="isPlaying" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
              <div class="control-group">
                <button class="control-button" @click="togglePip">
                  <svg viewBox="0 0 24 24">
                    <path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 1.98 2 1.98h18c1.1 0 2-.88 2-1.98V5c0-1.1-.9-2-2-2zm0 16.01H3V4.98h18v14.03z"/>
                  </svg>
                </button>
                <button class="control-button" @click="toggleFullscreen">
                  <svg v-if="isFullscreen" viewBox="0 0 24 24">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="stream-header">
        <div class="stream-info">
          <div class="stream-title-section">
            <h1 class="stream-title">{{ streamInfo.title }}</h1>
            <div class="stream-meta">
              <span 
                class="category"
                @click="goToCategory(streamInfo.category)"
              >{{ streamInfo.category }}</span>
              <div class="hashtags" v-if="streamInfo.hashTag && streamInfo.hashTag.length > 0">
                <span class="dot"> </span>
                <span v-for="tag in streamInfo.hashTag" :key="tag" class="hashtag">{{ tag }}</span>
              </div>
              <span class="dot"> </span>
              <span class="viewer-count">{{ streamInfo.viewerCount+1 }}명 시청 중</span>
              <span class="dot"> </span>
              <span class="uptime">{{ formattedUptime }} 스트리밍 중</span>
            </div>
          </div>
          
          <div class="streamer-section">
            <div class="streamer-info">
              <div 
                class="streamer-avatar"
                :class="{ 'streaming-active': streamerInfo.streamingYn === 'Y' }"
                @click="goToStreamerProfile(streamInfo.memberId)"
              >
                <img v-if="streamerInfo.streamerProfileImageUrl" :src="streamerInfo.streamerProfileImageUrl" alt="스트리머 프로필">
                <div v-if="streamerInfo.streamingYn === 'Y'" class="live-badge">
                  LIVE
                </div>
              </div>
              <div class="streamer-details">
                <span 
                  class="streamer-name"
                  @click="goToStreamerProfile(streamInfo.memberId)"
                >{{ streamerInfo.streamerNickName }}</span>
                <span class="follower-count">팔로워 {{ streamerInfo.followerCount }}명</span>
              </div>
            </div>
            <div 
              class="stream-actions" 
              v-if="isLogin && !isOwnProfile"
            >
              <button 
                class="follow-button" 
                :class="{ 'following': streamerInfo.isFollow === 'Y' }"
                @click="toggleFollow"
              >
                {{ streamerInfo.isFollow === 'Y' ? '팔로잉' : '팔로우' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 스트리머 동영상/클립 컴포넌트 추가 -->
      <StreamerVideos 
        :streamerId="streamInfo.memberId" 
        :streamerName="streamerInfo.streamerNickName" 
        :limit="4"
      />
      
      <StreamerClips 
        :streamerId="streamInfo.memberId" 
        :streamerName="streamerInfo.streamerNickName" 
        :limit="4"
      />
    </div>

    <div class="chat-section">
      <div class="chat-header">
        <span class="chat-title">실시간 채팅</span>
        <div class="chat-info">
          <span class="chat-count">1.2K</span>
        </div>
      </div>
      <div class="chat-messages" ref="chatContainer">
        <div
          v-for="message in filteredMessages"
          :key="message.messageId"
          class="chat-message"
          :class="{ 'own-message': message.memberId === memberId, 'donation-message': message.type === 'CHAT_DONATION' }"
          @contextmenu.prevent="openContextMenu($event, message)"
        >
          <template v-if="blockedUsers.has(message.memberId)">
            <span class="blocked-message">
              내가 차단한 작성자의 채팅입니다
              <span class="unblock-link" @click.stop="promptUnblock(message.memberId)">차단 해제</span>
            </span>
          </template>
          <template v-else-if="reportedUsers.has(message.memberId)">
            <span class="reported-message">내가 신고한 작성자의 채팅입니다</span>
          </template>
          <template v-else-if="message.type === 'CHAT_DONATION'">
            <div class="donation-box">
              <div class="donation-header">
                <span class="donation-title">{{ message.donationSender || message.sender }}</span>
                <span class="donation-amount">🍒 {{ formatNumber(message.berryAmount) }}</span>
              </div>
              <div class="donation-body">
                <span class="message-content">{{ message.message }}</span>
              </div>
            </div>
          </template>
          <template v-else>
            <span class="sender" :style="message.type === 'TALK' ? getUsernameColor(message.sender) : ''">{{ message.sender }}</span>
            <span class="message-content">{{ message.message }}</span>
          </template>
        </div>

        <div
          v-if="contextMenu.visible"
          class="context-menu"
          :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        >
          <ul>
            <li v-if="!blockedUsers.has(selectedMessage?.memberId)" @click="showBlockModal = true">🚫 차단하기</li>
            <li v-else @click="promptUnblock(selectedMessage?.memberId)">🔓 차단 해제</li>
            <li v-if="!reportedUsers.has(selectedMessage?.memberId)" @click="showReportModal = true">🚨 신고하기</li>
            <li v-else @click="showAlreadyReportedModal = true">🚨 신고 내역 보기</li>
            <!-- 매니저인 경우에만 임시제한 버튼 표시 -->
            <li v-if="isManagerHere && !isTempBannedUser(selectedMessage?.memberId)" @click="tempBanUser">⛔ 임시제한</li>
            <li v-if="isManagerHere && isTempBannedUser(selectedMessage?.memberId)" @click="releaseTempBan">✅ 임시제한 해제</li>
          </ul>
        </div>
      </div>
      <div class="chat-input">
        <input
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="채팅을 입력하세요"
          :disabled="!isConnected"
        />
        <button @click="sendMessage" :disabled="!isConnected">전송</button>
      </div>
      <div class="donation-buttons">
        <button class="donation-button" @click="toggleChatDonation" :disabled="!isLogin">
          <span class="donation-icon">🗨️ </span>
          <span class="donation-amount">채팅 후원</span>
        </button>
        <button class="donation-button" @click="toggleMissionDonation" :disabled="!isLogin">
          <span class="donation-icon">🎯</span>
          <span class="donation-amount">미션 후원</span>
        </button>
      </div>

      <!-- 채팅 후원 드롭다운 추가 -->
      <div class="chat-donation-dropdown" v-if="showChatDonation">
        <div class="dropdown-header">
          <span class="dropdown-title">채팅 후원하기</span>
          <button class="close-button" @click="toggleChatDonation">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="dropdown-content">
          <div class="my-berry-info">
            <div class="berry-icon">🍒</div>
            <div class="berry-text">
              <div class="berry-label">내 보유 베리</div>
              <div class="berry-value">{{ userBerryAmount }} 개</div>
            </div>
            <button class="berry-refresh" @click="refreshMyBerry">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
          <div class="donation-input-group">
            <label>후원 메시지</label>
            <input 
              v-model="donationMsg" 
              type="text" 
              placeholder="후원 메시지를 입력하세요"
              maxlength="30"
            />
            <div class="char-count">{{ donationMsg.length }}/30</div>
          </div>
          <div class="donation-amount-group">
            <label>후원 베리</label>
            <div class="amount-input">
              <input 
                v-model="donationAmount" 
                type="number" 
                min="100"
                placeholder="후원할 베리 수량"
              />
              <span class="berry-unit">베리</span>
            </div>
            <div class="amount-presets">
              <button @click="donationAmount += 1000">1,000</button>
              <button @click="donationAmount += 5000">5,000</button>
              <button @click="donationAmount += 10000">10,000</button>
              <button @click="donationAmount += 50000">50,000</button>
            </div>
          </div>
          <button 
            class="donate-button"
            :class="{ 'charge-donate-button': userBerryAmount < donationAmount }"
            :disabled="donationAmount < 1000 || !donationMsg || !isLogin || loading"
            @click="userBerryAmount < donationAmount ? chargeAndDonate() : sendDonation()"
          >
            {{ loading ? '처리 중...' : userBerryAmount < donationAmount ? '충전하고 후원하기' : '후원하기' }}
          </button>
        </div>
      </div>

      <!-- 미션 후원 드롭다운 추가 -->
      <div class="chat-donation-dropdown mission-donation-dropdown" v-if="showMissionDonation">
        <div class="dropdown-header">
          <span class="dropdown-title">미션 후원하기</span>
          <button class="close-button" @click="toggleMissionDonation">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div class="dropdown-content">
          <div class="my-berry-info">
            <div class="berry-icon">🍒</div>
            <div class="berry-text">
              <div class="berry-label">내 보유 베리</div>
              <div class="berry-value">{{ userBerryAmount }} 개</div>
            </div>
            <button class="berry-refresh" @click="refreshMyBerry">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
              </svg>
            </button>
          </div>
          <div class="donation-input-group">
            <label>미션 내용</label>
            <input 
              v-model="missionMsg" 
              type="text" 
              placeholder="스트리머에게 요청할 미션을 입력하세요"
              maxlength="30"
            />
            <div class="char-count">{{ missionMsg.length }}/30</div>
          </div>
          <div class="donation-input-group">
            <label>제한 시간</label>
            <input 
              v-model="missionDeadlineFormatted" 
              type="text" 
              placeholder="제한 시간 형식: 00:30:00"
              @input="validateTimeFormat"
              :class="{ 'invalid': !isValidDeadline }"
            />
            <div class="time-hint" :class="{ 'time-error': !isValidDeadline }">
              {{ isValidDeadline ? 'HH:MM:SS 형식으로 입력해주세요' : 'HH:MM:SS 형식으로 입력해주세요 (최대 3시간)' }}
            </div>
          </div>
          <div class="donation-amount-group">
            <label>후원 베리</label>
            <div class="amount-input">
              <input 
                v-model="missionAmount" 
                type="number" 
                min="1000"
                placeholder="후원할 베리 수량 (최소 1,000베리)"
              />
              <span class="berry-unit">베리</span>
            </div>
            <div class="amount-presets">
              <button @click="missionAmount += 1000">1,000</button>
              <button @click="missionAmount += 5000">5,000</button>
              <button @click="missionAmount += 10000">10,000</button>
              <button @click="missionAmount += 50000">50,000</button>
            </div>
          </div>
          <button 
            class="donate-button"
            :class="{ 'charge-donate-button': userBerryAmount < missionAmount }"
            :disabled="missionAmount < 1000 || !missionMsg || !isLogin || missionLoading || !isValidDeadline"
            @click="userBerryAmount < missionAmount ? chargeAndMissionDonate() : sendMissionDonation()"
          >
            {{ missionLoading ? '처리 중...' : userBerryAmount < missionAmount ? '충전하고 미션 후원하기' : '미션 후원하기' }}
          </button>
        </div>
      </div>
    </div>

    <ReportModal
      v-model="showReportModal"
      :message="selectedMessage"
      @submit="handleReport"
    />

    <BlockModal
      v-model="showBlockModal"
      :message="selectedMessage"
      @confirm="handleBlock"
    />

    <!-- 이미 신고한 사용자에 대한 안내 모달 -->
    <v-dialog v-model="showAlreadyReportedModal" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="warning">mdi-alert-circle</v-icon>
          신고 내역 안내
        </v-card-title>
        <v-card-text class="modal-content">
          <p>이미 신고한 사용자입니다.</p>
          <p class="modal-sub-text">해당 사용자에 대한 신고가 접수되었으며, 처리 중입니다.</p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showAlreadyReportedModal = false">확인</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 차단 해제 확인 모달 -->
    <v-dialog v-model="showUnblockModal" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="primary">mdi-shield-off</v-icon>
          차단 해제
        </v-card-title>
        <v-card-text class="modal-content">
          <p>해당 사용자의 차단을 해제하시겠습니까?</p>
          <p class="modal-sub-text">차단을 해제하면 채팅 메시지가 다시 표시됩니다.</p>
        </v-card-text>
        <v-card-actions class="modal-actions">
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="showUnblockModal = false">취소</v-btn>
          <v-btn color="primary" @click="unblockUser">해제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 임시제한 모달 추가 -->
    <v-dialog v-model="tempBanModalVisible" max-width="400">
      <v-card class="custom-modal">
        <v-card-title class="modal-title">
          <v-icon left color="warning">mdi-account-cancel</v-icon>
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
          <v-icon left color="success">mdi-account-check</v-icon>
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

    <!-- 귀여운 알림 모달 -->
    <v-dialog v-model="cuteAlertModal.show" max-width="400">
      <v-card class="cute-alert-modal">
        <div class="cute-alert-bubble">
          <div class="cute-alert-icon" :class="cuteAlertModal.type">
            <v-icon v-if="cuteAlertModal.type === 'success'" size="36">mdi-check-circle</v-icon>
            <v-icon v-else-if="cuteAlertModal.type === 'error'" size="36">mdi-alert-circle</v-icon>
            <v-icon v-else-if="cuteAlertModal.type === 'warning'" size="36">mdi-alert</v-icon>
            <v-icon v-else-if="cuteAlertModal.type === 'info'" size="36">mdi-information</v-icon>
            <v-icon v-else size="36">mdi-emoticon</v-icon>
          </div>
          <div class="cute-alert-content">
            <h3 class="cute-alert-title">{{ cuteAlertModal.title }}</h3>
            <p class="cute-alert-message">{{ cuteAlertModal.message }}</p>
          </div>
        </div>
        <v-card-actions class="cute-alert-actions">
          <v-spacer></v-spacer>
          <v-btn 
            :color="cuteAlertModal.btnColor" 
            class="cute-alert-btn" 
            @click="cuteAlertModal.show = false"
          >
            {{ cuteAlertModal.btnText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  
  <!-- Teleport를 사용하여 body에 직접 렌더링 -->
  <Teleport to="body">
    <div 
      v-if="showTempBanModal" 
      class="global-temp-ban-modal"
    >
      <div class="temp-ban-content">
        <div class="temp-ban-icon">⚠️</div>
        <div class="temp-ban-message">
          <div class="temp-ban-title">채팅 임시제한</div>
          <div class="temp-ban-info">
            운영정책 위반으로 채팅이 임시제한되었습니다.<br>
            만료시간까지 <span class="temp-ban-time">{{ formattedRemainingTime }}</span> 남았습니다.
          </div>
        </div>
      </div>
    </div>
  </Teleport>

    <!-- 충전 모달 추가 -->
    <v-dialog v-model="chargeModalOpen" max-width="500" content-class="berry-charge-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">베리 충전하기</div>
          <v-btn icon @click="closeChargeModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="charge-input-group">
            <div class="input-label">충전할 베리</div>
            <div class="charge-input-container">
              <div class="charge-icon">
                <v-icon icon="mdi-fruit-cherries" color="#b084cc" size="large"></v-icon>
              </div>
              <div class="charge-amount">{{ formatNumber(chargeAmount) }}</div>
              <v-btn icon class="clear-btn" @click="clearAmount" v-if="chargeAmount > 0">
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
            </div>
          </div>
          
          <div class="amount-buttons">
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(1000)">+1천</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(5000)">+5천</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(10000)">+1만</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(100000)">+10만</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(1000000)">+100만</v-btn>
          </div>
          
          <div class="total-price-container">
            <div class="total-price-label">최종 결제금액</div>
            <div class="total-price-value">{{ formatNumber(Math.round(chargeAmount * 1.1)) }}원</div>
          </div>
          
          <div class="agreement-text">
            내용을 확인했으며 베리 충전에 동의합니다.
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            :disabled="loading || !sdkLoaded || chargeAmount < 1000" 
            @click="startPayment"
            class="submit-btn"
          >
            {{ loading ? "결제 중..." : "베리 충전하기" }}
          </v-btn>
        </div>
      </div>
    </v-dialog>
    
    <!-- 결제 실패 모달 -->
    <v-dialog v-model="failureModalOpen" max-width="500" content-class="berry-charge-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">결제 실패</div>
          <v-btn icon @click="closeFailureModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="failure-message-container">
            <v-icon icon="mdi-alert-circle" color="#ff5252" size="x-large" class="failure-icon"></v-icon>
            <div class="failure-message">{{ failureMessage }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            @click="closeFailureModal"
            class="submit-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>
  

  <!-- 성인 콘텐츠 제한 모달 추가 -->
  <v-dialog v-model="adultRestrictionModalOpen" max-width="500" persistent>
    <div class="modal-container">
      <div class="modal-header">
        <div class="modal-title">
          <v-icon left color="error" class="mr-2">mdi-alert-circle</v-icon>
          성인 콘텐츠 제한
        </div>
      </div>
      
      <div class="modal-content adult-restriction-content">
        <p class="adult-main-text">이 방송은 성인 전용 콘텐츠입니다.</p>
        <p>회원님의 연령 정보에 따라 시청이 제한되었습니다.</p>
        <p>건전하고 안전한 서비스 이용을 위해 양해 부탁드립니다.</p>
      </div>
      
      <div class="modal-footer">
        <v-btn 
          color="error" 
          block 
          @click="handleAdultRestrictionConfirm"
          class="submit-btn"
        >
          확인
        </v-btn>
      </div>
    </div>
  </v-dialog>

</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Hls from 'hls.js'
import SockJS from 'sockjs-client'
import Stomp from 'webstomp-client'
import axios from 'axios'
import ReportModal from '@/components/ReportModal.vue'
import BlockModal from '@/components/BlockModal.vue'
import StreamerClips from '@/components/StreamerClips.vue'
import StreamerVideos from '@/components/StreamerVideos.vue'

// 속성 상속 경고 비활성화
defineOptions({
  inheritAttrs: false
})

const route = useRoute()
const router = useRouter()
const video = ref(null)
const streamId = route.params.streamId
const streamingApi = process.env.VUE_APP_STREAMING_API
const memberApi = process.env.VUE_APP_MEMBER_API
const paymentApi = process.env.VUE_APP_PAYMENT_API
const selectedMessage = ref(null)
const contextMenu = ref({ visible: false, x: 0, y: 0 })

// 스트리밍 정보
const streamInfo = ref({
  streamId: null,
  memberId: null,
  streamKey: '',
  title: '',
  roomId: null,
  minDonation: 0,
  adultYn: '',
  category: '',
  hashTag: [],
  managerRole: '',
  startTime: '',
  viewerCount: 0
})

// 스트리머 정보
const streamerInfo = ref({
  streamerNickName: '',
  streamerProfileImageUrl: '',
  streamingYn: '',
  followerCount: 0,
  isFollow: ''
})

// 채팅 관련 상태
const messages = ref([])
const newMessage = ref('')
const memberId = ref(null)
const senderNickname = ref(null)
const stompClient = ref(null)
const isConnected = ref(false)
const isLogin = ref(false)
const token = ref(localStorage.getItem('token'))

// 추가된 상태
const formattedUptime = ref('00:00:00')

// 비디오 관련 상태
const isPlaying = ref(true)
const isMuted = ref(true)
const volume = ref(0)
const isPip = ref(false)
const isFullscreen = ref(false)
const lastVolume = ref(0.5) // 마지막 볼륨값 저장

// 차단/신고 관련 상태 추가
const blockedUsers = ref(new Set())
const reportedUsers = ref(new Set())
const blockedUserDetails = ref([]) // 차단 해제를 위한 상세 정보 저장
const showAlreadyReportedModal = ref(false)
const showUnblockModal = ref(false)
const selectedUserToUnblock = ref(null)


// 임시제한 관련 변수 추가
const isTempBanned = ref(false)
const tempBanExpireTime = ref(null)
const remainingTime = ref(0)
const showTempBanModal = ref(false)
const tempBanTimerId = ref(null)
const formattedRemainingTime = ref('')

// 추가적인 상태
const showChatDonation = ref(false)
const userBerryAmount = ref(0)
const donationMsg = ref('')
const donationAmount = ref(1000)
const loading = ref(false)
const sdkLoaded = ref(false)
const chargeModalOpen = ref(false)
const chargeAmount = ref(1000)
const failureModalOpen = ref(false)
const failureMessage = ref('')
const adultRestrictionModalOpen = ref(false)  // 성인 콘텐츠 제한 모달
const showMissionDonation = ref(false)
const missionMsg = ref('')
const missionAmount = ref(1000) // 최소 1,000베리로 변경
const missionLoading = ref(false)
const missionDeadline = ref(1800) // 기본값 30분(초 단위로 계산: 30분 = 1800초)
const missionDeadlineFormatted = ref('00:30:00') // 포맷팅된 시간
const isValidDeadline = ref(true) // 시간 형식 유효성

// 사용자 이름 색상을 위한 색상 배열 추가
const colors = ref([
  '#FF5E5B', '#D8315B', '#1EA896', '#3E92CC', '#C3BD78', 
  '#7768AE', '#FFB400', '#4AAB95', '#FF7A5A', '#7AC74F',
  '#00A5E0', '#8A4FFF', '#FF9505', '#9A348E', '#0077B6'
])

const memberAdultYn = async () => {
  try {
    const response = await axios.get(`${memberApi}/member/detail/${memberId.value}`)
    if(response.data.result.adult === 'Y'){
      return true
    }else{
      return false
    }
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error)
    return false
  }
}

// 채팅 관련 함수
const prepareToken = async () => {
  token.value = localStorage.getItem('token');
  isLogin.value = false;
  memberId.value = null;
  senderNickname.value = null;
  
  console.log('토큰 유무:', !!token.value);
  
  if (token.value) {
    try {
      const response = await axios.get(`${memberApi}/member/isMember`, {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      });
      
      // response.data.result가 존재하면 로그인 상태로 설정
      if (response.data && response.data.result) {
        memberId.value = response.data.result.memberId;
        senderNickname.value = response.data.result.memberNickname;
        isLogin.value = true;
      }
      
      console.log('사용자 정보 설정 완료:', {
        memberId: memberId.value,
        nickname: senderNickname.value,
        isLogin: isLogin.value
      });
    } catch (error) {
      console.error('사용자 정보 확인 실패:', error);
      isLogin.value = false;
      memberId.value = null;
      senderNickname.value = null;
    }
  }
  
  console.log('최종 로그인 상태:', isLogin.value, '멤버ID:', memberId.value);
}

const getStreamInfo = async () => {
  try {
    const response = await axios.get(`${streamingApi}/streaming/streamInfo/${streamId}`)
    if (response.data && response.data.result) {
      streamInfo.value = response.data.result
      console.log('스트리밍 정보:', streamInfo.value)
      console.log('스트리밍 정보:', streamInfo)
      return true
    } else {
      console.error('스트리밍 정보가 없습니다:', response.data)
      return false
    }
  } catch (error) {
    console.error('스트리밍 정보 로드 실패:', error)
    return false
  }
}

const myBerry = async () => {
  try {
    const response = await axios.get(`${paymentApi}/payment/my/berry`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    console.log('내 베리 정보:', response.data.result.balance)
    userBerryAmount.value = response.data.result.balance
  } catch (error) {
    console.error('내 베리 정보 로드 실패:', error)
  }
}

const getStreamerInfo = async () => {
  try {
    const response = await axios.get(`${memberApi}/member/info/${streamInfo.value.memberId}`)
    console.log(streamInfo.value.memberId)
    if (response.data && response.data.result) {
      streamerInfo.value = response.data.result
      console.log('스트리머 정보:', streamerInfo)
      return true
    } else {
      console.error('스트리머 정보가 없습니다:', response.data)
      return false
    }
  } catch (error) {
    console.error('스트리머 정보 로드 실패:', error)
    return false
  }
}

const joinChatRoom = async () => {
  if (!token.value) return
  try {
    await axios.post(
      `${streamingApi}/chat/room/join/${streamInfo.value.roomId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      }
    )
    console.log('채팅방 입장')
  } catch (err) {
    console.error('채팅방 참여 실패:', err)
  }
}

const connectWebsocket = () => {
  if (stompClient.value && stompClient.value.connected) return

  const sockJs = new SockJS(`${streamingApi}/connect`)
  stompClient.value = Stomp.over(sockJs)
  stompClient.value.debug = () => {}

  stompClient.value.connect({}, () => {
    console.log('WebSocket 연결 성공')
    isConnected.value = true

    stompClient.value.subscribe(`/topic/${streamInfo.value.roomId}`, (message) => {
      try {
        const parsed = JSON.parse(message.body)
        console.log('수신된 메시지:', parsed)

        console.log('메시지 타입:', parsed.type)
        console.log('메시지 타입 타입:', typeof parsed.type)
        console.log('메시지 타입 문자열 변환:', String(parsed.type))

        const isTemp = isTempBanType(parsed.type)
        const isRelease = isBanReleaseType(parsed.type)

        console.log('임시제한 메시지 여부:', isTemp)
        console.log('임시제한 해제 메시지 여부:', isRelease)

        if (parsed.type === "Adult") {
          handleAdultMessage()
        } else if (isTemp) {
          console.log('임시제한 메시지 감지됨!')
          handleTempBanMessage(parsed)
        } else if (isRelease) {
          console.log('임시제한 해제 메시지 감지됨!')
          handleTempBanReleaseMessage(parsed)
        } else if (parsed.type === "CHAT_DONATION") {
          const fullMessage = parsed.message
          const donationPattern = /(.+)님이 (\d+)원을 후원하셨습니다\.(.*)/
          const match = fullMessage.match(donationPattern)

          let senderName = parsed.sender
          let donationAmount = 1000
          let actualMessage = fullMessage

          if (match && match.length >= 4) {
            senderName = match[1]
            donationAmount = parseInt(match[2])
            actualMessage = match[3]
          }

          messages.value.push({
            messageId: parsed.messageId,
            roomId: parsed.roomId,
            memberId: parsed.memberId,
            message: actualMessage,
            sender: parsed.sender,
            type: parsed.type,
            createdTime: parsed.createdTime,
            berryAmount: donationAmount,
            donationSender: senderName
          })
          scrollToBottom()
        } else {
          messages.value.push({
            messageId: parsed.messageId,
            roomId: parsed.roomId,
            memberId: parsed.memberId,
            message: parsed.message,
            sender: parsed.sender,
            type: parsed.type,
            createdTime: parsed.createdTime
          })
          scrollToBottom()
        }
      } catch (err) {
        console.error('메시지 파싱 실패:', err)
        console.error('원본 메시지:', message.body)
      }
    })
  }, (err) => {
    console.error('WebSocket 연결 실패:', err)
    isConnected.value = false

    setTimeout(() => {
      console.log('WebSocket 재연결 시도 중...')
      connectWebsocket()
    }, 3000)
  })
}

const sendMessage = () => {
  if (!newMessage.value.trim()) return;
  
  console.log('메시지 전송 시도', { 
    임시제한상태: isTempBanned.value,
    만료시간: tempBanExpireTime.value
  });
  
  if (!stompClient.value || !stompClient.value.connected || !isConnected.value) {
    console.warn('stompClient 미연결 상태');
    return;
  }

  if (!isLogin.value) {
    console.error('로그인이 필요합니다.');
    return;
  }

  // ✅ 임시제한 상태 검사
  if (isTempBanned.value && tempBanExpireTime.value) {
    const now = new Date();
    console.log('임시제한 확인', { 
      현재시간: now,
      만료시간: tempBanExpireTime.value,
      남은시간: tempBanExpireTime.value - now,
      조건결과: tempBanExpireTime.value > now
    });

    if (tempBanExpireTime.value > now) {
      // 아직 제한 시간 남아있는 경우
      console.log('임시제한 모달 표시 시작');
      console.warn('임시제한 상태에서는 메시지를 보낼 수 없습니다.');
 
      calculateRemainingTime(); // 남은 시간 갱신
      console.log('남은 시간 갱신 후:', formattedRemainingTime.value);
      
      showTempBanModal.value = true; // 모달 표시
      console.log('모달 표시 상태 설정 후:', showTempBanModal.value);

      // ✅ 3초 후 자동으로 모달 숨기기
      setTimeout(() => {
        showTempBanModal.value = false;
        console.log('3초 후 모달 숨김');
      }, 3000);

      return;
    } else {
      // 제한 만료됨 → 상태 초기화
      console.log('임시제한 만료됨, 상태 초기화');
      isTempBanned.value = false;
      showTempBanModal.value = false;
    }
  }

  // ✅ 메시지 전송
  const messagePayload = {
    message: newMessage.value,
    type: 'TALK'
  };

  stompClient.value.send(
    `/publish/${streamInfo.value.roomId}`,
    JSON.stringify(messagePayload),
    {
      Authorization: `Bearer ${token.value}`,
      'content-type': 'application/json'
    }
  );

  newMessage.value = '';
};

const showReportModal = ref(false)
const showBlockModal = ref(false)

const openContextMenu = async (event, message) => {
  event.preventDefault(); // 기본 컨텍스트 메뉴 방지
  console.log('컨텍스트 메뉴 이벤트 발생:', event.type);
  console.log('메시지 데이터:', message);
  console.log('메시지 ID:', message.messageId);
  console.log('메시지 멤버 ID:', message.memberId);
  console.log('현재 사용자 ID:', memberId.value);
  console.log('로그인 상태:', isLogin.value);
  
  // 로그인하지 않은 사용자는 컨텍스트 메뉴를 열 수 없음
  if (!isLogin.value) {
    console.log('로그인되지 않아 컨텍스트 메뉴를 열 수 없습니다.');
    return;
  }
  
  // 자신의 메시지는 컨텍스트 메뉴를 열지 않음
  if (message.memberId && memberId.value && message.memberId.toString() === memberId.value.toString()) {
    console.log('자신의 메시지라 컨텍스트 메뉴를 열지 않습니다.');
    return;
  }
  
  try {
    // messageId가 있는 경우에만 처리
    if (!message.messageId) {
      console.error('메시지 ID가 없습니다');
      return;
    }
    
    selectedMessage.value = message;
    
    // 컨텍스트 메뉴 위치 설정
    let x = event.clientX;
    let y = event.clientY;
    
    // 화면 우측 경계 체크
    const menuWidth = 150;
    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 10;
    }
    
    // 화면 하단 경계 체크
    const menuHeight = 150;
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 10;
    }
    
    // 기존 컨텍스트 메뉴를 먼저 닫고 새로 열기
    contextMenu.value.visible = false;
    
    // 약간의 지연 후 메뉴 표시
    setTimeout(() => {
      contextMenu.value = {
        visible: true,
        x: x,
        y: y
      };
      
      // 메뉴 외부 클릭 시 닫기
      document.addEventListener('click', closeContextMenu);
    }, 50);
  } catch (error) {
    console.error('컨텍스트 메뉴 열기 실패:', error);
  }
};

const closeContextMenu = () => {
  console.log('컨텍스트 메뉴 닫기 호출됨');
  contextMenu.value.visible = false;
  document.removeEventListener('click', closeContextMenu);
};

const handleReport = async (reportData) => {
  try {
    // 이미 신고한 사용자인지 확인
    if (reportedUsers.value.has(selectedMessage.value.memberId)) {
      showAlreadyReportedModal.value = true;
      return;
    }
    
    console.log('신고 처리 시작 - 원본 데이터:', reportData);
    console.log('메시지 ID 타입:', typeof reportData.reportedChatMessageId);
    
    // messageId가 있는지 확인하고 정수로 변환 시도
    if (!reportData.reportedChatMessageId) {
      console.error('신고할 메시지 ID가 없습니다');
      showCuteAlert('신고할 메시지 ID가 없어 처리할 수 없습니다.', '신고 실패', 'error');
      return;
    }
    
    // 서버로 전송할 데이터 준비
    const payload = {
      reportedChatMessageId: Number(reportData.reportedChatMessageId) || reportData.reportedChatMessageId,
      reportType: reportData.reportType,
      reportReason: reportData.reportReason
    };
    
    console.log('서버로 전송할 최종 신고 데이터:', payload);
    
    const response = await axios.post(`${streamingApi}/chat/report`, payload, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    console.log('신고 응답:', response.data);

    // 신고한 사용자 목록에 추가
    reportedUsers.value.add(selectedMessage.value.memberId);
    
    showReportModal.value = false;
    showCuteAlert('신고가 접수되었습니다.', '신고 완료', 'success');
  } catch (error) {
    console.error('신고 처리 중 오류 발생:', error);
    if (error.response) {
      console.error('오류 응답:', error.response.data);
      console.error('오류 상태:', error.response.status);
    }
    showCuteAlert('신고 처리 중 오류가 발생했습니다.', '신고 실패', 'error');
  }
};

const handleBlock = async (message) => {
  try {
    const response = await axios.post(`${memberApi}/member/block`, null, {
      params: {
        blockMemberId: message.memberId
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    console.log('차단 응답:', response.data);

    // 차단된 사용자 목록에 추가
    blockedUsers.value.add(message.memberId);
    
    // 차단된 사용자의 상세 정보 업데이트를 위해 목록 다시 불러오기
    await loadBlockedUsers();
    
    showBlockModal.value = false;
    showCuteAlert('사용자가 차단되었습니다.', '차단 완료', 'success');
  } catch (error) {
    console.error('차단 처리 중 오류 발생:', error);
    showCuteAlert('차단 처리 중 오류가 발생했습니다.', '차단 실패', 'error');
  }
};

// 차단 해제 프롬프트 표시
const promptUnblock = (userId) => {
  selectedUserToUnblock.value = userId;
  showUnblockModal.value = true;
};

// 차단 해제 실행
const unblockUser = async () => {
  try {
    // 해당 사용자의 차단 ID 찾기
    const blockInfo = blockedUserDetails.value.find(
      item => item.blockMemberId === selectedUserToUnblock.value
    );
    
    if (!blockInfo) {
      console.error('차단 정보를 찾을 수 없습니다.', '선택된 사용자 ID:', selectedUserToUnblock.value);
      console.log('차단 목록 상세 정보:', blockedUserDetails.value);
      showCuteAlert('차단 정보를 찾을 수 없습니다. 페이지를 새로고침하고 다시 시도해주세요.', '차단 해제 실패', 'error');
      return;
    }
    
    console.log('차단 해제 요청 - blockId:', blockInfo.id);
    
    // 차단 해제 API 호출
    const response = await axios.delete(`${memberApi}/member/block/cancel`, {
      params: {
        blockId: blockInfo.id
      },
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    console.log('차단 해제 응답:', response.data);
    
    // 목록에서 제거
    blockedUsers.value.delete(selectedUserToUnblock.value);
    // 상세 정보에서도 제거
    blockedUserDetails.value = blockedUserDetails.value.filter(
      item => item.blockMemberId !== selectedUserToUnblock.value
    );
    
    showUnblockModal.value = false;
    showCuteAlert('차단이 해제되었습니다.', '차단 해제 완료', 'success');
  } catch (error) {
    console.error('차단 해제 중 오류 발생:', error);
    if (error.response) {
      console.error('오류 상태:', error.response.status);
      console.error('오류 응답:', error.response.data);
    }
    showCuteAlert('차단 해제 중 오류가 발생했습니다.', '차단 해제 실패', 'error');
  }
};

const handleAdultMessage = () => {
  // 페이지 새로고침
  window.location.reload();
}

const scrollToBottom = () => {
  const chatContainer = document.querySelector('.chat-messages')
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight
  }
}

const disconnectWebSocket = () => {
  if (stompClient.value && stompClient.value.connected) {
    stompClient.value.disconnect(() => {
      console.log('WebSocket 연결 종료')
      isConnected.value = false
    })
  }
}

// 상태 변수 추가 (script setup 내부)
const isManagerHere = ref(false)
const managerList = ref([])
const tempBannedUsers = ref(new Map()) // 임시제한된 사용자 관리
const tempBanModalVisible = ref(false)
const releaseBanModalVisible = ref(false)

// 매니저 리스트 가져오는 함수 추가
const getManagerList = async () => {
  if (!streamInfo.value || !streamInfo.value.memberId) {
    console.log('스트리머 정보가 없어 매니저 리스트를 불러올 수 없습니다.')
    return
  }

  try {
    const response = await axios.get(`${streamingApi}/manager/managerList/${streamInfo.value.memberId}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    console.log('매니저 리스트 응답:', response.data)
    
    if (response.data && response.data.result) {
      managerList.value = response.data.result
      
      // 현재 사용자가 매니저인지 확인
      if (memberId.value) {
        isManagerHere.value = managerList.value.some(manager => 
          String(manager.managerId) === String(memberId.value)
        )
        console.log('현재 사용자 매니저 여부:', isManagerHere.value)
      }
    }
  } catch (error) {
    console.error('매니저 리스트 불러오기 실패:', error)
  }
}

// 기존 initializeStreaming 함수의 Promise.all 부분에 매니저 목록 로드 추가
const initializeStreaming = async () => {
  try {
    await prepareToken()
    const streamInfoLoaded = await getStreamInfo()
    if (!streamInfoLoaded) return

    await getStreamerInfo()
    console.log('스트리밍 정보 확인:', streamInfo.value)

    // 성인 콘텐츠 체크
    if (streamInfo.value.adult === 'Y') {
      if (!isLogin.value || !memberId.value) {
        showAdultRestrictionModal()
        return
      }

      const isAdult = await memberAdultYn()
      if (!isAdult) {
        showAdultRestrictionModal()
        return
      }
    }

    // 비디오 초기화
    const el = video.value
    if (!streamInfo.value.streamKey) {
      console.error('스트림키가 없습니다.')
      return
    }

    // HLS 주소 설정 
    
    // 배포용
    const hlsSrc = `https://hls.bepl.site/hls/${streamInfo.value.streamKey}.m3u8`

    // 로컬용
    // const hlsSrc = `http://localhost:8088/hls/${streamInfo.value.streamKey}.m3u8`

    console.log('HLS 소스:', hlsSrc)

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(hlsSrc)
      hls.attachMedia(el)
    } else if (el.canPlayType('application/vnd.apple.mpegurl')) {
      el.src = hlsSrc
    }

    // 로그인된 경우: 차단/신고/매니저/채팅 입장 처리
    if (isLogin.value && memberId.value) {
      await Promise.all([
        loadBlockedUsers(),
        loadReportedUsers(),
        getManagerList(),
        joinChatRoom()
      ])
    }

    // WebSocket 연결
    connectWebsocket()

  } catch (error) {
    console.error('초기화 중 오류 발생:', error)
  }
}


// 임시제한 여부 확인 함수 - isTempBanned.value는 전역 상태이므로 다른 함수명 사용
const isTempBannedUser = (userId) => {
  if (!userId) return false
  
  const bannedInfo = tempBannedUsers.value.get(userId.toString())
  if (!bannedInfo) return false
  
  // 만료 시간이 지났는지 확인
  const now = new Date()
  const expireAt = new Date(bannedInfo.expireAt)
  
  if (now > expireAt) {
    // 만료된 경우 목록에서 제거
    tempBannedUsers.value.delete(userId.toString())
    return false
  }
  
  return true
}

// 임시제한 만료 확인 함수 추가
const checkBanExpiration = () => {
  const now = new Date()
  tempBannedUsers.value.forEach((banInfo, userId) => {
    if (now > new Date(banInfo.expireAt)) {
      console.log(`사용자 ${userId}의 임시제한이 만료되었습니다.`)
      tempBannedUsers.value.delete(userId)
    }
  })
}

// 임시제한 모달 표시 함수
const tempBanUser = () => {
  if (selectedMessage.value) {
    tempBanModalVisible.value = true
  }
  contextMenu.value.visible = false
}

// 임시제한 해제 모달 표시
const releaseTempBan = () => {
  if (selectedMessage.value) {
    releaseBanModalVisible.value = true
  }
  contextMenu.value.visible = false
}

// 임시제한 적용 처리
const handleTempBan = async () => {
  if (!selectedMessage.value) {
    tempBanModalVisible.value = false;
    return;
  }
  
  try {
    const response = await axios.post(
      `${streamingApi}/chat/ban/temp`,
      { messageId: selectedMessage.value.messageId },
      {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }
    );
    
    console.log('임시제한 응답:', response.data);
    
    // 성공 시 목록에 추가
    tempBannedUsers.value.set(selectedMessage.value.memberId.toString(), {
      expireAt: new Date(Date.now() + 10 * 60 * 1000), // 기본적으로 10분으로 설정 (실제로는 서버에서 계산)
      nickname: selectedMessage.value.sender
    });
    
    showCuteAlert(`'${selectedMessage.value.sender}'님을 임시제한 했습니다.`, '임시제한 적용', 'success');
  } catch (error) {
    console.error('임시제한 적용 실패:', error);
    showCuteAlert('임시제한 적용에 실패했습니다: ' + (error.response?.data?.message || error.message), '임시제한 실패', 'error');
  } finally {
    tempBanModalVisible.value = false;
  }
};

// 임시제한 해제 처리
const handleReleaseTempBan = async () => {
  if (!selectedMessage.value) {
    releaseBanModalVisible.value = false;
    return;
  }
  
  try {
    const response = await axios.delete(
      `${streamingApi}/chat/ban/temp/release`,
      {
        data: { targetMessageId: selectedMessage.value.messageId },
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }
    );
    
    console.log('임시제한 해제 응답:', response.data);
    
    // 성공 시 목록에서 제거
    tempBannedUsers.value.delete(selectedMessage.value.memberId.toString());
    
    showCuteAlert(`'${selectedMessage.value.sender}'님을 임시제한 해제 했습니다.`, '임시제한 해제', 'success');
  } catch (error) {
    console.error('임시제한 해제 실패:', error);
    showCuteAlert('임시제한 해제에 실패했습니다: ' + (error.response?.data?.message || error.message), '임시제한 해제 실패', 'error');
  } finally {
    releaseBanModalVisible.value = false;
  }
};

// 방송 시작 시간 계산 함수
const calculateUptime = () => {
  if (!streamInfo.value.startTime) return
  
  const startTime = new Date(streamInfo.value.startTime)
  const now = new Date()
  const diff = now - startTime
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  formattedUptime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// 비디오 컨트롤 함수
const togglePlay = () => {
  const el = video.value
  if (!el) return

  if (el.paused) {
    // 일시정지 해제 시 최신 시간에서 5초 전으로 이동
    if (el.seekable.length > 0) {
      const live = el.seekable.end(0)
      el.currentTime = Math.max(0, live - 5)
    }
    el.play()
      .then(() => {
        isPlaying.value = true
      })
      .catch((e) => console.warn('재생 실패:', e))
  } else {
    el.pause()
    isPlaying.value = false
  }
}

const toggleMute = () => {
  const el = video.value
  if (!el) return

  if (isMuted.value) {
    // 음소거 해제 시 마지막 볼륨값으로 복구
    el.muted = false
    el.volume = lastVolume.value
    volume.value = lastVolume.value
  } else {
    // 음소거 시 현재 볼륨값 저장 후 0으로 설정
    lastVolume.value = el.volume
    el.muted = true
    el.volume = 0
    volume.value = 0
  }
  isMuted.value = el.muted
}

const changeVolume = (e) => {
  const el = video.value
  if (!el) return

  const newVolume = parseFloat(e.target.value)
  volume.value = newVolume
  el.volume = newVolume
  el.muted = newVolume === 0
  isMuted.value = el.muted
  
  // 볼륨이 0이 아닐 때 마지막 볼륨값 업데이트
  if (newVolume > 0) {
    lastVolume.value = newVolume
  }
}

const togglePip = async () => {
  if (!document.pictureInPictureEnabled) return
  
  try {
    if (isPip.value) {
      await document.exitPictureInPicture()
    } else {
      await video.value.requestPictureInPicture()
    }
    isPip.value = !isPip.value
  } catch (err) {
    console.error('PIP 모드 전환 실패:', err)
  }
}

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    video.value.requestFullscreen()
      .then(() => {
        isFullscreen.value = true
        // 전체화면 진입 시 재생 상태 확인
        if (isPlaying.value && video.value.paused) {
          togglePlay()
        }
      })
      .catch((err) => console.error('전체화면 진입 실패:', err))
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

// 비디오 이벤트 리스너
const handleVideoEvents = () => {
  const el = video.value
  if (!el) return

  el.addEventListener('playing', () => {
    isPlaying.value = true
  })

  el.addEventListener('pause', () => (isPlaying.value = false))
  
  el.addEventListener('volumechange', () => {
    isMuted.value = el.muted
    volume.value = el.volume
  })

  el.addEventListener('enterpictureinpicture', () => (isPip.value = true))
  el.addEventListener('leavepictureinpicture', () => (isPip.value = false))

  el.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
    el.controls = false // 기본 컨트롤 비활성화
  })

  // 주기적으로 현재 시간이 최신 시간보다 너무 뒤쳐져 있는지 확인
  setInterval(() => {
    if (isPlaying.value && el.seekable.length > 0) {
      const live = el.seekable.end(0)
      const current = el.currentTime
      // 현재 시간이 최신 시간보다 10초 이상 차이나면 최신 시간으로 이동
      if (live - current > 10) {
        el.currentTime = Math.max(0, live - 5)
      }
    }
  }, 5000) // 5초마다 확인
}

const toggleFollow = async () => {
  try {
    await axios.post(`${memberApi}/follow/toggle/${streamInfo.value.memberId}`, null, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    streamerInfo.value.isFollow = streamerInfo.value.isFollow === 'Y' ? 'N' : 'Y'
    // 팔로워 수 업데이트
    if (streamerInfo.value.isFollow === 'Y') {
      streamerInfo.value.followerCount++
    } else {
      streamerInfo.value.followerCount--
    }
    console.log(memberId.value)
    console.log(streamInfo.value.memberId)
  } catch (error) {
    console.error('팔로우 토글 실패:', error)
  }
}

const goToStreamerProfile = (streamerId) => {
  router.push(`/channel/${streamerId}`)
}

const goToCategory = (category) => {
  router.push(`/category/${category}`)
}

// Add a computed property for better handling
const isOwnProfile = computed(() => {
  if (!memberId.value || !streamInfo.value.memberId) return false
  return String(memberId.value) === String(streamInfo.value.memberId)
})

// 차단 목록 불러오기
const loadBlockedUsers = async () => {
  try {
    const response = await axios.get(`${memberApi}/member/my/block/list/simple`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    // 전체 응답 구조 확인을 위한 디버그 로그
    console.log('차단 목록 전체 응답:', response);
    console.log('차단 목록 응답 데이터:', response.data);
    
    // API 응답은 data.result에 있습니다
    const responseData = response.data.result;
    if (responseData && responseData.length > 0) {
      // 응답 데이터 확인
      console.log('차단 목록 실제 데이터:', responseData);
      
      blockedUserDetails.value = responseData;
      
      // Set에 차단된 사용자 ID 추가
      const blockUserIds = responseData.map(item => item.blockMemberId);
      blockedUsers.value = new Set(blockUserIds);
      
      console.log('차단된 사용자 ID 목록:', blockUserIds);
      console.log('차단된 사용자 Set:', blockedUsers.value);
    } else {
      console.warn('차단 목록 데이터가 없습니다');
      blockedUsers.value = new Set();
    }
  } catch (error) {
    console.error('차단 목록 불러오기 실패:', error);
    if (error.response) {
      console.error('오류 응답:', error.response.data);
    }
  }
};

// 신고 목록 불러오기
const loadReportedUsers = async () => {
  try {
    const response = await axios.get(`${streamingApi}/chat/report/mylist`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });
    
    // 전체 응답 구조 확인을 위한 디버그 로그
    console.log('신고 목록 전체 응답:', response);
    console.log('신고 목록 응답 데이터:', response.data);
    
    // API 응답은 data.result에 있습니다
    const responseData = response.data.result;
    if (responseData && responseData.length > 0) {
      // 응답 데이터 확인
      console.log('신고 목록 실제 데이터:', responseData);
      
      // Set에 신고된 사용자 ID 추가
      const reportUserIds = responseData.map(item => item.reportedMemberId);
      reportedUsers.value = new Set(reportUserIds);
      
      console.log('신고된 사용자 ID 목록:', reportUserIds);
      console.log('신고된 사용자 Set:', reportedUsers.value);
    } else {
      console.warn('신고 목록 데이터가 없습니다');
      reportedUsers.value = new Set();
    }
  } catch (error) {
    console.error('신고 목록 불러오기 실패:', error);
    if (error.response) {
      console.error('오류 응답:', error.response.data);
    }
  }
};

// 사용자 이름에 일관된 색상을 적용하는 메서드 추가
const getUsernameColor = (username) => {
  // 간단한 해시 함수로 사용자 이름을 숫자로 변환
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // 색상 배열에서 사용자 이름에 해당하는 색상 선택
  const colorIndex = hash % colors.value.length;
  return { color: colors.value[colorIndex] };
}

// Enum 타입 체크를 위한 임시제한 메시지 타입 확인 로직 강화
const isTempBanType = (type) => {
  if (!type) {
    console.log('타입이 없음:', type);
    return false;
  }
  
  // 직접 타입 확인 로깅
  console.log('타입 확인 중:', type);
  console.log('타입의 종류:', typeof type);
  
  // 1. 문자열인 경우 직접 비교
  if (typeof type === 'string') {
    const isMatch = type === 'BAN_TEMP';
    console.log('문자열 타입 비교 결과:', isMatch);
    return isMatch;
  }
  
  // 2. 객체인 경우 여러 속성 확인
  if (typeof type === 'object') {
    // null 체크
    if (type === null) {
      console.log('타입이 null임');
      return false;
    }
    
    // Enum의 경우 name 속성이나 value 속성 확인
    if (type.name === 'BAN_TEMP') {
      console.log('객체 name 속성 일치');
      return true;
    }
    if (type.value === 'BAN_TEMP') {
      console.log('객체 value 속성 일치');
      return true;
    }
    
    // toString 메서드가 있는 경우
    if (typeof type.toString === 'function') {
      const strType = type.toString();
      console.log('객체 toString 결과:', strType);
      const isMatch = strType.includes('BAN_TEMP');
      console.log('toString 비교 결과:', isMatch);
      return isMatch;
    }
  }
  
  // 3. 숫자나 다른 타입인 경우 문자열로 변환 후 비교
  const strType = String(type);
  console.log('문자열 변환 결과:', strType);
  const isMatch = strType.includes('BAN_TEMP');
  console.log('최종 비교 결과:', isMatch);
  return isMatch;
}

// 임시제한 해제 타입 확인 로직
const isBanReleaseType = (type) => {
  if (!type) return false;
  
  if (typeof type === 'string') {
    return type === 'BAN_RELEASE';
  }
  
  if (typeof type === 'object') {
    // Enum의 경우 name 속성이나 value 속성 확인
    if (type.name === 'BAN_RELEASE') return true;
    if (type.value === 'BAN_RELEASE') return true;
    
    // toString 메서드가 있는 경우
    if (typeof type.toString === 'function') {
      const strType = type.toString();
      return strType.includes('BAN_RELEASE');
    }
  }
  
  // 모든 경우에 해당하지 않으면 문자열 변환 후 비교
  return String(type).includes('BAN_RELEASE');
}

// handleTempBanMessage 함수 전체 수정
const handleTempBanMessage = (banData) => {
  console.log('임시제한 메시지 수신 (전체 데이터):', banData)
  console.log('메시지 타입:', typeof banData.type, banData.type)
  console.log('현재 사용자 ID:', memberId.value, '타입:', typeof memberId.value)
  console.log('제한 대상 ID:', banData.memberId, '타입:', typeof banData.memberId)
  
  // ID 비교 전에 둘 다 존재하는지 확인
  if (!memberId.value || !banData.memberId) {
    console.error('ID 값이 없어 비교할 수 없습니다:', { 
      현재사용자ID: memberId.value, 
      대상ID: banData.memberId 
    })
    return
  }
  
  // 문자열로 변환하여 비교 (가장 안전한 방법)
  const currentIdStr = String(memberId.value).trim()
  const targetIdStr = String(banData.memberId).trim()
  
  console.log('문자열 변환 후 - 현재 ID:', currentIdStr)
  console.log('문자열 변환 후 - 대상 ID:', targetIdStr)
  
  // 엄격한 비교와 함께 디버깅
  const isMatch = currentIdStr === targetIdStr
  console.log('ID 일치 여부 (엄격비교):', isMatch)
  
  // 현재 사용자가 해당 제한의 대상인지 확인
  if (isMatch) {
    console.log('✅ 현재 사용자에게 임시제한이 적용됨')
    
    // additionalData가 있는 경우 파싱
    let expireAt = null
    let durationSeconds = 0
    
    try {
      if (banData.additionalData) {
        console.log('추가 데이터 원본:', banData.additionalData)
        console.log('추가 데이터 타입:', typeof banData.additionalData)
        
        // 문자열이면 파싱, 객체면 그대로 사용
        const additionalInfo = typeof banData.additionalData === 'string' 
          ? JSON.parse(banData.additionalData)
          : banData.additionalData
        
        console.log('파싱된 추가 정보:', additionalInfo)
        
        if (additionalInfo.expireAt) {
          expireAt = new Date(additionalInfo.expireAt)
          console.log('만료 시간 설정:', expireAt)
        }
        
        if (additionalInfo.durationSeconds) {
          durationSeconds = parseInt(additionalInfo.durationSeconds)
          console.log('지속 시간(초):', durationSeconds)
        }
      } else {
        console.log('추가 데이터 없음, 기본값 사용')
        // 추가 데이터가 없어도 기본값으로 설정
        durationSeconds = 30 // 기본 30초
      }
    } catch (error) {
      console.error('추가 정보 처리 중 오류:', error)
      // 오류 발생 시 기본값 설정
      durationSeconds = 30
    }
    
    // 만료 시간이 없으면 현재 시간 + 지속 시간으로 설정
    if (!expireAt && durationSeconds > 0) {
      expireAt = new Date(Date.now() + durationSeconds * 1000)
      console.log('계산된 만료 시간:', expireAt)
    }
    
    // 임시제한 정보 설정
    isTempBanned.value = true
    tempBanExpireTime.value = expireAt || new Date(Date.now() + 30000) // 최소 30초
    
    console.log('임시제한 설정 완료:', {
      isTempBanned: isTempBanned.value,
      expireAt: tempBanExpireTime.value,
      남은시간_밀리초: tempBanExpireTime.value - Date.now()
    })
    
    // 기존 타이머 제거 후 새로 설정
    if (tempBanTimerId.value) {
      clearInterval(tempBanTimerId.value)
      tempBanTimerId.value = null
    }
    
    // 알림 모달로 변경
    showCuteAlert(`채팅이 임시 제한되었습니다. 만료 시간: ${expireAt ? expireAt.toLocaleTimeString() : '알 수 없음'}`, '채팅 제한', 'warning');
    
    // 강제로 모달 표시 업데이트 (Vue의 반응성 트리거)
    nextTick(() => {
      showTempBanModal.value = true
      console.log('모달 표시 상태 (nextTick 후):', showTempBanModal.value)
      
      // 남은 시간 계산 시작
      calculateRemainingTime()
      
      // 1초마다 남은 시간 업데이트
      tempBanTimerId.value = setInterval(() => {
        const stillBanned = calculateRemainingTime()
        console.log('임시제한 남은 시간:', formattedRemainingTime.value)
        if (!stillBanned) {
          console.log('임시제한 시간 만료됨')
          clearInterval(tempBanTimerId.value)
          isTempBanned.value = false
          showTempBanModal.value = false
        }
      }, 1000)
    })
  } else {
    console.log('현재 사용자는 임시제한 대상이 아님')
  }
}

// 임시제한 해제 메시지 처리
const handleTempBanReleaseMessage = (releaseData) => {
  console.log('임시제한 해제 메시지 수신:', releaseData)
  
  // 현재 사용자가 해당 해제의 대상인지 확인
  if (memberId.value && releaseData.memberId && releaseData.memberId.toString() === memberId.value.toString()) {
    console.log('현재 사용자의 임시제한이 해제됨')
    
    // 타이머 정리
    if (tempBanTimerId.value) {
      clearInterval(tempBanTimerId.value)
      tempBanTimerId.value = null
    }
    
    // 상태 초기화
    isTempBanned.value = false
    tempBanExpireTime.value = null
    showTempBanModal.value = false
  }
}

// 남은 시간 계산 함수
const calculateRemainingTime = () => {
  console.log('남은 시간 계산 중...');
  console.log('만료 시간:', tempBanExpireTime.value);
  
  if (!tempBanExpireTime.value) {
    console.log('만료 시간이 없음');
    formattedRemainingTime.value = '0초';
    return false;
  }
  
  const now = new Date();
  const diff = tempBanExpireTime.value - now;
  
  console.log('현재 시간:', now);
  console.log('시간 차이 (밀리초):', diff);
  
  if (diff <= 0) {
    console.log('시간이 만료됨');
    remainingTime.value = 0;
    formattedRemainingTime.value = '0초';
    return false;
  }
  
  remainingTime.value = Math.floor(diff / 1000);
  
  // 분과 초로 변환
  const minutes = Math.floor(remainingTime.value / 60);
  const seconds = remainingTime.value % 60;
  
  if (minutes > 0) {
    formattedRemainingTime.value = `${minutes}분 ${seconds}초`;
  } else {
    formattedRemainingTime.value = `${seconds}초`;
  }
  
  console.log('계산된 남은 시간:', formattedRemainingTime.value);
  return true;
}

onMounted(async () => {
  await initializeStreaming();
  setInterval(calculateUptime, 1000);
  handleVideoEvents();
  document.addEventListener('click', closeContextMenu);
  setInterval(() => {
    checkBanExpiration();
  }, 10000);

  if (isLogin.value) {
    await myBerry();
  }

  loadPaymentSDK();
});

// 채팅 후원 토글 함수
const toggleChatDonation = () => {
  showChatDonation.value = !showChatDonation.value
  if (showChatDonation.value && isLogin.value) {
    refreshMyBerry()
  }
  
  // 미션 후원 드롭다운이 열려있으면 닫기
  if (showChatDonation.value && showMissionDonation.value) {
    showMissionDonation.value = false
  }
}

// 내 베리 정보 갱신
const refreshMyBerry = async () => {
  if (!isLogin.value) return
  
  try {
    const response = await axios.get(`${paymentApi}/payment/my/berry`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    userBerryAmount.value = response.data.result.balance
  } catch (error) {
    console.error('내 베리 정보 로드 실패:', error)
  }
}

// 숫자 포맷팅 함수
const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num)
}

// 후원 전송 함수
const sendDonation = async () => {
  if (!isLogin.value) {
    alert('로그인이 필요합니다.')
    return
  }
  
  if (donationAmount.value < 1000) {
    alert('최소 1000베리 이상 후원해야 합니다.')
    return
  }
  
  if (!donationMsg.value.trim()) {
    alert('후원 메시지를 입력해주세요.')
    return
  }
  
  loading.value = true
  
  try {
    // 후원 API 호출
    console.log(streamInfo.value.memberId)
    console.log(donationAmount.value)
    console.log(donationMsg.value)
    await axios.post(`${paymentApi}/payment/normal/done`, {
      toMemberId: streamInfo.value.memberId,
      useBerry: donationAmount.value,
      donaMessage: donationMsg.value
    })
    
    // 후원 성공 처리
    userBerryAmount.value -= donationAmount.value
    donationMsg.value = ''
    donationAmount.value = 1000
    showChatDonation.value = false
    
    // 후원 메시지 표시는 웹소켓으로 자동 수신됨
  } catch (error) {
    console.error('후원 처리 실패:', error)
    if (error.response && error.response.status === 400 && 
        error.response.data.message === '보유한 베리가 부족합니다.') {
      chargeAndDonate()
    } else {
      alert('후원 처리 중 오류가 발생했습니다.')
    }
  } finally {
    loading.value = false
  }
}

// 충전하고 후원하기 함수 추가
const chargeAndDonate = () => {
  // 충전 모달 열기
  openChargeModal()
  
  // 충전 완료 후 처리를 위한 이벤트 리스너 설정
  const chargeCompleteListener = () => {
    // 충전이 성공적으로 완료되면 베리 잔액 새로고침
    refreshMyBerry()
  }
  
  // 충전 결과 리스너 등록
  window.addEventListener('chargeComplete', chargeCompleteListener, { once: true })
}

// 충전 모달 관련 함수
const openChargeModal = () => {
  chargeAmount.value = 1000
  chargeModalOpen.value = true
  loadPaymentSDK()
}

const closeChargeModal = () => {
  chargeModalOpen.value = false
}

const addAmount = (amount) => {
  chargeAmount.value += amount
}

const clearAmount = () => {
  chargeAmount.value = 0
}

// 결제 관련 함수
const loadPaymentSDK = () => {
  if (!window.IMP) {
    const script = document.createElement("script")
    script.src = "https://cdn.iamport.kr/v1/iamport.js"
    script.onload = () => {
      console.log("포트원 SDK 로딩 완료")
      sdkLoaded.value = true
    }
    script.onerror = () => {
      console.error("포트원 SDK 로딩 실패")
      alert("결제 모듈 로딩에 실패했습니다.")
    }
    document.head.appendChild(script)
  } else {
    sdkLoaded.value = true
  }
}

const closeFailureModal = () => {
  failureModalOpen.value = false
}

const showFailureModal = (message) => {
  failureMessage.value = message
  failureModalOpen.value = true
}

const startPayment = async () => {
  if (chargeAmount.value < 1000) {
    showFailureModal("최소 1,000개 이상 충전 가능합니다.")
    return
  }
  
  loading.value = true

  if (!window.IMP) {
    showFailureModal("결제 모듈이 아직 로딩되지 않았습니다.")
    loading.value = false
    return
  }

  try {
    // 1. 결제 준비 요청
    const readyRes = await axios.post(`${paymentApi}/payment/ready`, {
      quantity: chargeAmount.value
    }, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    const merchantUid = readyRes.data?.result?.merchantUid
    if (!merchantUid) throw new Error("merchantUid가 없습니다.")

    // 2. 결제 요청
    const IMP = window.IMP
    IMP.init("imp24077746")

    const nickname = senderNickname.value || "비회원"
    const email = localStorage.getItem("email") || "unknown@example.com"
    
    // 최종 결제 금액 (베리 * 1.1)
    const totalAmount = Math.round(chargeAmount.value * 1.1)

    IMP.request_pay({
      pg: "html5_inicis",
      pay_method: "easy", // 기본값이지만 카카오페이 등 간편결제 허브에서도 사용 가능
      merchant_uid: merchantUid,
      name: `베리 ${chargeAmount.value}개`,
      amount: totalAmount,
      buyer_name: nickname,
      buyer_email: email
    }, async (rsp) => {
      if (rsp.success) {
        // 3. 결제 승인 요청
        const approveRes = await axios.post(`${paymentApi}/payment/approve`, {
          impUid: rsp.imp_uid,
          merchantUid: rsp.merchant_uid
        }, {
          headers: {
            'Authorization': `Bearer ${token.value}`
          }
        })

        console.log("승인 응답:", approveRes.data)
        
        // 모달 닫기
        closeChargeModal()
        
        // 베리 잔액 갱신
        refreshMyBerry()
        
        // 충전 완료 이벤트 발생
        window.dispatchEvent(new Event('chargeComplete'))
        
      } else {
        // 결제 실패 시
        showFailureModal(rsp.error_msg || "결제에 실패했습니다.")
      }
      loading.value = false
    })
  } catch (error) {
    console.error("결제 처리 중 오류 발생:", error)
    showFailureModal(error.response?.data?.message || "결제 준비 중 오류가 발생했습니다.")
    loading.value = false
  }
}

onBeforeUnmount(() => {
  disconnectWebSocket();
  document.removeEventListener('click', closeContextMenu);
  
  // 임시제한 타이머 정리
  if (tempBanTimerId.value) {
    clearInterval(tempBanTimerId.value)
  }
});

// 귀여운 알림 모달 상태 추가
const cuteAlertModal = ref({
  show: false,
  title: '',
  message: '',
  type: 'info', // success, error, warning, info
  btnText: '확인',
  btnColor: 'primary'
})

// alert 대신 사용할 함수
const showCuteAlert = (message, title = '', type = 'info') => {
  // 타입에 따른 버튼 색상 설정
  let btnColor = 'primary'
  switch(type) {
    case 'success':
      btnColor = 'success'
      break
    case 'error':
      btnColor = 'error'
      break
    case 'warning':
      btnColor = 'warning'
      break
    case 'info':
      btnColor = 'primary'
      break
  }
  
  // 기본 타이틀이 없는 경우 타입에 따라 설정
  let defaultTitle = title
  if (!title) {
    switch(type) {
      case 'success':
        defaultTitle = '성공!'
        break
      case 'error':
        defaultTitle = '오류 발생'
        break
      case 'warning':
        defaultTitle = '주의'
        break
      case 'info':
        defaultTitle = '알림'
        break
    }
  }
  
  cuteAlertModal.value = {
    show: true,
    title: defaultTitle,
    message: message,
    type: type,
    btnText: '확인',
    btnColor: btnColor
  }
}
// 성인 제한 모달 표시 함수 추가
const showAdultRestrictionModal = () => {
  adultRestrictionModalOpen.value = true;
}

// 성인 제한 모달 확인 버튼 핸들러 추가
const handleAdultRestrictionConfirm = () => {
  adultRestrictionModalOpen.value = false;
  router.push('/');
}

// 미션 후원 토글 함수
const toggleMissionDonation = () => {
  showMissionDonation.value = !showMissionDonation.value
  if (showMissionDonation.value && isLogin.value) {
    refreshMyBerry()
  }
  
  // 채팅 후원 드롭다운이 열려있으면 닫기
  if (showMissionDonation.value && showChatDonation.value) {
    showChatDonation.value = false
  }
}

// 미션 후원 전송 함수
const sendMissionDonation = async () => {
  if (!isLogin.value) {
    alert('로그인이 필요합니다.')
    return
  }
  
  if (missionAmount.value < 1000) { // 최소 베리 1,000으로 변경
    alert('최소 1000베리 이상 후원해야 합니다.')
    return
  }
  
  if (!missionMsg.value.trim()) {
    alert('미션 내용을 입력해주세요.')
    return
  }
  
  if (!isValidDeadline.value) {
    alert('유효한 제한 시간을 입력해주세요.')
    return
  }
  
  missionLoading.value = true
  
  try {
    // 미션 후원 API 호출
    await axios.post(`${paymentApi}/payment/mission/done/register`, {
      toMemberId: streamInfo.value.memberId,
      berryAmount: missionAmount.value,
      donationMessage: missionMsg.value,
      deadLine: missionDeadline.value
    }, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })
    
    // 후원 성공 처리
    userBerryAmount.value -= missionAmount.value
    missionMsg.value = ''
    missionAmount.value = 1000 // 초기값 1,000으로 변경
    missionDeadlineFormatted.value = '00:30:00' // 기본 시간으로 초기화
    showMissionDonation.value = false
    
    // 성공 메시지 표시
    showCuteAlert('미션 후원이 성공적으로 등록되었습니다.', '미션 후원 완료', 'success')
    
  } catch (error) {
    console.error('미션 후원 처리 실패:', error)
    if (error.response && error.response.status === 400 && 
        error.response.data.message === '보유한 베리가 부족합니다.') {
      chargeAndMissionDonate()
    } else {
      showCuteAlert('미션 후원 처리 중 오류가 발생했습니다.', '미션 후원 실패', 'error')
    }
  } finally {
    missionLoading.value = false
  }
}

// 충전하고 미션 후원하기 함수
const chargeAndMissionDonate = () => {
  // 충전 모달 열기
  openChargeModal()
  
  // 충전 완료 후 처리를 위한 이벤트 리스너 설정
  const chargeCompleteListener = () => {
    // 충전이 성공적으로 완료되면 베리 잔액 새로고침 후 미션 후원 시도
    refreshMyBerry()
    // 베리가 충분한지 재확인 후 후원 시도
    if (userBerryAmount.value >= missionAmount.value) {
      sendMissionDonation()
    }
  }
  
  // 충전 결과 리스너 등록
  window.addEventListener('chargeComplete', chargeCompleteListener, { once: true })
}

// 시간 형식 검증 함수
const validateTimeFormat = () => {
  const timeRegex = /^(\d{1,2}):(\d{2}):(\d{2})$/
  const match = missionDeadlineFormatted.value.match(timeRegex)
  
  if (!match) {
    isValidDeadline.value = false
    return
  }
  
  const hours = parseInt(match[1])
  const minutes = parseInt(match[2])
  const seconds = parseInt(match[3])
  
  // 유효한 시간인지 검증 (최대 3시간)
  if (hours < 0 || hours > 3 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59 || 
     (hours === 3 && (minutes > 0 || seconds > 0))) {
    isValidDeadline.value = false
    return
  }
  
  isValidDeadline.value = true
  
  // 초 단위로 계산하여 저장
  missionDeadline.value = hours * 3600 + minutes * 60 + seconds
}

// Add a computed property for better handling
const filteredMessages = computed(() => {
  return messages.value.filter(message => {
    // MISSION으로 시작하는 type을 가진 메시지는 표시하지 않음
    if (message.type && message.type.toString().startsWith('MISSION')) {
      return false;
    }
    return true;
  });
});

</script>

<style scoped>
.live-detail-container {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  background: #141517;
  color: #fff;
  position: relative;
  display: flex;
}

.stream-content {
  flex: 1;
  min-width: 0;
  margin-right: 360px;
  display: flex;
  flex-direction: column;
}

.stream-header {
  padding: 20px 24px;
  width: 95%;
  background: #141517;
}

.stream-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stream-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stream-title {
  font-size: 24px;
  font-weight: 500;
  color: #fff;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', sans-serif;
}

.stream-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7B7B7B;
  font-size: 14px;
  margin-bottom: 4px;
}

.category {
  color: #B084CC;
  font-weight: 500;
  font-size: 16px;
  text-shadow: 0 0 1px rgba(0, 255, 132, 0.3);
  cursor: pointer;
}

.dot {
  color: #7B7B7B;
  margin: 0 2px;
}

.streamer-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #2D2D2D;
}

.streamer-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.streamer-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #2D2D2D;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 4px solid transparent;
}

.streaming-active {
  border-color: #ff3b3b;
}

.streamer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.streamer-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.streamer-name {
  font-size: 18px;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}

.streamer-name:hover {
  color: #B084CC;
}

.follower-count {
  font-size: 16px;
  color: #7B7B7B;
  font-weight: 500;
}

.live-badge {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: #ff3b3b;
  color: white;
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 12px;
  text-transform: uppercase;
}

.stream-actions {
  display: flex;
  gap: 12px;
}

.follow-button {
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: #B084CC;
  color: #000;
}

.follow-button.following {
  background: #2D2D2D;
  color: #fff;
}

.follow-button:hover {
  background: #B084CC;
}

.follow-button.following:hover {
  background: #3D3D3D;
}

.live-main {
  width: 100%;
}

.video-section {
  position: relative;
  background: #000;
  width: 100%;
}

.video-container {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
}

.video-container:hover .video-controls {
  opacity: 1;
}

.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
}

.control-button:hover {
  color: #B084CC;
}

.control-button svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.volume-control {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider {
  position: absolute;
  left: 0;
  top: -40px;
  transform: rotate(-90deg);
  transform-origin: left center;
  width: 80px;
  opacity: 0;
  transition: opacity 0.2s;
}

.volume-control:hover .volume-slider {
  opacity: 1;
}

.volume-slider input {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: #7B7B7B;
  border-radius: 2px;
  outline: none;
}

.volume-slider input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #B084CC;
  border-radius: 50%;
  cursor: pointer;
}

.volume-slider input::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #B084CC;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}

video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.chat-section {
  background: #0F0F0F;
  height: 100vh;
  display: flex;
  flex-direction: column;
  width: 360px;
  position: fixed;
  right: 0;
  top: 0;
}

.chat-header {
  padding: 16px;
  border-bottom: 1px solid #2D2D2D;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-title {
  font-size: 14px;
  font-weight: 500;
}

.chat-info {
  font-size: 13px;
  color: #7B7B7B;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  position: relative
}

.chat-message {
  margin-bottom: 8px;
  font-size: 13px;
  line-height: 1.5;
}

.sender {
  color: #B084CC;
  font-weight: 500;
  margin-right: 6px;
  transition: all 0.2s ease;
}

.chat-message:hover .sender {
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.5);
}

.chat-message:hover {
  background-color: rgba(50, 50, 50, 0.3);
}

.message-content {
  color: #fff;
  word-break: break-all;
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #2D2D2D;
  display: flex;
  gap: 8px;
  margin-bottom: 0px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #2D2D2D;
  border-radius: 4px;
  background: #2D2D2D;
  color: #fff;
  font-size: 13px;
}

.chat-input input:focus {
  outline: none;
  border-color: #B084CC;
}

.chat-input button {
  padding: 8px 16px;
  background: #B084CC;
  color: #000;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  cursor: pointer;
}

.chat-input button:hover {
  background: #B084CC;
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #2D2D2D;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #3D3D3D;
}

.donation-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  padding: 12px;
  background: #0F0F0F;
  border-top: 1px solid #2D2D2D;
  margin-bottom: 10px;
}

.donation-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  background: #1A1A1A;
  color: #fff;
  border: 1px solid #2D2D2D;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.donation-button:hover {
  background: #2D2D2D;
  border-color: #3D3D3D;
}

.donation-button.highlight {
  background: #B084CC;
  color: #000;
  border: none;
  font-weight: 500;
}

.donation-button.highlight:hover {
  background: #B084CC;
}

.donation-icon {
  font-size: 14px;
}

.donation-amount {
  font-weight: 500;
}

.hashtags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hashtag {
  color: #7B7B7B;
  font-size: 14px;
  font-weight: 500;
  padding: 2px 8px;
  background: #1A1A1A;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hashtag:hover {
  background: #2D2D2D;
}

.viewer-count {
  color: #C9CEDC;
  font-weight: 500;
  font-size: 14px;
}

.uptime {
  color: #C9CEDC;
  font-weight: 500;
  font-size: 14px;
}

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
  background-color: rgba(176, 132, 204, 0.3);
}

.blocked-message,
.reported-message {
  color: #999;
  font-style: italic;
  font-size: 0.9em;
  padding: 4px 8px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.reported-message {
  color: #ff6b6b;
}

.unblock-link {
  color: #b084cc;
  text-decoration: underline;
  cursor: pointer;
  margin-left: 6px;
  font-style: normal;
}

.unblock-link:hover {
  color: #9e70b9;
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
  font-weight: 500;
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
  padding: 12px 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 임시제한 모달 스타일 수정 */
.temp-ban-modal,
.global-temp-ban-modal {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 40, 40, 0.95);
  border-radius: 8px;
  padding: 16px 20px;
  z-index: 100000; /* 매우 높은 z-index 값 설정 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  animation: slideDown 0.3s ease-out, pulse 2s infinite ease-in-out;
  max-width: 90%;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 4px solid #ff3b3b;
  pointer-events: auto; /* 포인터 이벤트 허용 */
}

.temp-ban-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.temp-ban-icon {
  font-size: 24px;
  margin-top: 2px;
}

.temp-ban-message {
  color: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.temp-ban-title {
  font-weight: 600;
  font-size: 16px;
  color: #ff3b3b;
}

.temp-ban-info {
  font-size: 14px;
  line-height: 1.5;
}

.temp-ban-time {
  font-weight: 600;
  color: #ff3b3b;
}

@keyframes slideDown {
  from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
  to { transform: translateX(-50%) translateY(0); opacity: 1; }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 59, 59, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(255, 59, 59, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 59, 59, 0); }
}

/* 귀여운 알림 모달 스타일 */
.cute-alert-modal {
  background-color: #1e2029;
  color: #fff;
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(176, 132, 204, 0.1) !important;
  border: none !important;
  transform: scale(1.03);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.cute-alert-modal:hover {
  transform: scale(1.05);
}

.cute-alert-bubble {
  position: relative;
  display: flex;
  padding: 24px;
  align-items: center;
  gap: 16px;
  overflow: hidden;
}

.cute-alert-bubble::before {
  content: '';
  position: absolute;
  top: -80px;
  left: -80px;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  filter: blur(30px);
  z-index: 0;
  opacity: 0.3;
}

.cute-alert-icon {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cute-alert-icon.success {
  background: linear-gradient(135deg, #4CAF50, #8BC34A);
}

.cute-alert-icon.error {
  background: linear-gradient(135deg, #FF5252, #FF8A80);
}

.cute-alert-icon.warning {
  background: linear-gradient(135deg, #FFC107, #FFEB3B);
}

.cute-alert-icon.info {
  background: linear-gradient(135deg, #2196F3, #4FC3F7);
}

.cute-alert-bubble:has(.success)::before {
  background: radial-gradient(circle, #4CAF50, transparent);
}

.cute-alert-bubble:has(.error)::before {
  background: radial-gradient(circle, #FF5252, transparent);
}

.cute-alert-bubble:has(.warning)::before {
  background: radial-gradient(circle, #FFC107, transparent);
}

.cute-alert-bubble:has(.info)::before {
  background: radial-gradient(circle, #2196F3, transparent);
}

.cute-alert-content {
  position: relative;
  z-index: 1;
  flex: 1;
}

.cute-alert-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #fff;
}

.cute-alert-message {
  font-size: 16px;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.cute-alert-actions {
  padding: 0 24px 24px 24px;
  display: flex;
  justify-content: flex-end;
}

.cute-alert-btn {
  border-radius: 30px !important;
  padding: 0 24px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
  text-transform: capitalize !important;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2) !important;
  transition: all 0.2s ease !important;
}

.cute-alert-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.3) !important;
}

.cute-alert-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
}

/* 전역 스타일 (Teleport에 사용되는 스타일) */
.global-temp-ban-modal {
  position: fixed;
  top: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(40, 40, 40, 0.95);
  border-radius: 8px;
  padding: 16px 20px;
  z-index: 999999; /* 최대한 높은 z-index 값 설정 */
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(255, 59, 59, 0.3);
  animation: global-pulse 2s infinite ease-in-out;
  max-width: 90%;
  width: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 4px solid #ff3b3b;
  pointer-events: auto; /* 포인터 이벤트 허용 */
  font-family: -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', 'Noto Sans KR', sans-serif !important;
  
  /* 부드러운 애니메이션 효과 추가 */
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

/* 페이드 슬라이드 애니메이션 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-30px);
}

/* 다른 Vue 컴포넌트가 모달을 가리지 않도록 합니다 */
body .global-temp-ban-modal {
  z-index: 999999 !important;
}

@keyframes global-pulse {
  0% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(255, 59, 59, 0.4); }
  70% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 0 10px rgba(255, 59, 59, 0); }
  100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5), 0 0 0 0 rgba(255, 59, 59, 0); }
}
/* 채팅 후원 드롭다운 스타일 */
.chat-donation-dropdown {
  position: absolute;
  bottom: 65px; /* 버튼 높이(약 45px) + 마진(20px) */
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  margin: 0 12px;
  z-index: 100;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
}

.dropdown-title {
  font-size: 16px;
  font-weight: 500;
}

.close-button {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 4px;
}

.dropdown-content {
  padding: 16px;
}

.my-berry-info {
  display: flex;
  align-items: center;
  background: rgba(176, 132, 204, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.berry-icon {
  font-size: 24px;
  margin-right: 12px;
}

.berry-text {
  flex: 1;
}

.berry-label {
  font-size: 12px;
  color: #aaa;
}

.berry-value {
  font-size: 16px;
  font-weight: 500;
  color: #b084cc;
}

.berry-refresh {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.berry-refresh:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.donation-input-group,
.donation-amount-group {
  margin-bottom: 16px;
}

.donation-input-group label,
.donation-amount-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #aaa;
}

.donation-input-group input,
.amount-input input {
  width: 100%;
  padding: 10px 12px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.donation-input-group input:focus,
.amount-input input:focus {
  border-color: #b084cc;
  outline: none;
}

.char-count {
  font-size: 12px;
  color: #777;
  text-align: right;
  margin-top: 4px;
}

.amount-input {
  position: relative;
  margin-bottom: 8px;
}

.berry-unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
}

.amount-presets {
  display: flex;
  gap: 8px;
}

.amount-presets button {
  flex: 1;
  padding: 6px 0;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-presets button:hover {
  background: #3d3d3d;
  border-color: #555;
}

.donate-button {
  width: 100%;
  padding: 12px;
  background: #b084cc;
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.donate-button:hover {
  background: #9e70b9;
}

.donate-button:disabled {
  background: #666;
  color: #aaa;
  cursor: not-allowed;
}

/* 충전 모달 스타일 */
.berry-charge-modal {
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
  padding: 20px;
}

.charge-input-group {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.charge-input-container {
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 8px;
  padding: 12px;
}

.charge-icon {
  font-size: 20px;
  margin-right: 10px;
}

.charge-amount {
  flex-grow: 1;
  font-size: 18px;
  font-weight: 500;
}

.clear-btn {
  color: #aaa;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.amount-btn {
  flex: 1;
  min-width: 80px;
  font-size: 14px;
  color: #ccc;
  border-color: #444;
}

.total-price-container {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-price-label {
  font-size: 14px;
  color: #aaa;
}

.total-price-value {
  font-size: 18px;
  font-weight: 500;
  color: #b084cc;
}

.agreement-text {
  font-size: 12px;
  color: #777;
  text-align: center;
  margin-bottom: 8px;
}

.modal-footer {
  padding: 12px 20px 20px;
}

.submit-btn {
  font-weight: 500;
  font-size: 16px;
}

.failure-message-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.failure-icon {
  flex-shrink: 0;
}

.failure-message {
  font-size: 16px;
  line-height: 1.5;
}

/* 후원 메시지 스타일 */
.donation-message {
  margin-bottom: 16px;
}

.donation-box {
  background-color: rgba(176, 132, 204, 0.1);
  border: 1px solid rgba(176, 132, 204, 0.3);
  border-radius: 8px;
  overflow: hidden;
  margin: 4px 0;
}

.donation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: rgba(176, 132, 204, 0.2);
  padding: 6px 12px;
  font-size: 12px;
  color: #b084cc;
}

.donation-title {
  font-weight: 500;
}

.donation-amount {
  font-weight: 500;
}

.donation-body {
  padding: 8px 12px;
}

.donation-message .sender {
  margin-right: 6px;
  font-weight: 500;
}

.donation-message .message-content {
  word-break: break-all;
}

/* 충전하고 후원하기 함수 추가 */
.charge-donate-button {
  background: linear-gradient(45deg, #b084cc, #ff9505);
}

.charge-donate-button:hover {
  background: linear-gradient(45deg, #9e70b9, #e88600);
}

.donation-button:disabled {
  background: #1A1A1A;
  color: #555;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #222;
}

.donation-button:hover:disabled {
  background: #1A1A1A;
  border-color: #222;
}

/* 성인 콘텐츠 제한 모달 스타일 */
.adult-restriction-content {
  text-align: center;
  padding: 24px 16px;
}

.adult-main-text {
  font-size: 18px;
  font-weight: 500;
  color: #ff5252;
  margin-bottom: 16px;
}

/* 미션 후원 드롭다운 스타일 */
.chat-donation-dropdown.mission-donation-dropdown {
  position: absolute;
  bottom: 65px; /* 버튼 높이(약 45px) + 마진(20px) */
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 8px;
  margin: 0 12px;
  z-index: 100;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.dropdown-header.mission-donation-dropdown {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
}

.dropdown-title.mission-donation-dropdown {
  font-size: 16px;
  font-weight: 500;
}

.close-button.mission-donation-dropdown {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 4px;
}

.dropdown-content.mission-donation-dropdown {
  padding: 16px;
}

.my-berry-info.mission-donation-dropdown {
  display: flex;
  align-items: center;
  background: rgba(176, 132, 204, 0.1);
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.berry-icon.mission-donation-dropdown {
  font-size: 24px;
  margin-right: 12px;
}

.berry-text.mission-donation-dropdown {
  flex: 1;
}

.berry-label.mission-donation-dropdown {
  font-size: 12px;
  color: #aaa;
}

.berry-value.mission-donation-dropdown {
  font-size: 16px;
  font-weight: 600;
  color: #b084cc;
}

.berry-refresh.mission-donation-dropdown {
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  transition: all 0.2s;
}

.berry-refresh.mission-donation-dropdown:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.donation-input-group.mission-donation-dropdown,
.donation-amount-group.mission-donation-dropdown {
  margin-bottom: 16px;
}

.donation-input-group.mission-donation-dropdown label,
.donation-amount-group.mission-donation-dropdown label {
  display: block;
  font-size: 14px;
  margin-bottom: 8px;
  color: #aaa;
}

.donation-input-group.mission-donation-dropdown input,
.amount-input.mission-donation-dropdown input {
  width: 100%;
  padding: 10px 12px;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.donation-input-group.mission-donation-dropdown input:focus,
.amount-input.mission-donation-dropdown input:focus {
  border-color: #b084cc;
  outline: none;
}

.char-count.mission-donation-dropdown {
  font-size: 12px;
  color: #777;
  text-align: right;
  margin-top: 4px;
}

.amount-input.mission-donation-dropdown {
  position: relative;
  margin-bottom: 8px;
}

.berry-unit.mission-donation-dropdown {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #777;
}

.amount-presets.mission-donation-dropdown {
  display: flex;
  gap: 8px;
}

.amount-presets.mission-donation-dropdown button {
  flex: 1;
  padding: 6px 0;
  background: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-presets.mission-donation-dropdown button:hover {
  background: #3d3d3d;
  border-color: #555;
}

.donate-button.mission-donation-dropdown {
  width: 100%;
  padding: 12px;
  background: #b084cc;
  border: none;
  border-radius: 4px;
  color: #000;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.donate-button.mission-donation-dropdown:hover {
  background: #9e70b9;
}

.donate-button.mission-donation-dropdown:disabled {
  background: #666;
  color: #aaa;
  cursor: not-allowed;
}

/* 충전하고 미션 후원하기 함수 추가 */
.charge-donate-button.mission-donation-dropdown {
  background: linear-gradient(45deg, #b084cc, #ff9505);
}

.charge-donate-button.mission-donation-dropdown:hover {
  background: linear-gradient(45deg, #9e70b9, #e88600);
}

.donate-button.mission-donation-dropdown:disabled {
  background: #1A1A1A;
  color: #555;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #222;
}

.donate-button.mission-donation-dropdown:hover:disabled {
  background: #1A1A1A;
  border-color: #222;
}

/* 성인 콘텐츠 제한 모달 스타일 */
.adult-restriction-content.mission-donation-dropdown {
  text-align: center;
  padding: 24px 16px;
}

.adult-main-text.mission-donation-dropdown {
  font-size: 18px;
  font-weight: 500;
  color: #ff5252;
  margin-bottom: 16px;
}

/* 제한 시간 선택 스타일 */
.time-presets {
  display: none; /* 더 이상 사용하지 않음 */
}

/* 시간 입력 필드에 대한 스타일 추가 */
.donation-input-group input[type="text"] {
  width: 100%;
  padding: 10px 12px;
  background: #2D2D2D;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
}

.donation-input-group input[type="text"]:focus {
  border-color: #B084CC;
  outline: none;
}

.donation-input-group input[type="text"].invalid {
  border-color: #ff5252;
}

.time-hint {
  font-size: 12px;
  color: #777;
  text-align: right;
  margin-top: 4px;
}

.time-error {
  color: #ff5252;
}
</style>