<!-- frontend/src/components/Scraper.vue -->
<template>
  <div class="scraper-container">
    <!-- <h1>Ins 评论爬取器</h1> -->
    <div class="input-group">
      <input v-model="keyword" placeholder="输入关键词" />
      
    </div>
    <button @click="startLogin">
        登录
      </button>
    <button @click="startScraping" :disabled="loading">
        {{ loading ? '爬取中...' : '开始爬取' }}
      </button>
    <div v-if="error" class="error">{{ error }}</div>
    <ul v-if="comments.length" class="comments-list">
      <li v-for="(comment, index) in comments" :key="index">{{ comment }}</li>
    </ul>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 定义响应式变量
const keyword = ref('')
const comments = ref([])
const loading = ref(false)
const error = ref('')


// 登录
const startLogin = async () => {
  window.ipcRenderer.loginInstagram()
}

// 定义爬取函数
const startScraping = async () => {
  if (!keyword.value.trim()) {
    alert('请输入关键词')
    return
  }

  loading.value = true
  comments.value = []
  error.value = ''

  try {
    // 调用主进程的 `startScraping` 方法，通过 `window.electronAPI`
    const result = await window.ipcRenderer.fetchInstagramPosts({keyword: keyword.value})

    if (result.success) {
      comments.value = result.comments
    } else {
      error.value = result.error || '爬取失败'
    }
  } catch (err) {
    error.value = err.message || '发生错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.scraper-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

input {
  flex: 1;
  padding: 10px;
  font-size: 16px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error {
  color: red;
  margin-bottom: 20px;
  text-align: center;
}

.comments-list {
  list-style: none;
  padding: 0;
}

.comments-list li {
  background-color: #fff;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>
