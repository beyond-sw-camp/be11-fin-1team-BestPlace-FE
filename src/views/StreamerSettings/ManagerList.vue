<template>
  <div>
    <h2 class="title">권한 관리</h2>
    
    <!-- 검색 및 안내 섹션 -->
    <div class="search-section">
      <div class="left-side">
        <div class="title-section">권한 관리</div>
      </div>
      
      <div class="search-container">
        <input
          v-model="searchNickname"
          placeholder="닉네임 또는 UID를 입력해주세요."
          @keyup.enter="searchManagers"
        />
        <div class="dropdown">
          <button class="dropdown-btn">채널 관리자 <span class="arrow">▼</span></button>
        </div>
        <button class="add-btn">추가</button>
      </div>
    </div>
    
    <!-- 안내 텍스트 -->
    <div class="info-section">
      <ul>
        <li>권한 받은 사용자의 모든 작업 책임은 채널 소유자에게 있습니다.</li>
        <li>악용될 이용 가능한 권한을 확인 후 추가해주세요. <a href="#" class="info-link">자세히 보기</a></li>
      </ul>
    </div>
    
    <!-- 목록 섹션 -->
    <div class="list-section">
      <div class="list-header">
        <span>목록 {{ totalManagers }}</span>
      </div>
      
      <div class="table-container">
        <table class="manager-table">
          <thead>
            <tr>
              <th>닉네임</th>
              <th>등록자</th>
              <th>등록일</th>
              <th>역할</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="manager in pagedManagers" :key="manager.nickName">
              <td class="nickname-cell">
                <div class="nickname-wrapper">
                  <img :src="manager.profileImage || defaultProfile" class="profile-img" />
                  <span>{{ manager.nickName }}</span>
                </div>
              </td>
              <td>{{ getRegistrarText(manager) }}</td>
              <td>{{ formatDate(manager.createdTime) }}</td>
              <td>
                <select v-model="manager.role" @change="updateRole(manager)" class="role-select">
                  <option :value="'ChannelManager'">채널 관리자</option>
                  <option :value="'ChattingManager'">채팅 관리자</option>
                </select>
              </td>
              <td>
                <button class="action-btn" @click="handleDeleteManager(manager)">
                  삭제
                </button>
              </td>
            </tr>
            <tr v-if="pagedManagers.length === 0">
              <td colspan="5" class="empty-row">등록된 매니저가 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- 매니저 추가 모달 -->
    <div v-if="showAddManagerModal" class="modal-backdrop">
      <div class="modal-content">
        <h3>매니저 권한 부여</h3>
        <div class="modal-form">
          <input v-model="newManagerNickname" placeholder="닉네임 입력" />
          <select v-model="newManagerRole" class="role-select">
            <option :value="'ChannelManager'">채널 관리자</option>
            <option :value="'ChattingManager'">채팅 관리자</option>
          </select>
        </div>
        <div class="modal-actions">
          <button @click="handleAddManager">확인</button>
          <button @click="showAddManagerModal = false">취소</button>
        </div>
      </div>
    </div>
    
    <!-- 매니저 추가 버튼 -->
    <div class="add-manager-section">
      <button class="add-manager-btn" @click="showAddManagerModal = true">매니저 권한자 추가</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  data() {
    return {
      managers: [],
      searchNickname: '',
      currentPage: 1,
      pageSize: 10,
      defaultProfile: '/img/default-avatar.b6846f9b.png',
      memberId: null,
      streamerId: null,
      showAddManagerModal: false,
      newManagerNickname: '',
      newManagerRole: 'ChannelManager',
      userNickname: ''
    };
  },
  computed: {
    filteredManagers() {
      if (!this.searchNickname) return this.managers;
      return this.managers.filter(m =>
        m.nickName?.toLowerCase().includes(this.searchNickname.toLowerCase())
      );
    },
    pagedManagers() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredManagers.slice(start, start + this.pageSize);
    },
    totalPages() {
      return Math.ceil(this.filteredManagers.length / this.pageSize) || 1;
    },
    totalManagers() {
      return this.managers.length;
    }
  },
  async created() {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = jwtDecode(token);
      this.memberId = payload.sub;
      this.userNickname = payload.nickname;
      // streamerId는 URL에서 가져오거나, 현재 로그인한 사용자의 ID 사용
      this.streamerId = this.$route.params.memberId;
    }
    await this.fetchManagers();
  },
  methods: {
    async fetchManagers() {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_STREAMING_API}/manager/managerList/${this.streamerId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        this.managers = response.data.result || [];
        this.currentPage = 1;
      } catch (e) {
        console.error('매니저 목록 불러오기 실패:', e);
        alert('매니저 목록을 불러오지 못했습니다.');
      }
    },
    searchManagers() {
      // 검색 시 첫 페이지로 이동
      this.currentPage = 1;
    },
    formatDate(dateStr) {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      // 년-월-일 시:분:초 형식으로 포맷
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    },
    getRegistrarText(manager) {
      // 등록자 정보가 있으면 표시, 없으면 '소유자' 표시
      return manager.registrar || '소유자';
    },
    async updateRole(manager) {
      try {
        await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/manager/save`,
          {
            streamerId: this.streamerId,
            nickName: manager.nickName,
            role: manager.role
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        alert('권한이 변경되었습니다.');
      } catch (error) {
        console.error('권한 변경 실패:', error);
        alert('권한 변경에 실패했습니다.');
        // 실패 시 원래 값으로 되돌리기
        this.fetchManagers();
      }
    },
    async handleDeleteManager(manager) {
      if (!confirm(`'${manager.nickName}' 매니저를 삭제하시겠습니까?`)) {
        return;
      }
      
      try {
        await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/manager/delete`,
          {
            streamerId: this.streamerId,
            nickName: manager.nickName,
            role: manager.role
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        alert('매니저가 삭제되었습니다.');
        this.fetchManagers();
      } catch (error) {
        console.error('매니저 삭제 실패:', error);
        alert('매니저 삭제에 실패했습니다.');
      }
    },
    async handleAddManager() {
      if (!this.newManagerNickname.trim()) {
        alert('닉네임을 입력해주세요.');
        return;
      }
      
      try {
        await axios.post(
          `${process.env.VUE_APP_STREAMING_API}/manager/save`,
          {
            streamerId: this.streamerId,
            nickName: this.newManagerNickname,
            role: this.newManagerRole
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        
        alert('매니저가 추가되었습니다.');
        this.fetchManagers();
        this.showAddManagerModal = false;
        this.newManagerNickname = '';
        this.newManagerRole = 'ChannelManager';
      } catch (error) {
        console.error('매니저 추가 실패:', error);
        alert('매니저 추가에 실패했습니다.');
      }
    }
  }
};
</script>

<style scoped>
.title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  color: #fff;
}

/* 검색 섹션 */
.search-section {
  background: #23242a;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.left-side {
  margin-bottom: 20px;
}

.title-section {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
}

.search-container {
  display: flex;
  gap: 8px;
  width: 100%;
}

.search-container input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  border: none;
  background: #1a1b20;
  color: #fff;
  font-size: 14px;
}

.dropdown {
  position: relative;
}

.dropdown-btn {
  padding: 12px 16px;
  background: #23242a;
  color: #fff;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 150px;
}

.arrow {
  font-size: 10px;
}

.add-btn {
  padding: 12px 24px;
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* 안내 섹션 */
.info-section {
  background: #23242a;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
}

.info-section ul {
  list-style-type: none;
  padding-left: 0;
  margin: 0;
}

.info-section li {
  color: #aaa;
  font-size: 14px;
  margin-bottom: 8px;
  position: relative;
  padding-left: 16px;
}

.info-section li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #6c63ff;
}

.info-link {
  color: #6c63ff;
  text-decoration: none;
}

/* 목록 섹션 */
.list-section {
  background: #23242a;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}

.list-header {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-container {
  width: 100%;
  overflow-x: auto;
}

.manager-table {
  width: 100%;
  border-collapse: collapse;
  background: #23242a;
}

.manager-table th, .manager-table td {
  padding: 16px 12px;
  text-align: left;
  border-bottom: 1px solid #2c2e36;
}

.manager-table th {
  color: #aaa;
  font-weight: 600;
  font-size: 14px;
}

.manager-table td {
  color: #fff;
  font-size: 14px;
}

.nickname-cell {
  min-width: 200px;
}

.nickname-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #2c2e36;
}

.role-select {
  background: #2d2d2d;
  color: white;
  padding: 8px 12px;
  border: 1px solid #3d3d3d;
  border-radius: 8px;
  outline: none;
  min-width: 120px;
}

.action-btn {
  background: transparent;
  color: #ff3b30;
  border: 1px solid #ff3b30;
  border-radius: 8px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(255, 59, 48, 0.1);
}

.empty-row {
  text-align: center;
  color: #aaa;
  padding: 32px 0;
}

/* 매니저 추가 섹션 */
.add-manager-section {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.add-manager-btn {
  background: #6c63ff;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-manager-btn:hover {
  background: #5a52d5;
}

/* 모달 */
.modal-backdrop {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.modal-content {
  background: #23242a;
  padding: 24px;
  border-radius: 16px;
  width: 400px;
}

.modal-content h3 {
  margin-bottom: 24px;
  color: #fff;
  font-weight: 600;
}

.modal-form {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-form input {
  width: 100%;
  padding: 12px;
  background: #1a1b20;
  border: 1px solid #2c2e36;
  border-radius: 8px;
  color: white;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-actions button:first-child {
  background: #6c63ff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.modal-actions button:last-child {
  background: #2d2d2d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
</style>
  