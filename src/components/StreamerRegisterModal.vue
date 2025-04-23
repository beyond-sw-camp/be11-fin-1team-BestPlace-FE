<template>
    <v-dialog v-model="dialog" persistent max-width="500px">
      <v-card>
        <v-card-title class="text-h6 font-weight-bold">약관 동의</v-card-title>
        <v-card-text>
          <p class="mb-4">
            스튜디오 이용을 위한 약관 동의가 필요합니다.<br />
            <span class="text-link">스튜디오 이용약관</span>,
            <span class="text-link">콘텐츠 가이드라인</span>을 읽고 동의 후 스튜디오 가입을 클릭해주세요.
          </p>
  
          <v-checkbox
            v-model="allAgree"
            label="모두 동의하기"
            @change="toggleAll"
          ></v-checkbox>
  
          <v-sheet class="pa-2 rounded-lg grey lighten-4" elevation="1">
            <v-checkbox
              v-model="agreeTerms"
              label='[필수] 스튜디오 이용약관에 동의합니다.'
              hide-details
              class="mb-2"
              :disabled="allAgree"
            ></v-checkbox>
  
            <v-checkbox
              v-model="agreeGuide"
              label='[필수] 콘텐츠 가이드라인에 동의합니다.'
              hide-details
              :disabled="allAgree"
            ></v-checkbox>
          </v-sheet>
        </v-card-text>
  
        <v-card-actions>
          <v-spacer />
          <v-btn text color="grey" @click="$emit('cancel')">취소</v-btn>
          <v-btn
            color="primary"
            :disabled="!canSubmit"
            @click="$emit('confirm')"
          >
            스튜디오 가입
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script>
  export default {
    data() {
      return {
        dialog: true,
        agreeTerms: false,
        agreeGuide: false,
        allAgree: false,
      };
    },
    computed: {
      canSubmit() {
        return this.agreeTerms && this.agreeGuide;
      },
    },
    methods: {
      toggleAll() {
        const value = this.allAgree;
        this.agreeTerms = value;
        this.agreeGuide = value;
      },
    },
  };
  </script>
  
  <style scoped>
  .text-link {
    color: #5c6bc0;
    text-decoration: underline;
    cursor: pointer;
  }
  </style>
  