<template>
    <div></div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'

const route = useRoute()
const postId = route.params.postId
const token = localStorage.getItem('token')
const memberApi = process.env.VUE_APP_MEMBER_API
const streamingApi = process.env.VUE_APP_STREAMING_API

const title = ref('')
const url = ref('')
const duration = ref(0)
const views = ref(0)
const isAdult = ref('')
const createdTime = ref('')
const category = ref('')
const hashTags = ref([])
const owner = ref('')
const roomId = ref(null)
const chatMessages = ref([])

onMounted(async () => {
  await getVodDetail()
})

const getVodDetail = async () => {
  try {
    const response = await axios.get(`${memberApi}/video/vod/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    const vodDetail = response.data.result
    title.value = vodDetail.title
    url.value = vodDetail.url
    duration.value = vodDetail.duration
    views.value = vodDetail.views
    isAdult.value = vodDetail.isAdult
    createdTime.value = vodDetail.createdTime
    category.value = vodDetail.category
    hashTags.value = vodDetail.hashTags
    owner.value = vodDetail.owner
    roomId.value = vodDetail.roomId
    console.log(vodDetail)
    await getChatMessages()
  } catch (error) {
    console.error('VOD 상세 정보 로드 실패:', error)
  }
}

const getChatMessages = async () => {
  try {
    const response = await axios.get(`${streamingApi}/chat/history/${roomId.value}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    chatMessages.value = response.data.result
    console.log(chatMessages.value)
  } catch (error) {
    console.error('채팅 메시지 로드 실패:', error)
  }
}
</script>

<style scoped>

</style>