<template>
  <div id="app">
    <h1>FaceBook 帖子搜索</h1>
    <input v-model="searchQuery" placeholder="输入标签搜索..." />
    
    <div>帖子数量<input v-model="cNumber"></input></div>
    <div>多开数量<input v-model="pageNumber"></input></div>
    
    <button @click="searchPosts">搜索</button>

    <div v-if="loading">加载中...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="posts.length">
      <h2>搜索结果：</h2>
      <div class="posts">
        <div v-for="post in posts" :key="post.link" class="post">
          {{ post }}
          <!-- <a :href="post.link" target="_blank" rel="noopener noreferrer">
            <img :src="post.image" :alt="post.alt" />
          </a> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const searchQuery = ref('');
const posts = ref([]);
const loading = ref(false);
const error = ref('');

const cNumber=ref(10)
const pageNumber = ref(1)

const searchPosts = async () => {
  if (!searchQuery.value) {
    error.value = '请输入搜索关键词';
    return;
  }
  loading.value = true;
  error.value = '';
  posts.value = [];
  try {
    const response = await window.ipcRenderer.fetchInstagramPosts(searchQuery.value, {
      crawlNumber: cNumber.value,
      pageNumber: pageNumber.value
    });
    if (response.success) {
      posts.value = response.data;
    } else {
      error.value = response.error;
    }
  } catch (err) {
    error.value = '发生错误，请稍后重试';
  } finally {
    loading.value = false;
  }
};
</script>

<style>
/* 添加一些基本样式 */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  padding: 20px;
}

input {
  padding: 8px;
  width: 200px;
}

button {
  padding: 8px 12px;
  margin-left: 10px;
}

.posts {
  display: flex;
  flex-wrap: wrap;
  margin-top: 20px;
}

.post {
  margin: 10px;
}

.post img {
  width: 150px;
  height: 150px;
  object-fit: cover;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>
