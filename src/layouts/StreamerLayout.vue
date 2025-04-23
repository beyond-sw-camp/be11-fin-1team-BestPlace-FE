<template>
    <v-app>
      <!-- 스트리머 등록 모달 -->
      <StreamerRegisterModal
        v-if="showStreamerModal"
        @confirm="handleStreamerRegister"
        @cancel="handleCancel"
      />
      <StreamerHeaderComponent v-if="!showStreamerModal" />
      <v-main>
        <v-container>
          <v-row>
            <v-col cols="3">
              <StreamerSideComponent v-if="!showStreamerModal" />
            </v-col>
            <v-col cols="9">
              <router-view v-if="!showStreamerModal" />
            </v-col>
          </v-row>
        </v-container>
      </v-main>
    </v-app>
  </template>
  
  <script>
  import { jwtDecode } from 'jwt-decode';
  import axios from 'axios';
  import StreamerHeaderComponent from '@/components/StreamerHeaderComponent.vue';
  import StreamerSideComponent from '@/components/StreamerSideComponent.vue';
  import StreamerRegisterModal from '@/components/StreamerRegisterModal.vue';
  
  export default {
    components: {
      StreamerHeaderComponent,
      StreamerSideComponent,
      StreamerRegisterModal
    },
    data() {
      return {
        showStreamerModal: false,
      };
    },
    mounted() {
      this.checkStreamerStatus();
    },
    methods: {
      checkStreamerStatus() {
        const token = localStorage.getItem('token');
        if (!token) return;
  
        const payload = jwtDecode(token);
        if (payload.streamer === 'N') {
          this.showStreamerModal = true;
        }
      },
      async handleStreamerRegister() {
        try {
            const token = localStorage.getItem('token');
            

            const response = await axios.post(
            `${process.env.VUE_APP_STREAMING_API}/streamer-register`,
            null,
            {
                headers: {
                
                Authorization: `Bearer ${token}`,
                }
            }
            );

            // 응답 헤더에서 새 토큰 꺼내서 저장
            const authHeader = response.headers['authorization'];
            const newToken = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

            if (newToken) {
            localStorage.setItem('token', newToken);
            

            // 커서 이놈아 이거 왜 넣는지 설명 똑바로 해라라
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            }

            window.location.reload();
        } catch (err) {
            console.error('스트리머 등록 실패', err);
        }
      },
      handleCancel() {
        this.showStreamerModal = false;
        // 뒤로 가기나 홈으로 리디렉션
        this.$router.push('/');
      }
    }
  };
  </script>
  