<template>
  <div>
    <!-- Featured Banners Section -->
    <FeaturedBanners :banners="featuredBanners" />

    <!-- Popular Streams Section -->
    <SectionHeader title="인기 있는 스트림" @more="handleViewMore('popular')" />
    <v-row>
      <v-col
          v-for="(stream, i) in popularStreams"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <StreamCard :stream="stream" />
      </v-col>
    </v-row>

    <!-- Game Categories Section -->
    <SectionHeader title="게임 카테고리" spacing="my-6" @more="handleViewMore('categories')" />
    <v-row>
      <v-col
          v-for="(category, i) in gameCategories"
          :key="i"
          cols="12"
          sm="6"
          md="3"
          lg="2"
      >
        <CategoryCard :category="category" />
      </v-col>
    </v-row>

    <!-- Recommended Channels Section -->
    <SectionHeader title="추천 채널" spacing="my-6" @more="handleViewMore('recommended')" />
    <v-row>
      <v-col
          v-for="(stream, i) in recommendedStreams"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <StreamCard :stream="stream" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import StreamCard from '../components/StreamCard.vue';
import CategoryCard from '../components/CategoryCard.vue';
import FeaturedBanners from '../components/FeaturedBanners.vue';
import SectionHeader from '../components/SectionHeader.vue';

// Sample data for featured banners
const featuredBanners = ref([
  {
    title: '1번째사진',
    subtitle: '소제목',
    image: ''
  },
  {
    title: '2번째사진',
    subtitle: '소제목',
    image: ''
  },
  {
    title: '3번째사진',
    subtitle: '소제목',
    image: ''
  },
]);

// Sample data for popular streams
const popularStreams = ref([
  {
    title: '\'\'24시간 생방송 중',
    streamerName: '스트리머 1',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3814468730.jpeg',
    thumbnail: 'https://ext.same-assets.com/2621616590/416085825.jpeg',
    viewerCount: 4205,
    tags: ['엔터테인먼트', 'mbc', '쇼']
  },
  {
    title: '\'대행성\' 24시간 생방송 중',
    streamerName: '스트리머 2',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3893656012.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/2293052101.jpeg',
    viewerCount: 190,
    tags: ['엔터테인먼트', 'mbc', '드라마']
  },
  {
    title: '\'런닝맨\' 24시간 생방송 중',
    streamerName: '스트리머 3',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3501503702.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/3921100336.jpeg',
    viewerCount: 117,
    tags: ['엔터테인먼트', 'mbc', '쇼']
  },
  {
    title: '스타레일 2 생방송',
    streamerName: '스트리머 4',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3177766413.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/3482440124.jpeg',
    viewerCount: 1311,
    tags: ['게임', '스타레일']
  },
]);

// Sample data for recommended streams
const recommendedStreams = ref([
  {
    title: '40레벨 달성기념 방송 중',
    streamerName: '스트리머 5',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3375029439.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/940969645.jpeg',
    viewerCount: 1112,
    tags: ['게임', '마비노기']
  },
  {
    title: '...........대기중',
    streamerName: '스트리머 6',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/3517219542.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/3572800171.jpeg',
    viewerCount: 1039,
    tags: ['토크']
  },
  {
    title: '던파 방송 중',
    streamerName: '스트리머 7',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/350035928.jpeg',
    thumbnail: 'https://ext.same-assets.com/2621616590/3132410546.jpeg',
    viewerCount: 985,
    tags: ['게임', '던전앤파이터']
  },
  {
    title: '롤 방송 중 `^`',
    streamerName: '스트리머 8',
    streamerAvatar: 'https://ext.same-assets.com/2621616590/1265143637.png',
    thumbnail: 'https://ext.same-assets.com/2621616590/600435199.jpeg',
    viewerCount: 955,
    tags: ['게임', '리그오브레전드']
  },
]);

// Sample data for game categories
const gameCategories = ref([
  {
    name: '리그 오브 레전드',
    image: 'https://ext.same-assets.com/2621616590/3050085956.jpeg',
    viewers: 25342
  },
  {
    name: '배틀그라운드',
    image: 'https://ext.same-assets.com/2621616590/3595762521.jpeg',
    viewers: 15879
  },
  {
    name: '마비노기',
    image: 'https://ext.same-assets.com/2621616590/940969645.jpeg',
    viewers: 12567
  },
  {
    name: '베로란트',
    image: 'https://ext.same-assets.com/2621616590/426962575.jpeg',
    viewers: 9876
  },
  {
    name: '스타레일',
    image: 'https://ext.same-assets.com/2621616590/3482440124.jpeg',
    viewers: 8542
  },
  {
    name: '오버워치',
    image: 'https://ext.same-assets.com/2621616590/3377042742.jpeg',
    viewers: 7689
  },
]);

// View more handler
const handleViewMore = (section) => {
  console.log(`View more clicked for section: ${section}`);
  // In a real app, this would navigate to a dedicated page for this section
};
</script>
