<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card class="report-modal">
      <v-card-title class="text-h6">채팅 신고하기</v-card-title>
      <v-card-text>
        <div class="message-preview" v-if="props.message">
          <p class="preview-title">신고할 메시지:</p>
          <div class="message-content">
            <strong>{{ props.message.sender }}:</strong> {{ props.message.message }}
          </div>
          <div class="message-meta">
            메시지 ID: {{ props.message.messageId }}
          </div>
        </div>

        <v-form @submit.prevent="submitReport">
          <v-select
            v-model="reportData.reportType"
            :items="reportTypes"
            label="신고 유형"
            required
          ></v-select>

          <v-textarea
            v-model="reportData.reportReason"
            label="신고 사유"
            :rules="[v => !!v || '신고 사유를 입력해주세요', v => v.length <= 300 || '300자 이내로 입력해주세요']"
            counter="300"
            required
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="close">취소</v-btn>
        <v-btn color="primary" @click="submitReport" :disabled="!isValid">신고하기</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watchEffect } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  message: Object
})

const emit = defineEmits(['update:modelValue', 'submit'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const reportData = ref({
  reportedChatMessageId: null,
  reportType: null,
  reportReason: ''
})

// props.message가 변경될 때마다 reportData의 reportedChatMessageId를 업데이트
watchEffect(() => {
  if (props.message) {
    console.log('메시지 ID 설정:', props.message.messageId);
    // reportedChatMessageId가 항상 최신 상태로 유지되도록 함
    reportData.value.reportedChatMessageId = props.message.messageId;
  }
})

const reportTypes = [
  { title: '욕설/비방', value: 'ABUSE' },
  { title: '도배', value: 'SPAMMING' },
  { title: '성적인 발언', value: 'SEXUAL' },
  { title: '기타', value: 'OTHER' }
]

const isValid = computed(() => {
  return reportData.value.reportType && 
         reportData.value.reportReason && 
         reportData.value.reportReason.length <= 300 &&
         reportData.value.reportedChatMessageId
})

const close = () => {
  dialog.value = false
  resetForm()
}

const resetForm = () => {
  reportData.value = {
    reportedChatMessageId: props.message?.messageId || null,
    reportType: null,
    reportReason: ''
  }
}

const submitReport = () => {
  if (!reportData.value.reportedChatMessageId) {
    console.error('메시지 ID가 없습니다:', props.message);
    alert('메시지 ID가 없어 신고할 수 없습니다.');
    return;
  }
  
  console.log('신고 데이터 전송:', reportData.value);
  
  if (isValid.value) {
    const reportPayload = {
      ...reportData.value,
      // messageId가 문자열인 경우 숫자로 변환 시도
      reportedChatMessageId: Number(reportData.value.reportedChatMessageId) || reportData.value.reportedChatMessageId
    };
    
    emit('submit', reportPayload);
    close();
  }
}
</script>

<style scoped>
.report-modal {
  background-color: #1e2029;
  color: #fff;
}

.message-preview {
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(45, 45, 45, 0.5);
  border-radius: 4px;
  border-left: 3px solid #B084CC;
}

.preview-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.message-content {
  font-size: 14px;
  margin-bottom: 8px;
}

.message-meta {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.report-modal :deep(.v-card-title) {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 600;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.report-modal :deep(.v-card-text) {
  padding: 24px;
}

.report-modal :deep(.v-card-actions) {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.report-modal :deep(.v-text-field input),
.report-modal :deep(.v-textarea textarea) {
  color: #fff;
}

.report-modal :deep(.v-text-field .v-label),
.report-modal :deep(.v-textarea .v-label) {
  color: rgba(255, 255, 255, 0.7);
}

.report-modal :deep(.v-text-field .v-input__slot),
.report-modal :deep(.v-textarea .v-input__slot) {
  background-color: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.report-modal :deep(.v-select .v-input__slot) {
  background-color: #2d2d2d;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.report-modal :deep(.v-btn) {
  text-transform: none;
  font-weight: 600;
}

.report-modal :deep(.v-btn--text) {
  color: rgba(255, 255, 255, 0.7);
}

.report-modal :deep(.v-btn--contained) {
  background-color: #00ff84;
  color: #000;
}
</style>