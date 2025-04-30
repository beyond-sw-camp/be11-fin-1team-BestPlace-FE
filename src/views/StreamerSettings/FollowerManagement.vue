<template>
    
      <div class="follower-container">
        <h2 class="title">팔로워</h2>
        <div class="follower-summary">
          <span>내 채널 팔로워 <b>{{ totalFollowers }}</b></span>
        </div>
        <div class="search-bar">
          <input
            v-model="searchNickname"
            placeholder="닉네임을 입력해 주세요."
            @keyup.enter="fetchFollowers"
          />
          <button @click="fetchFollowers">검색</button>
        </div>
        <div class="follower-table-wrapper">
          <table class="follower-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>팔로우 등록일</th>
                <th>기간</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="follower in pagedFollowers" :key="follower.memberId">
                <td class="nickname-cell">
                  <img :src="follower.profileImage || defaultProfile" class="profile-img" />
                  {{ follower.nickName }}
                </td>
                <td>{{ formatDate(follower.createdTime) }}</td>
                <td>{{ getDaysAgo(follower.createdTime) }}일</td>
                <td>
                  <button class="follow-btn" @click="followBack(follower.memberId)">팔로잉</button>
                </td>
              </tr>
              <tr v-if="pagedFollowers.length === 0">
                <td colspan="4" class="empty-row">팔로워가 없습니다.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button
            v-for="page in totalPages"
            :key="page"
            :class="{ active: page === currentPage }"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    
  </template>
  
  <script>
  import axios from 'axios';
  import { jwtDecode } from 'jwt-decode';
  
  export default {
    data() {
      return {
        followers: [],
        searchNickname: '',
        currentPage: 1,
        pageSize: 10,
        defaultProfile: '/img/default-avatar.b6846f9b.png',
        memberId: null,
      };
    },
    computed: {
      filteredFollowers() {
        if (!this.searchNickname) return this.followers;
        return this.followers.filter(f =>
          f.nickName.includes(this.searchNickname)
        );
      },
      pagedFollowers() {
        const start = (this.currentPage - 1) * this.pageSize;
        return this.filteredFollowers.slice(start, start + this.pageSize);
      },
      totalPages() {
        return Math.ceil(this.filteredFollowers.length / this.pageSize) || 1;
      },
      totalFollowers() {
        return this.followers.length;
      }
    },
    async created() {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = jwtDecode(token);
        this.memberId = payload.sub;
      }
      await this.fetchFollowers();
    },
    methods: {
      async fetchFollowers() {
        try {
          const response = await axios.get(
            `${process.env.VUE_APP_MEMBER_API}/follow/follower/forAll/${this.memberId}`,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          this.followers = response.data.result || [];
          this.currentPage = 1;
        } catch (e) {
          console.error(e);
          alert('팔로워 목록을 불러오지 못했습니다.');
        }
      },
      formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleString('ko-KR');
      },
      getDaysAgo(dateStr) {
        if (!dateStr) return '-';
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        return diff;
      },
      async followBack(targetMemberId) {
        try {
          await axios.post(
            `${process.env.VUE_APP_MEMBER_API}/follow/toggle/${targetMemberId}`,
            null,
            {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }
          );
          await this.fetchFollowers();
        } catch (error) {
          console.error('팔로우 토글 실패:', error);
          alert('팔로우 처리 중 오류가 발생했습니다.');
        }
      }
    }
  };
  </script>

<style scoped>
.follower-page {
  width: 100%;
  min-height: 100vh;
  background: #181a20;
  color: #fff;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 0;
}
.follower-container {
  background: #23242a;
  border-radius: 16px;
  padding: 32px 40px;
  min-width: 800px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.12);
}
.title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}
.follower-summary {
  font-size: 18px;
  margin-bottom: 16px;
}
.search-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.search-bar input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: #1a1b20;
  color: #fff;
}
.search-bar button {
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-weight: bold;
  cursor: pointer;
}
.follower-table-wrapper {
  background: #23242a;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}
.follower-table {
  width: 100%;
  border-collapse: collapse;
  background: #23242a;
}
.follower-table th, .follower-table td {
  padding: 14px 12px;
  text-align: left;
}
.follower-table th {
  background: #23242a;
  color: #b0b3c0;
  font-weight: 600;
  border-bottom: 1px solid #2c2e36;
}
.follower-table td {
  background: #23242a;
  border-bottom: 1px solid #23242a;
}
.nickname-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}
.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: #2c2e36;
}
.follow-btn {
  background: #3538ff;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 18px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.follow-btn:hover {
  background: #23242a;
  color: #3538ff;
  border: 1px solid #3538ff;
}
.empty-row {
  text-align: center;
  color: #aaa;
}
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
}
.pagination button {
  background: #23242a;
  color: #fff;
  border: 1px solid #3538ff;
  border-radius: 6px;
  padding: 4px 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.pagination button.active,
.pagination button:hover {
  background: #3538ff;
  color: #fff;
}
</style>
  