<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3>팀 정보</h3>
        <p class="team-name">BestPlace</p>
        <p>11기 한화시스템 BEYOND SW 캠프</p>
      </div>

      <div class="footer-section">
        <h3>팀원</h3>
        <ul class="team-members">
          <li><a href="https://github.com/ki-hyun-Jang" target="_blank">장기현</a></li>
          <li><a href="https://github.com/gimpitang" target="_blank">최영재</a></li>
          <li><a href="https://github.com/luail" target="_blank">고준혁</a></li>
          <li><a href="https://github.com/2ma1995" target="_blank">소병윤</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>도움을 주신 분</h3>
        <p><a href="https://www.inflearn.com/users/1014633/@bradkim" target="_blank">Brad Kim</a></p>
      </div>

      <div class="footer-section">
        <h3>프로젝트 문서</h3>
        <ul>
          <li><a href="https://www.notion.so/180da9f139ca801c98c7c26eb1e2af31?v=180da9f139ca81d08b86000c2c26c05e" target="_blank">요구사항명세서</a></li>
          <li><a href="https://www.erdcloud.com/d/62rYxocZt6sFHzFyG" target="_blank">ERD</a></li>
          <li><a href="https://github.com/beyond-sw-camp/be11-2nd-4dollarExit-TikTakTalk-FE" target="_blank">FE GitHub</a></li>
          <li><a href="https://github.com/beyond-sw-camp/be11-2nd-4dollarExit-TikTakTalk-BE" target="_blank">BE GitHub</a></li>
        </ul>
      </div>

      <div class="footer-section">
        <h3>후원계좌</h3>
        <p class="account-info">농협</p>
        <p class="account-number">3510714309053</p>
        <p class="account-name">장기현</p>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2025 BestPlace. All rights reserved.</p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterComponent'
}
</script>

<style scoped>
.footer {
  background-color: #121212;
  color: #fff;
  padding: 1.5rem 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-around;
  padding: 0 1rem;
}

.footer-section {
  flex: 1;
  margin: 0 0.8rem;
  font-size: 0.9rem;
}

.footer-section h3 {
  margin-bottom: 0.8rem;
  font-size: 1rem;
  color: #fff;
}

.team-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 0.4rem;
}

.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 0.4rem;
}

.footer-section a {
  color: #fff;
  text-decoration: none;
  transition: color 0.3s ease;
}

.footer-section a:hover {
  color: rgba(150, 64, 255, 0.7);
}

.footer-section p a:hover {
  color: rgba(150, 64, 255, 0.7);
}

.footer-bottom {
  text-align: center;
  margin-top: 1.5rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.85rem;
}

.account-info {
  margin-bottom: 0.2rem;
  color: #ffffff;
  font-size: 0.9rem;
}

.account-number {
  font-family: monospace;
  font-size: 1rem;
  margin-bottom: 0.2rem;
}

.account-name {
  font-size: 0.85rem;
  color: #ccc;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
  }

  .footer-section {
    margin: 1rem 0;
  }
}
</style>