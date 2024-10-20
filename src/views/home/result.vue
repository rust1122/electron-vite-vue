<template>
  <div id="result-page">
    <button @click="showResult = false" class="back-button">返回</button>
    <DataTable :value="Object.values(result)" tableStyle="min-width: 50rem">
      <Column field="created_at" header="created_at">
        <template #body="slotProps">
          {{
            dayjs(slotProps.data.created_at * 1000).format(
              "YYYY-MM-DD hh:mm:ss"
            )
          }}
        </template>
      </Column>
      <Column field="text" header="text"></Column>
      <Column field="user" header="user">
        <template #body="slotProps">
          <button @click="onUserClick(slotProps)">
            {{ slotProps.data.user.username }}
          </button>
        </template>
      </Column>
      <Column field="headerReferer" header="ins地址">
        <template #body="slotProps">
          {{ slotProps.data.headerReferer.referer  }}
        </template>
      </Column>
      <Column field="quantity" header="data">
        <template #body="slotProps">
          <button @click="onDataClick(slotProps)">返回值</button>
        </template></Column
      >
    </DataTable>
    <Dialog
      v-model:visible="userDialogVisible"
      modal
      header="用户信息"
      :style="{ width: '30rem' }"
      class="user-dialog"
    >
      <div class="replay-row">
        <Avatar
          :image="getSafeImageUrl(slotProps.data.user.profile_pic_url)"
          class="mr-2"
          shape="circle"
        />
        <div>{{ slotProps.data.user.username }}</div>
        <div>{{ slotProps.data.text }}</div>
      </div>
      <div>
        {{
          `https://www.instagram.com/rey.noodle/${slotProps.data.user.username}`
        }}
      </div>
      <pre class="user-data-area">{{ slotProps.data.user }}</pre>
    </Dialog>
    <Dialog
      v-model:visible="dataDialogVisible"
      modal
      header="返回值"
      :style="{ width: '30rem' }"
    >
      <pre>{{ slotProps.data }}</pre>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import { computed, ref } from "vue";
import Dialog from "primevue/dialog";
import dayjs from "dayjs";
import Avatar from "primevue/avatar";

const props = defineProps({
  result: {
    type: Object,
    default: () => ({}),
  },
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const slotProps = ref<any>({});

const userDialogVisible = ref(false);
const dataDialogVisible = ref(false);
const showResult = computed({
  get: () => {
    return props.modelValue;
  },
  set: (val) => {
    emits("update:modelValue", val);
  },
});

const emits = defineEmits(["update:modelValue"]);

const getSafeImageUrl = (url: string) => {
  // 去掉 `https://`，用自定义协议 `safe-img://` 替代
  return url.replace(/^https?:\/\//, "safe-img://");
};

const onUserClick = (sp: any) => {
  userDialogVisible.value = true;
  slotProps.value = sp;
};

const onDataClick = (sp: any) => {
  dataDialogVisible.value = true
  slotProps.value = sp;
};
</script>

<style lang="scss" scoped>
#result-page {
  background: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  .back-button {
    width: fit-content;
  }
}
</style>

<style lang="scss">
.user-dialog {
  .replay-row {
    display: flex;
    align-items: flex-start;
    img {
      margin-right: 10px;
    }
    div {
      margin: 0 5px;
    }
  }
  .user-data-area {
    background-color: bisque;
    padding: 10px;
    white-space: break-spaces;
    word-wrap: break-word;
  }
}
</style>
