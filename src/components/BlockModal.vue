<template>
  <v-dialog v-model="dialog" max-width="400px">
    <v-card class="block-modal">
      <v-card-title class="text-h6">사용자 차단</v-card-title>
      <v-card-text>
        <p class="block-message">해당 사용자를 차단하시겠습니까?</p>
        <p class="block-info">차단된 사용자의 메시지는 더 이상 표시되지 않습니다.</p>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" text @click="close">취소</v-btn>
        <v-btn color="error" @click="confirmBlock">차단</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  message: Object
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const dialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const close = () => {
  dialog.value = false
}

const confirmBlock = () => {
  emit('confirm', props.message)
  close()
}
</script>

<style scoped>
.block-modal {
  background-color: #1e2029;
  color: #fff;
}

.block-modal :deep(.v-card-title) {
  color: #fff;
  font-size: 1.25rem;
  font-weight: 500;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.block-modal :deep(.v-card-text) {
  padding: 24px;
}

.block-modal :deep(.v-card-actions) {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.block-message {
  font-size: 1rem;
  margin-bottom: 8px;
}

.block-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
}

.block-modal :deep(.v-btn) {
  text-transform: none;
  font-weight: 500;
}

.block-modal :deep(.v-btn--text) {
  color: rgba(255, 255, 255, 0.7);
}

.block-modal :deep(.v-btn--contained) {
  background-color: #ff4444;
  color: #fff;
}
</style> 