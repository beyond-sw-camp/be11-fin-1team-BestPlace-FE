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
           
              <StreamerSideComponent v-if="!showStreamerModal" />
            
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
      this.checkStreamerAccess();
    },
    methods: {
      async checkStreamerAccess() {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/member/login');
          return;
        }

        const payload = jwtDecode(token);
        const streamerId = this.$route.params.memberId;
        
        // 스트리머 본인이거나 매니저인지 확인
        try {
            const response = await axios.get(
                `${process.env.VUE_APP_STREAMING_API}/manager/checking/${streamerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
          
          if (response.data.result !== 'Y') {
            this.$router.push('/not-authorized');
          } else if (payload.streamer === 'N') {
            this.showStreamerModal = true;
          }
        } catch (err) {
          console.error('스트리머 접근 권한 확인 실패', err);
          this.$router.push('/error');
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
  