import { ref, onMounted, onBeforeUnmount } from 'vue';

/**
 * 무한 스크롤 컴포저블
 * @param {Function} loadMore - 더 많은 데이터를 로드하는 함수
 * @param {Object} options - 추가 옵션
 * @returns {Object} - 무한 스크롤 관련 변수와 함수
 */
export default function useInfiniteScroll(loadMore, options = {}) {
  const targetRef = ref(null);
  const isLoading = ref(false);
  const observer = ref(null);
  const rootMargin = options.rootMargin || '0px 0px 100px 0px';

  const setupObserver = () => {
    observer.value = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading.value) {
          loadItems();
        }
      },
      { rootMargin }
    );

    if (targetRef.value) {
      observer.value.observe(targetRef.value);
    }
  };

  const loadItems = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    try {
      await loadMore();
    } catch (error) {
      console.error('무한 스크롤 데이터 로드 오류:', error);
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    setupObserver();
  });

  onBeforeUnmount(() => {
    if (observer.value) {
      observer.value.disconnect();
    }
  });

  return {
    targetRef,
    isLoading,
    loadItems
  };
} 