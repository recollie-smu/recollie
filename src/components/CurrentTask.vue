<script setup lang="ts">
import type { Reminder } from "@/types/reminder";
import dayjs from "dayjs";
import defaultTaskImage from "@/assets/fallback.png";
import { onMounted, ref } from "vue";

const props = defineProps<{ task: Reminder }>();
const audio = ref<HTMLAudioElement>();
onMounted(() => {
  if (props.task.memo && props.task.memo !== "") {
    audio.value = new Audio(props.task.memo);
    audio.value.play();
  }
});
</script>
<template>
  <div class="flex h-full">
    <div class="flex flex-col h-full w-1/2">
      <p class="text-4xl font-medium mb-2">{{ task.name }}</p>
      <p class="text-xl">{{ task.description }}</p>
      <p>{{ dayjs(task.time, "hh:mm:ss").format("hh:mm A") }}</p>
    </div>

    <div class="h-full w-1/2">
      <va-image v-if="task.image" :src="task.image" :ratio="1" />
      <va-image v-else :src="defaultTaskImage" :ratio="1" />
    </div>
  </div>
</template>

<style scoped></style>
