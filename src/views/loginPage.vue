<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-title">BestPlace Login</h1>
      <p class="login-subtitle">간편하게 로그인하고 시작하세요</p>

      <div class="social-login-buttons">
        <v-btn variant="outlined" class="google-login" @click="googleLogin">
          <v-img src="@/assets/google-icon.png" alt="Google" class="social-icon"/>
          Google로 로그인
        </v-btn>
        <v-btn class="naver-login" @click="naverLogin">
          <v-img src="@/assets/naver-icon.png" alt="Naver" class="social-icon"/>
          Naver로 로그인
        </v-btn>
      </div>

      <div class="divider">
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data(){
    return{
      googleUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      googleClientId: "922955916790-2ps4baqsfkd5i1rrd1isscm34g5n7c7s.apps.googleusercontent.com",
      googleRedirectUrl: "http://localhost:3000/member/google/redirect",
      googleScope: "openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read https://www.googleapis.com/auth/user.phonenumbers.read",

      naverUrl: "https://nid.naver.com/oauth2.0/authorize",
      naverClientId: "Aplw9X7yB984ri9fEMr0",
      naverRedirectUrl: "http://localhost:3000/member/naver/redirect",
      naverScope: "id email gender birthyear birthday age mobile name"
    }
  },
  name: 'LoginPage',
  methods:{
    googleLogin(){
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}`;
      window.location.href = auth_uri;
    },
    naverLogin(){
      const auth_uri = `${this.naverUrl}?client_id=${this.naverClientId}&redirect_uri=${this.naverRedirectUrl}&response_type=code&scope=${this.naverScope}`;
      window.location.href = auth_uri;
    },
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #15161b; /* 배경색 변경 */
  padding: 20px;
}

.login-box {
  background: #1e2029; /* 카드 배경색 변경 */
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 400px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.login-title {
  font-size: 2rem;
  color: #ffffff; /* 제목 색상 변경 */
  margin-bottom: 10px;
  font-weight: 600;
}

.login-subtitle {
  color: #c4bab4; /* 부제목 색상 변경 */
  margin-bottom: 40px;
  font-size: 1.1rem;
}

.social-login-buttons {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.social-login-buttons button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.google-login {
  background: rgba(255, 255, 255, 0.08); /* 구글 버튼 배경색 변경 */
  color: #ffffff; /* 구글 버튼 텍스트 색상 변경 */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.google-login:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-2px);
}

.naver-login {
  background: #03C75A; /* 네이버 원래 색상 유지 */
  color: white;
}

.naver-login:hover {
  background: #02b350;
  transform: translateY(-2px);
}

.social-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1); /* 구분선 색상 변경 */
}

.form-input {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05); /* 인풋 배경 변경 */
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #5ca1a8; /* primary 색상으로 변경 */
}

.submit-button {
  width: 100%;
  padding: 12px;
  background: #5ca1a8; /* primary 색상으로 변경 */
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s ease;
}

.submit-button:hover {
  background: #4a8f96; /* primary 색상 다크 버전 */
}
</style>