<template>
  <div>
    <h1 class="mb-6">라이브 스트림</h1>

    <!-- Filter section -->
    <v-card color="surface" class="mb-6 pa-4">
      <v-row align="center">
        <v-col cols="12" md="4">
          <v-text-field
              density="compact"
              variant="solo"
              placeholder="검색"
              prepend-inner-icon="mdi-magnify"
              hide-details
              bg-color="background"
              class="rounded-pill"
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="8">
          <v-chip-group>
            <v-chip
                v-for="(category, i) in categories"
                :key="i"
                :color="selectedCategory === category ? 'primary' : undefined"
                @click="selectedCategory = category"
                class="mr-2"
            >
              {{ category }}
            </v-chip>
          </v-chip-group>
        </v-col>
      </v-row>
    </v-card>

    <!-- Live streams grid -->
    <v-row>
      <v-col
          v-for="(stream, i) in filteredStreams"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="3"
      >
        <StreamCard :stream="stream" />
      </v-col>
    </v-row>

    <!-- Load more button -->
    <div class="text-center mt-6">
      <v-btn
          color="primary"
          variant="outlined"
          size="large"
          @click="loadMore"
          :loading="isLoading"
      >
        더 보기
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import StreamCard from '../components/StreamCard.vue';

// Categories
const categories = ['모두', '게임', '엔터테인먼트', '토크', '음악', '스포츠', '교육', '기타'];
const selectedCategory = ref('모두');

// Loading state
const isLoading = ref(false);

// All streams data
const allStreams = ref([
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

// Filter streams based on category
const filteredStreams = computed(() => {
  if (selectedCategory.value === '모두') {
    return allStreams.value;
  }

  return allStreams.value.filter(stream =>
      stream.tags.some(tag =>
          tag === selectedCategory.value ||
          (selectedCategory.value === '게임' && !['엔터테인먼트', '토크', '음악', '스포츠', '교육'].includes(tag))
      )
  );
});

// Load more function
const loadMore = () => {
  isLoading.value = true;

  // Simulate API call
  setTimeout(() => {
    // In a real app, this would fetch more data from an API
    // For demo, just duplicate some existing streams with modified data
    const newStreams = allStreams.value.slice(0, 4).map((stream, index) => ({
      ...stream,
      title: `${stream.title} (추가 ${index + 1})`,
      viewerCount: Math.floor(stream.viewerCount * 0.8),
    }));

    allStreams.value.push(...newStreams);
    isLoading.value = false;
  }, 1000);
};
</script>
