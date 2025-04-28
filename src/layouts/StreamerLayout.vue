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
          console.log('[checkStreamerAccess] 토큰 없음. 로그인 페이지로 이동');
          this.$router.push('/member/login');
          return;
        }

        const payload = jwtDecode(token);
        console.log('[checkStreamerAccess] 토큰 디코딩 결과:', payload);
        const streamerId = this.$route.params.memberId;
        console.log('[checkStreamerAccess] 현재 URL 스트리머 ID:', streamerId);
        
        // 스트리머 본인이거나 매니저인지 확인
        try {
            const response = await axios.get(
                `${process.env.VUE_APP_STREAMING_API}/manager/checking/${streamerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
          console.log('[checkStreamerAccess] manager/checking 응답:', response.data);
          if (response.data.result !== 'Y') {
            console.log('[checkStreamerAccess] 매니저나 스트리머 아님. not-authorized 이동');
            this.$router.push('/not-authorized');
          } else {
            // 여기서부터 고친다
            if (Number(payload.sub) === Number(streamerId)) {
              // 스트리머 본인일 때만 streamer: N 체크
              if (payload.streamer === 'N') {
                console.log('[checkStreamerAccess] 스트리머 본인인데 등록 안됨. 모달 띄움');
                this.showStreamerModal = true;
              } else {
                console.log('[checkStreamerAccess] 스트리머 본인인데 등록 완료. 모달 안 띄움');
              }
            } else {
              // 매니저면 무조건 통과
              console.log('[checkStreamerAccess] 매니저이므로 모달 안 띄움');
            }
          }
        } catch (err) {
          console.error('스트리머 접근 권한 확인 실패', err);
          this.$router.push('/error');
        }
      },
      async handleStreamerRegister() {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.error('[handleStreamerRegister] 토큰 없음. 로그인 필요');
            this.$router.push('/member/login');
            return;
          }

          const response = await axios.post(
            `${process.env.VUE_APP_MEMBER_API}/member/streamer-register`,
            null,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              }
            }
          );

          console.log('[handleStreamerRegister] 스트리머 등록 성공:', response.data);

          const authHeader = response.headers['authorization'];
          const newToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

          if (newToken) {
            localStorage.setItem('token', newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            console.log('[handleStreamerRegister] 새 토큰 저장 완료:', newToken);
          } else {
            console.warn('[handleStreamerRegister] 새 토큰 없음. 기존 토큰 유지');
          }

          // ✅ 여기서 checkStreamerAccess() 다시 호출해서, 모달 뜰지 말지 재결정
          await this.checkStreamerAccess();

          this.showStreamerModal = false;

          // 필요하면 300ms 뒤에 reload (굳이 reload 없어도 됨)
          // setTimeout(() => {
          //   window.location.reload();
          // }, 300);

        } catch (err) {
          console.error('[handleStreamerRegister] 스트리머 등록 실패', err);
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
  