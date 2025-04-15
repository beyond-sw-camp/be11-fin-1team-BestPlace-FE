<template>
    <div class="login-container">
      <div class="login-box">
        <h1 class="login-title">BestPlace Login</h1>
        <p class="login-subtitle">간편하게 로그인하고 시작하세요</p>
        
        <div class="social-login-buttons">
          <button class="google-login" @click="handleGoogleLogin">
            <img src="@/assets/google-icon.png" alt="Google" class="social-icon">
            Google로 로그인
          </button>
          <button class="naver-login" @click="handleNaverLogin">
            <img src="@/assets/naver-icon.png" alt="Naver" class="social-icon">
            Naver로 로그인
          </button>
        </div>
        
        <div class="divider">
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'LoginPage',
    methods: {
      handleGoogleLogin() {
        // Google 로그인 처리
      },
      handleNaverLogin() {
        // Naver 로그인 처리
      }
    }
  }
  </script>
  
  <style scoped>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
  }
  
  .login-box {
    background: white;
    padding: 40px;
    border-radius: 20px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }
  
  .login-title {
    font-size: 2rem;
    color: #333;
    margin-bottom: 10px;
    font-weight: 600;
  }
  
  .login-subtitle {
    color: #666;
    margin-bottom: 40px;
    font-size: 1.1rem;
  }
  
  .social-login-buttons {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 20px;
  }
  
  .social-login-buttons button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }
  
  .google-login {
    background: white;
    color: #333;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .google-login:hover {
    background: #f8f8f8;
    border-color: #c0c0c0;
    transform: translateY(-2px);
  }
  
  .naver-login {
    background: #03C75A;
    color: white;
    box-shadow: 0 2px 4px rgba(3, 199, 90, 0.2);
  }
  
  .naver-login:hover {
    background: #02b350;
    transform: translateY(-2px);
  }
  
  .social-icon {
    width: 24px;
    height: 24px;
    margin-right: 12px;
  }
  
  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
  }
  
  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  
  .divider span {
    padding: 0 10px;
    color: #666;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #03C75A;
  }
  
  .submit-button {
    width: 100%;
    padding: 12px;
    background: #03C75A;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.3s ease;
  }
  
  .submit-button:hover {
    background: #02b350;
  }
  </style>