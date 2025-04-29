/**
 * 숫자를 포맷팅하여 반환합니다.
 * @param {number} value - 포맷팅할 숫자
 * @returns {string} - 포맷팅된 문자열
 */
export function formatNumber(value) {
  if (!value && value !== 0) return '0';
  
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + '만';
  }
  
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 일자를 포맷팅합니다.
 * @param {string} dateString - 일자 문자열
 * @returns {string} - 포맷팅된 일자
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes}분 전`;
    }
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }
}

/**
 * 시간을 MM:SS 형식으로 포맷팅합니다.
 * @param {number} seconds - 초 단위 시간
 * @returns {string} - MM:SS 형식 문자열
 */
export function formatDuration(seconds) {
  if (!seconds) return '00:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
} 