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
        alert("로그인 중 오류가 발생했습니다.");
        window.location.href = "/";
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

                alert("회원가입이 완료되었습니다. 다시 로그인해주세요.");
                window.location.href = "/";
            } catch (error) {
                console.error("회원가입 실패", error);
                alert("회원가입 중 오류 발생");
            }
        },
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
</style>