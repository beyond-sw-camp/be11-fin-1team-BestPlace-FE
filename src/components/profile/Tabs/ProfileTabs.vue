<!-- components/profile/ProfileTabs.vue -->
<template>
  <div class="tab-container">
    <v-tabs v-model="localActiveTab" color="primary" class="channel-tabs" @update:model-value="updateTab">
      <v-tab value="home">홈</v-tab>
      <v-tab value="videos">동영상</v-tab>
      <v-tab value="clips">클립</v-tab>
      <v-tab value="community">커뮤니티</v-tab>
      <v-tab value="about">정보</v-tab>
    </v-tabs>

    <!-- 동영상 탭에 있으면 서브 필터 표시 -->
    <div v-if="localActiveTab === 'videos'" class="sub-filters">
      <v-chip-group>
        <v-chip class="filter-chip" variant="outlined" color="primary">전체</v-chip>
        <v-chip class="filter-chip" variant="outlined">지난 방송</v-chip>
        <v-chip class="filter-chip" variant="outlined">업로드한 영상</v-chip>
      </v-chip-group>
      <div class="sort-options">
        <span>최신순</span>
        <span class="sort-divider">•</span>
        <span>인기순</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProfileTabs',
  props: {
    activeTab: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      localActiveTab: this.activeTab
    }
  },
  watch: {
    activeTab(val) {
      this.localActiveTab = val;
    }
  },
  methods: {
    updateTab(val) {
      this.$emit('update:activeTab', val);
    }
  }
}
</script>

<style scoped>
.tab-container {
  background-color: #1e2029;
  border-radius: 8px 8px 0 0;
}

.channel-tabs {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sub-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.filter-chip {
  margin-right: 8px;
}

.sort-options {
  font-size: 14px;
  color: #c4bab4;
}

.sort-divider {
  margin: 0 8px;
}
</style>