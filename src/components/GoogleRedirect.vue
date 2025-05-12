<template>
    <div class="loading-container">
        <v-dialog v-model="showNicknameDialog" persistent max-width="500" :retain-focus="false">
            <v-card>
                <v-card-title class="headline">닉네임 설정</v-card-title>
                <v-card-text>
                    <p>사용하실 닉네임을 입력해주세요. (2자 이상)</p>
                    <v-text-field
                        v-model="nickname"
                        label="닉네임"
                        :error-messages="nicknameError"
                        outlined
                        @input="validateNickname"
                    ></v-text-field>
                    <p class="text-caption">닉네임을 입력하지 않으면 자동으로 생성됩니다.</p>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="skipNickname">건너뛰기</v-btn>
                    <v-btn color="primary" @click="continueWithNickname" :disabled="nickname && nickname.length < 2">계속하기</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="alertModalOpen" max-width="400" content-class="community-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-title">알림</div>
                    <v-btn icon @click="alertModalOpen = false" class="close-btn">
                        <v-icon>mdi-close</v-icon>
                    </v-btn>
                </div>
                
                <div class="modal-content">
                    <div class="message-container">
                        <v-icon :icon="alertModalIcon" :color="alertModalIconColor" size="x-large" class="message-icon"></v-icon>
                        <div class="message-text">{{ alertModalMessage }}</div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <v-btn 
                        color="#B084CC" 
                        block
                        @click="alertModalOpen = false"
                        class="confirm-btn"
                    >
                        확인
                    </v-btn>
                </div>
            </div>
        </v-dialog>

        <div v-if="!showNicknameDialog">
          <v-img src="@/assets/BEST_PLACE_logo.gif" alt="로딩 중..." class="loading-gif" />
          <p>구글 로그인 진행중...</p>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default{
    data() {
        return {
            nickname: '',
            nicknameError: '',
            showNicknameDialog: false,
            code: null,
            googleProfileDto: null,
            alertModalOpen: false,
            alertModalMessage: '',
            alertModalIcon: 'mdi-information',
            alertModalIconColor: '#B084CC'
        }
    },
    async mounted(){
        this.code = new URL(window.location.href).searchParams.get("code");
        if (!this.code) {
          window.location.href = "/"; // 코드가 없으면 홈으로 리다이렉트
          return;
        }
        try {
        const response = await axios.post(`${process.env.VUE_APP_MEMBER_API}/member/google/doLogin`, {
            code: this.code
        });

        if (response.data.status_message === "NOT_REGISTERED") {
            this.googleProfileDto = response.data.result;
            this.showNicknameDialog = true;
        } else if (response.data.status_message === "LOGIN_SUCCESS") {
            const loginInfo = response.data.result;
            localStorage.setItem("token", loginInfo.token);
            localStorage.setItem("refreshToken", loginInfo.refreshToken);
            localStorage.setItem("userId", loginInfo.id);
            window.location.href = "/";
        }
        } catch (error) {
            this.showAlertModal('로그인 중 오류가 발생했습니다.', 'mdi-alert-circle', '#FF5252');
        }
    },
    methods:{
        validateNickname() {
            if (this.nickname && this.nickname.length < 2) {
                this.nicknameError = '닉네임은 두 글자 이상이어야 합니다.';
            } else {
                this.nicknameError = '';
            }
        },
        skipNickname() {
            this.registerNickname('');
        },
        continueWithNickname() {
            if (this.nickname && this.nickname.length < 2) {
                this.nicknameError = '닉네임은 두 글자 이상이어야 합니다.';
                return;
            }
            this.registerNickname(this.nickname);
        },
        async registerNickname(nickname) {
            try {
                await axios.post(`${process.env.VUE_APP_MEMBER_API}/member/google/register`, {
                googleProfileDto: this.googleProfileDto,
                registerNickname: nickname
                });

                this.showAlertModal('회원가입이 완료되었습니다. 다시 로그인해주세요.', 'mdi-check-circle', '#4CAF50');
                setTimeout(() => {
                    window.location.href = "/";
                }, 2000);
            } catch (error) {
                console.error("회원가입 실패", error);
                this.showAlertModal('회원가입 중 오류가 발생했습니다.', 'mdi-alert-circle', '#FF5252');
            }
        },
        showAlertModal(message, icon = 'mdi-information', color = '#B084CC') {
            this.alertModalMessage = message;
            this.alertModalIcon = icon;
            this.alertModalIconColor = color;
            this.alertModalOpen = true;
        }
    }
}
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}
.loading-gif {
  width: 90px;
  height: 30px;
  margin-bottom: 1rem;
}

/* 알림 모달 스타일 */
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

.close-btn {
  color: #aaa;
}

.modal-content {
  padding: 20px;
}

.message-container {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgba(176, 132, 204, 0.1);
  border-radius: 8px;
}

.message-icon {
  margin-right: 16px;
}

.message-text {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.confirm-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}
</style>