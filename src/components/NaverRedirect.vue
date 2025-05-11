<template>
  <div class="loading-container">
    <v-dialog v-model="showNicknameDialog" persistent max-width="500">
      <v-card>
        <v-card-title class="headline">닉네임 설정</v-card-title>
        <v-card-text>
          <p>사용하실 닉네임을 입력해주세요. (8자 이상)</p>
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
          <v-btn color="primary" @click="continueWithNickname" :disabled="nickname && nickname.length < 8">계속하기</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-img src="@/assets/홈페이지 로그인 중 화면.gif" alt="로딩 중..." class="loading-gif"/>
    <p>네이버 로그인 진행중...</p>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      nickname: '',
      nicknameError: '',
      showNicknameDialog: true,
      code: null
    }
  },
  created() {
    this.code = new URL(window.location.href).searchParams.get("code");
  },
  methods: {
    validateNickname() {
      if (this.nickname && this.nickname.length < 8) {
        this.nicknameError = '닉네임은 8자 이상이어야 합니다.';
      } else {
        this.nicknameError = '';
      }
    },
    skipNickname() {
      this.nickname = '';
      this.showNicknameDialog = false;
      this.sendCodeToServer(this.code, '');
    },
    continueWithNickname() {
      if (this.nickname && this.nickname.length < 8) {
        this.nicknameError = '닉네임은 8자 이상이어야 합니다.';
        return;
      }
      this.showNicknameDialog = false;
      this.sendCodeToServer(this.code, this.nickname);
    },
    async sendCodeToServer(code, registerNickname) {
      const response = await axios.post(`${process.env.VUE_APP_MEMBER_API}/member/naver/doLogin`, {
        code,
        registerNickname
      });
      const token = response.data.token;
      const refreshToken = response.data.refreshToken;
      const userId = response.data.id;
      localStorage.setItem("token", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", userId);
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
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
  width: 1200px;
  height: 1000px;
  margin-bottom: 1rem;
}
</style>