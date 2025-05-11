<template>
    <div class="loading-container">
        <v-img src="@/assets/BEST_PLACE_logo.gif" alt="로딩 중..." class="loading-gif" />
        <p>구글 로그인 진행중...</p>
    </div>
</template>

<script>
import axios from 'axios';

export default{
    created(){
        const code = new URL(window.location.href).searchParams.get("code");
        this.sendCodeToServer(code);
    },
    methods:{
        async sendCodeToServer(code){
            const response = await axios.post(`${process.env.VUE_APP_MEMBER_API}/member/google/doLogin`, {code});
            const token = response.data.token;
            const refreshToken = response.data.refreshToken;
            const userId = response.data.id;
            localStorage.setItem("token", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userId", userId);
            setTimeout(() => {
            window.location.href = "/";
            }, 1000);

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
</style>