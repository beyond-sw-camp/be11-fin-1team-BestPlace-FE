import axios from 'axios';

/**
 * API 호출을 위한 클래스
 */
class API {
  /**
   * 클립 목록을 가져옵니다.
   * @param {Object} params - 요청 파라미터
   * @returns {Promise} - API 응답
   */
  static async getClips(params) {
    try {
      const baseUrl = process.env.VUE_APP_VIDEO_API || '';
      return await axios.get(`${baseUrl}/clips`, { params });
    } catch (error) {
      console.error('클립 가져오기 오류:', error);
      throw error;
    }
  }

  /**
   * 클립 상세 정보를 가져옵니다.
   * @param {string} clipId - 클립 ID
   * @returns {Promise} - API 응답
   */
  static async getClipDetail(clipId) {
    try {
      const baseUrl = process.env.VUE_APP_VIDEO_API || '';
      return await axios.get(`${baseUrl}/clips/${clipId}`);
    } catch (error) {
      console.error('클립 상세 정보 가져오기 오류:', error);
      throw error;
    }
  }

  /**
   * 동영상 목록을 가져옵니다.
   * @param {Object} params - 요청 파라미터
   * @returns {Promise} - API 응답
   */
  static async getVideos(params) {
    try {
      const baseUrl = process.env.VUE_APP_VIDEO_API || '';
      return await axios.get(`${baseUrl}/videos`, { params });
    } catch (error) {
      console.error('동영상 가져오기 오류:', error);
      throw error;
    }
  }
}

export default API; 