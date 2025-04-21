<template>
  <div class="berry-wrapper">
    <!-- 베리 제목 섹션 -->
    <div class="berry-content">
      <h1 class="berry-title">내 <span class="purple-text">베리</span></h1>

      <!-- 보유중인 베리 섹션 -->
      <div class="berry-info-section">
        <div class="berry-info-icon">
          <v-icon icon="mdi-fruit-cherries" color="#b084cc" size="x-large"></v-icon>
        </div>
        <div class="berry-info-text">
          <h3 class="berry-info-title">보유중인 베리</h3>
          <h2 class="berry-amount">{{ berryBalance }}<span class="berry-unit">개</span></h2>
        </div>
        <v-btn class="charge-btn" color="#b084cc" rounded elevation="0" @click="openChargeModal">
          충전하기
        </v-btn>
      </div>

      <!-- 구분선 -->
      <div class="divider"></div>

      <!-- 사용내역 탭 섹션 -->
      <v-tabs v-model="activeTab" bg-color="transparent" color="#b084cc">
        <v-tab value="seoul">사용 내역</v-tab>
        <v-tab value="gyeonggi">구매 내역</v-tab>
        <v-tab value="busan">후원 받은 내역</v-tab>
        <div v-if="activeTab === 'busan'" class="total-donation-badge">
          총 후원받은 베리: <span class="total-donation-amount">{{ formatNumber(totalDonatedBerry) }}개</span>
        </div>
      </v-tabs>
      
      <!-- 사용 내역 탭 내용 -->
      <div v-if="activeTab === 'seoul'">
        <!-- 사용내역 테이블 헤더 -->
        <div class="berry-history-header">
          <div class="history-cell history-date">사용일시</div>
          <div class="history-cell history-amount">사용수량</div>
          <div class="history-cell history-type">사용내역</div>
          <div class="history-cell history-sender">후원한사람</div>
          <div class="history-cell history-message">후원메시지</div>
        </div>

        <!-- 사용내역 목록 -->
        <div class="berry-history-list" v-if="berryHistories.length > 0">
          <div class="berry-history-item" v-for="(history, index) in berryHistories" :key="index">
            <div class="history-cell history-date">
              {{ formatDateTime(history.createdTime) }}
            </div>
            <div class="history-cell history-amount">
              {{ history.balance }}개
            </div>
            <div class="history-cell history-type">
              {{ history.dona_type }}
            </div>
            <div class="history-cell history-sender">
              <div class="sender-info">
                <img :src="history.memberProfileUrl || defaultProfileImage" alt="프로필" class="sender-avatar" />
                <span>{{ history.memberNickname }}</span>
              </div>
            </div>
            <div class="history-cell history-message">
              {{ history.dona_message || '-' }}
            </div>
          </div>
        </div>

        <!-- 데이터가 없을 때 -->
        <div class="no-data" v-else>
          <p>사용 내역이 없습니다.</p>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-container" v-if="totalPages > 0">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="5"
            @update:model-value="fetchBerryHistories"
            color="#b084cc"
          ></v-pagination>
        </div>
      </div>
      
      <!-- 구매 내역 탭 내용 -->
      <div v-if="activeTab === 'gyeonggi'">
        <!-- 구매내역 테이블 헤더 -->
        <div class="berry-history-header">
          <div class="history-cell purchase-date">충전일시</div>
          <div class="history-cell purchase-quantity">충전수량</div>
          <div class="history-cell purchase-price">결제금액</div>
          <div class="history-cell purchase-action">구매취소</div>
        </div>

        <!-- 구매내역 목록 -->
        <div class="berry-history-list" v-if="berryPayments.length > 0">
          <div class="berry-history-item" v-for="(payment, index) in berryPayments" :key="index">
            <div class="history-cell purchase-date">
              {{ formatDateTime(payment.createdTime) }}
            </div>
            <div class="history-cell purchase-quantity">
              {{ payment.quantity }}개
            </div>
            <div class="history-cell purchase-price">
              {{ formatNumber(payment.price) }}원
            </div>
            <div class="history-cell purchase-action">
              <v-btn 
                v-if="payment.used === 'N'" 
                size="small" 
                color="#ff5252" 
                variant="outlined" 
                @click="cancelPayment(payment.id)"
                :disabled="loading"
              >
                취소
              </v-btn>
              <span v-else>-</span>
            </div>
          </div>
        </div>

        <!-- 데이터가 없을 때 -->
        <div class="no-data" v-else>
          <p>구매 내역이 없습니다.</p>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-container" v-if="paymentTotalPages > 0">
          <v-pagination
            v-model="paymentPage"
            :length="paymentTotalPages"
            :total-visible="5"
            @update:model-value="fetchBerryPayments"
            color="#b084cc"
          ></v-pagination>
        </div>
      </div>
      
      <!-- 후원 받은 내역 탭 내용 -->
      <div v-if="activeTab === 'busan'">
        <!-- 후원받은 내역 헤더 -->
        <div class="berry-history-header">
          <div class="history-cell donation-date">후원일시</div>
          <div class="history-cell donation-amount">후원수량</div>
          <div class="history-cell donation-sender">후원자아이디</div>
        </div>

        <!-- 후원받은 내역 목록 -->
        <div class="berry-history-list" v-if="donationHistories.length > 0">
          <div class="berry-history-item" v-for="(donation, index) in donationHistories" :key="index">
            <div class="history-cell donation-date">
              {{ formatDateTime(donation.createdTime) }}
            </div>
            <div class="history-cell donation-amount">
              {{ donation.balance }}개
            </div>
            <div class="history-cell donation-sender">
              <div class="sender-info">
                <img :src="donation.memberProfileUrl || defaultProfileImage" alt="프로필" class="sender-avatar" />
                <span>{{ donation.memberNickname }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 데이터가 없을 때 -->
        <div class="no-data" v-else>
          <p>후원 받은 내역이 없습니다.</p>
        </div>

        <!-- 페이지네이션 -->
        <div class="pagination-container" v-if="donationTotalPages > 0">
          <v-pagination
            v-model="donationPage"
            :length="donationTotalPages"
            :total-visible="5"
            @update:model-value="fetchDonationHistories"
            color="#b084cc"
          ></v-pagination>
        </div>
      </div>
    </div>
    
    <!-- 충전 모달 -->
    <v-dialog v-model="chargeModalOpen" max-width="500" content-class="berry-charge-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">베리 충전하기</div>
          <v-btn icon @click="closeChargeModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="charge-input-group">
            <div class="input-label">충전할 베리</div>
            <div class="charge-input-container">
              <div class="charge-icon">
                <v-icon icon="mdi-fruit-cherries" color="#b084cc" size="large"></v-icon>
              </div>
              <div class="charge-amount">{{ formatNumber(chargeAmount) }}</div>
              <v-btn icon class="clear-btn" @click="clearAmount" v-if="chargeAmount > 0">
                <v-icon>mdi-close-circle</v-icon>
              </v-btn>
            </div>
          </div>
          
          <div class="amount-buttons">
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(1000)">+1천</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(5000)">+5천</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(10000)">+1만</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(100000)">+10만</v-btn>
            <v-btn class="amount-btn" variant="outlined" @click="addAmount(1000000)">+100만</v-btn>
          </div>
          
          <div class="total-price-container">
            <div class="total-price-label">최종 결제금액</div>
            <div class="total-price-value">{{ formatNumber(Math.round(chargeAmount * 1.1)) }}원</div>
          </div>
          
          <div class="agreement-text">
            내용을 확인했으며 베리 충전에 동의합니다.
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            :disabled="loading || !sdkLoaded || chargeAmount < 1000" 
            @click="startPayment"
            class="submit-btn"
          >
            {{ loading ? "결제 중..." : "베리 충전하기" }}
          </v-btn>
        </div>
      </div>
    </v-dialog>
    
    <!-- 결제 실패 모달 -->
    <v-dialog v-model="failureModalOpen" max-width="500" content-class="berry-charge-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">결제 실패</div>
          <v-btn icon @click="closeFailureModal" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="failure-message-container">
            <v-icon icon="mdi-alert-circle" color="#ff5252" size="x-large" class="failure-icon"></v-icon>
            <div class="failure-message">{{ failureMessage }}</div>
          </div>
        </div>
        
        <div class="modal-footer">
          <v-btn 
            color="#b084cc" 
            block 
            @click="closeFailureModal"
            class="submit-btn"
          >
            확인
          </v-btn>
        </div>
      </div>
    </v-dialog>
    
    <!-- 결제 취소 확인 모달 -->
    <v-dialog v-model="cancelConfirmOpen" max-width="400" content-class="berry-charge-modal">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-title">구매 취소</div>
          <v-btn icon @click="closeCancelConfirm" class="close-btn">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <div class="modal-content">
          <div class="warning-message-container">
            <v-icon icon="mdi-alert" color="#ff9800" size="x-large" class="warning-icon"></v-icon>
            <div class="warning-message">
              <p>구매를 취소하시겠습니까?</p>
              <p class="warning-submessage">취소 후에는 다시 복구할 수 없습니다.</p>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <div class="cancel-btn-group">
            <v-btn 
              variant="outlined" 
              class="cancel-btn" 
              @click="closeCancelConfirm"
            >
              아니오
            </v-btn>
            <v-btn 
              color="#ff5252" 
              class="confirm-btn" 
              :loading="cancelLoading"
              @click="confirmCancelPayment"
            >
              예, 취소합니다
            </v-btn>
          </div>
        </div>
      </div>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      berryBalance: 0,
      berryHistories: [],
      defaultProfileImage: 'https://bestplace-media.s3.ap-northeast-2.amazonaws.com/bestplace-basic-profile-image.png',
      paymentApi: process.env.VUE_APP_PAYMENT_API,
      
      // 탭 관련
      activeTab: 'seoul',
      
      // 사용내역 페이징 관련
      currentPage: 1,
      totalPages: 0,
      pageSize: 10,
      
      // 구매내역 관련
      berryPayments: [],
      paymentPage: 1,
      paymentTotalPages: 0,
      
      // 충전 모달 관련
      chargeModalOpen: false,
      chargeAmount: 1000,
      loading: false,
      sdkLoaded: false,
      
      // 결제 실패 모달 관련
      failureModalOpen: false,
      failureMessage: '',
      
      // 결제 취소 관련
      cancelConfirmOpen: false,
      selectedPaymentId: null,
      cancelLoading: false,
      
      // 후원받은 내역 관련
      donationHistories: [],
      donationPage: 1,
      donationTotalPages: 0,
      totalDonatedBerry: 0
    }
  },
  mounted() {
    this.fetchBerryBalance()
    this.fetchBerryHistories()
    this.fetchBerryPayments()
    this.loadPaymentSDK()
    this.fetchTotalDonatedBerry()
  },
  methods: {
    async fetchBerryBalance() {
      try {
        const response = await axios.get(`${this.paymentApi}/payment/my/berry`)
        this.berryBalance = response.data.result.balance || 0
      } catch (error) {
        console.error('베리 정보를 가져오는 중 오류가 발생했습니다:', error)
        this.berryBalance = 0
      }
    },
    async fetchBerryHistories() {
      try {
        // 백엔드는 페이지를 0부터 시작하므로 -1 처리
        const pageIndex = this.currentPage - 1
        
        const response = await axios.get(`${this.paymentApi}/payment/my/sent/done`, {
          params: {
            page: pageIndex,
            size: this.pageSize,
            sort: 'createdTime,desc'
          }
        })
        
        if (response.data && response.data.result) {
          const result = response.data.result
          this.berryHistories = result.content || []
          this.totalPages = result.totalPages || 0
          
          console.log('베리 사용내역:', this.berryHistories)
        }
      } catch (error) {
        console.error('베리 사용내역을 가져오는 중 오류가 발생했습니다:', error)
        this.berryHistories = []
      }
    },
    async fetchBerryPayments() {
      try {
        // 백엔드는 페이지를 0부터 시작하므로 -1 처리
        const pageIndex = this.paymentPage - 1
        
        const response = await axios.get(`${this.paymentApi}/payment/my/payment`, {
          params: {
            page: pageIndex,
            size: this.pageSize,
            sort: 'createdTime,desc'
          }
        })
        
        if (response.data && response.data.result) {
          const result = response.data.result
          this.berryPayments = result.content || []
          this.paymentTotalPages = result.totalPages || 0
          
          console.log('베리 구매내역:', this.berryPayments)
        }
      } catch (error) {
        console.error('베리 구매내역을 가져오는 중 오류가 발생했습니다:', error)
        this.berryPayments = []
      }
    },
    async fetchDonationHistories() {
      try {
        // 백엔드는 페이지를 0부터 시작하므로 -1 처리
        const pageIndex = this.donationPage - 1
        
        const response = await axios.get(`${this.paymentApi}/payment/my/received/done`, {
          params: {
            page: pageIndex,
            size: this.pageSize,
            sort: 'createdTime,desc'
          }
        })
        
        if (response.data && response.data.result) {
          const result = response.data.result
          this.donationHistories = result.content || []
          this.donationTotalPages = result.totalPages || 0
          
          console.log('후원 받은 내역:', this.donationHistories)
        }
      } catch (error) {
        console.error('후원 받은 내역을 가져오는 중 오류가 발생했습니다:', error)
        this.donationHistories = []
      }
    },
    async fetchTotalDonatedBerry() {
      try {
        const response = await axios.get(`${this.paymentApi}/payment/my/received/dona`)
        this.totalDonatedBerry = response.data.result || 0
        console.log('총 후원받은 베리:', this.totalDonatedBerry)
      } catch (error) {
        console.error('총 후원받은 베리 정보를 가져오는 중 오류가 발생했습니다:', error)
        this.totalDonatedBerry = 0
      }
    },
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      
      const date = new Date(dateTime)
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      
      return `${year}/${month}/${day} ${hours}:${minutes}`
    },
    
    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    },
    
    // 구매 취소 관련 메소드
    cancelPayment(paymentId) {
      this.selectedPaymentId = paymentId
      this.cancelConfirmOpen = true
    },
    
    closeCancelConfirm() {
      this.cancelConfirmOpen = false
      this.selectedPaymentId = null
    },
    
    async confirmCancelPayment() {
      if (!this.selectedPaymentId) return
      
      this.cancelLoading = true
      
      try {
        // 실제 취소 API 호출 - 파라미터 형식으로 paymentId 전달
        await axios.patch(`${this.paymentApi}/payment/cancel?paymentId=${this.selectedPaymentId}`)
        
        // 취소 성공 후 데이터 갱신
        this.fetchBerryBalance()
        this.fetchBerryPayments()
        
        // 모달 닫기
        this.closeCancelConfirm()
      } catch (error) {
        console.error('베리 구매 취소 중 오류가 발생했습니다:', error)
        this.showFailureModal(error.response?.data?.message || '구매 취소에 실패했습니다.')
      } finally {
        this.cancelLoading = false
      }
    },
    
    // 충전 모달 관련 메소드
    openChargeModal() {
      this.chargeAmount = 1000
      this.chargeModalOpen = true
    },
    
    closeChargeModal() {
      this.chargeModalOpen = false
    },
    
    addAmount(amount) {
      this.chargeAmount += amount
    },
    
    clearAmount() {
      this.chargeAmount = 0
    },
    
    // 결제 관련 메소드
    loadPaymentSDK() {
      if (!window.IMP) {
        const script = document.createElement("script")
        script.src = "https://cdn.iamport.kr/v1/iamport.js"
        script.onload = () => {
          console.log("포트원 SDK 로딩 완료")
          this.sdkLoaded = true
        }
        script.onerror = () => {
          console.error("포트원 SDK 로딩 실패")
          alert("결제 모듈 로딩에 실패했습니다.")
        }
        document.head.appendChild(script)
      } else {
        this.sdkLoaded = true
      }
    },
    
    closeFailureModal() {
      this.failureModalOpen = false
    },
    
    showFailureModal(message) {
      this.failureMessage = message
      this.failureModalOpen = true
    },
    
    async startPayment() {
      if (this.chargeAmount < 1000) {
        this.showFailureModal("최소 1,000개 이상 충전 가능합니다.")
        return
      }
      
      this.loading = true

      if (!window.IMP) {
        this.showFailureModal("결제 모듈이 아직 로딩되지 않았습니다.")
        this.loading = false
        return
      }

      try {
        // 1. 결제 준비 요청
        const readyRes = await axios.post(`${this.paymentApi}/payment/ready`, {
          quantity: this.chargeAmount
        })

        const merchantUid = readyRes.data?.result?.merchantUid
        if (!merchantUid) throw new Error("merchantUid가 없습니다.")

        // 2. 결제 요청
        const IMP = window.IMP
        IMP.init("imp24077746")

        const nickname = localStorage.getItem("nickname") || "비회원"
        const email = localStorage.getItem("email") || "unknown@example.com"
        
        // 최종 결제 금액 (베리 * 1.1)
        const totalAmount = Math.round(this.chargeAmount * 1.1)

        IMP.request_pay({
          pg: "html5_inicis",
          pay_method: "easy", // 기본값이지만 카카오페이 등 간편결제 허브에서도 사용 가능
          merchant_uid: merchantUid,
          name: `베리 ${this.chargeAmount}개`,
          amount: totalAmount,
          buyer_name: nickname,
          buyer_email: email
        }, async (rsp) => {
          if (rsp.success) {
            // 3. 결제 승인 요청
            const approveRes = await axios.post(`${this.paymentApi}/payment/approve`, {
              impUid: rsp.imp_uid,
              merchantUid: rsp.merchant_uid
            })

            console.log("승인 응답:", approveRes.data)
            
            // 모달 닫기
            this.closeChargeModal()
            
            // 베리 잔액 갱신
            this.fetchBerryBalance()
          } else {
            // 실패 시 모달 표시
            this.showFailureModal("결제 실패: " + rsp.error_msg)
          }

          this.loading = false
        })

      } catch (e) {
        console.error("결제 중 오류:", e)
        this.showFailureModal("에러 발생: " + e.message)
        this.loading = false
      }
    }
  },
  watch: {
    activeTab(newTab) {
      // 탭 전환 시 데이터 로드
      if (newTab === 'seoul') {
        this.currentPage = 1
        this.fetchBerryHistories()
      } else if (newTab === 'gyeonggi') {
        this.paymentPage = 1
        this.fetchBerryPayments()
      } else if (newTab === 'busan') {
        this.donationPage = 1
        this.fetchDonationHistories()
        this.fetchTotalDonatedBerry()
      }
    }
  }
}
</script>

<style scoped>
.berry-wrapper {
  width: 100%;
  background-color: #000000;
  color: white;
  min-height: calc(100vh - 60px); /* 헤더 높이를 뺀 전체 화면 높이 */
}

.berry-content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 15px;
}

.berry-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 20px;
}

.purple-text {
  color: #B084CC;
}

.berry-info-section {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #1a1a1a;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}

.berry-info-text {
  flex-grow: 1;
}

.berry-info-title {
  font-size: 16px;
  color: #aaa;
  margin-bottom: 5px;
}

.berry-amount {
  font-size: 28px;
  font-weight: 600;
}

.berry-unit {
  font-size: 20px;
  font-weight: 400;
  margin-left: 5px;
}

.charge-btn {
  text-transform: none;
  font-weight: 500;
  height: 36px;
  border-radius: 20px;
  padding: 0 20px;
  position: absolute;
  right: 50px;
}

.divider {
  height: 1px;
  background-color: #222;
  margin: 20px 0;
}

.berry-history-header {
  display: flex;
  background-color: #1a1a1a;
  border-radius: 8px 8px 0 0;
  padding: 12px 20px;
  font-weight: 500;
  color: #aaa;
}

.berry-history-item {
  display: flex;
  padding: 15px 20px;
  border-bottom: 1px solid #222;
}

.history-cell {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-date {
  width: 20%;
}

.history-amount {
  width: 15%;
}

.history-type {
  width: 15%;
}

.history-sender {
  width: 20%;
}

.history-message {
  width: 30%;
}

.sender-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sender-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 충전 모달 스타일 */
.berry-charge-modal {
  background: transparent !important;
  box-shadow: none !important;
}

.modal-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  overflow: hidden;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #333;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
}

.modal-content {
  padding: 20px;
}

.charge-input-group {
  margin-bottom: 20px;
}

.input-label {
  font-size: 14px;
  color: #aaa;
  margin-bottom: 8px;
}

.charge-input-container {
  display: flex;
  align-items: center;
  background-color: #333;
  border-radius: 8px;
  padding: 12px;
}

.charge-icon {
  font-size: 20px;
  margin-right: 10px;
}

.charge-amount {
  flex-grow: 1;
  font-size: 18px;
  font-weight: 600;
}

.clear-btn {
  color: #aaa;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.amount-btn {
  flex-grow: 1;
  text-transform: none;
  color: white !important;
  border-color: #555 !important;
}

.total-price-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.total-price-label {
  font-size: 16px;
  font-weight: 500;
}

.total-price-value {
  font-size: 18px;
  font-weight: 600;
  color: #b084cc;
}

.agreement-text {
  font-size: 12px;
  color: #aaa;
  text-align: center;
  margin-bottom: 10px;
}

.modal-footer {
  padding: 16px;
  border-top: 1px solid #333;
}

.submit-btn {
  height: 44px;
  font-size: 16px;
  font-weight: 500;
}

/* 결제 실패 모달 스타일 */
.failure-message-container {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: rgba(255, 82, 82, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
}

.failure-icon {
  margin-right: 16px;
}

.failure-message {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

/* 구매 내역 스타일 */
.purchase-date {
  width: 30%;
}

.purchase-quantity {
  width: 20%;
}

.purchase-price {
  width: 25%;
}

.purchase-action {
  width: 25%;
  text-align: center;
}

.payment-method {
  display: none;
}

/* 결제 취소 관련 스타일 */
.warning-message-container {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: rgba(255, 152, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 20px;
}

.warning-icon {
  margin-right: 16px;
}

.warning-message {
  font-size: 16px;
  line-height: 1.5;
  color: #fff;
}

.warning-submessage {
  font-size: 14px;
  color: #aaa;
  margin-top: 8px;
}

.cancel-btn-group {
  display: flex;
  width: 100%;
  gap: 10px;
}

.cancel-btn {
  flex: 1;
  border-color: #555 !important;
  color: white !important;
}

.confirm-btn {
  flex: 2;
}

/* 후원 받은 내역 스타일 */
.donation-date {
  width: 33%;
}

.donation-amount {
  width: 33%;
}

.donation-sender {
  width: 34%;
}

.v-tabs {
  position: relative;
}

.total-donation-badge {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  background-color: #1a1a1a;
  border-radius: 8px;
  padding: 6px 12px;
  color: #aaa;
  display: flex;
  align-items: center;
}

.total-donation-amount {
  color: #b084cc;
  font-weight: 600;
  margin-left: 5px;
}
</style>