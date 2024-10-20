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
   
    <div v-if="comments" class="comments-list">
      遍历结束，本次共有 {{ Object.values(comments).length }} 条评论
      <button @click="showResult = true">展示结果</button>
      {{ showResult }}
      <result :result="comments" v-model="showResult" v-if="showResult"></result>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import result from './result.vue'
// 定义响应式变量
const keyword = ref('')
const comments = ref({
  '18047096992799088': {
    "pk": "18047096992799088",
    "user_id": "55272173004",
    "type": 0,
    "did_report_as_spam": false,
    "created_at": 1727465578,
    "created_at_utc": 1727465578,
    "created_at_for_fb_app": 1727465578,
    "content_type": "comment",
    "status": "Active",
    "bit_flags": 0,
    "share_enabled": true,
    "is_ranked_comment": true,
    "media_id": "3463352584219040628",
    "comment_index": 0,
    "strong_id__": "18047096992799088",
    "text": "🔥🔥🔥🔥🔥🔥❤️",
    "is_covered": false,
    "is_liked_by_media_owner": true,
    "inline_composer_display_condition": "never",
    "has_liked_comment": false,
    "comment_like_count": 1,
    "private_reply_status": 0,
    "preview_child_comments": [
        {
            "pk": "18057402805761034",
            "user_id": "29647635811",
            "type": 2,
            "did_report_as_spam": false,
            "created_at": 1727517543,
            "created_at_utc": 1727517543,
            "created_at_for_fb_app": 1727517543,
            "content_type": "comment",
            "status": "Active",
            "bit_flags": 0,
            "share_enabled": true,
            "is_ranked_comment": false,
            "media_id": "3463352584219040628",
            "parent_comment_id": "18047096992799088",
            "is_created_by_media_owner": true,
            "replied_to_comment_id": "18047096992799088",
            "strong_id__": "18057402805761034",
            "text": "@blooj504 🙌🙌",
            "is_covered": false,
            "user": {
                "pk": "29647635811",
                "pk_id": "29647635811",
                "id": "29647635811",
                "username": "aj.customkicks",
                "full_name": "Custom Kicks",
                "is_private": false,
                "strong_id__": "29647635811",
                "fbid_v2": "17841429634345954",
                "is_verified": false,
                "profile_pic_id": "2326231284879022029_29647635811",
                "profile_pic_url": "https://scontent-hkg1-2.cdninstagram.com/v/t51.2885-19/102892801_634078863860619_2274785517618427552_n.jpg?stp=dst-jpg_s150x150&_nc_ht=scontent-hkg1-2.cdninstagram.com&_nc_cat=103&_nc_ohc=QbkYtVonUpAQ7kNvgEqsbh5&_nc_gid=e1fc492401c24b5fb051100c27c16bce&edm=AId3EpQBAAAA&ccb=7-5&oh=00_AYDzwVc83S_7jn-F8FX4Yx5AOROYeCxO2Dz7I1JI9K58lw&oe=671AC358&_nc_sid=f5838a",
                "is_mentionable": true,
                "latest_reel_media": 0
            },
            "has_liked_comment": false,
            "comment_like_count": 0,
            "private_reply_status": 0
        }
    ],
    "child_comment_count": 1,
    "has_more_head_child_comments": false,
    "has_more_tail_child_comments": false,
    "other_preview_users": [],
    "user": {
        "pk": "55272173004",
        "pk_id": "55272173004",
        "id": "55272173004",
        "username": "blooj504",
        "full_name": "Jaeden",
        "is_private": true,
        "strong_id__": "55272173004",
        "fbid_v2": "17841455350129021",
        "is_verified": false,
        "profile_pic_url": "https://instagram.fixb1-2.fna.fbcdn.net/v/t51.2885-19/44884218_345707102882519_2446069589734326272_n.jpg?stp=dst-jpg_e0_s150x150&_nc_ht=instagram.fixb1-2.fna.fbcdn.net&_nc_cat=1&_nc_ohc=FVGrDvp3kQsQ7kNvgGAeveZ&_nc_gid=b6df8d3c2f8941d28f6a007eaf9bc413&edm=AFFDd_gBAAAA&ccb=7-5&ig_cache_key=YW5vbnltb3VzX3Byb2ZpbGVfcGlj.3-ccb7-5&oh=00_AYBnwNVrDWsK_hkq2FoWbsvJRzt1Vbtk1fdDzXWXEnQlVw&oe=671AC6CF&_nc_sid=421beb",
        "is_mentionable": true
    }
}
})
const loading = ref(false)
const error = ref('')
const showResult = ref(false)

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
  comments.value = {}
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

<style scoped lang="scss">
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
  #result-page {
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
  }
}


</style>
