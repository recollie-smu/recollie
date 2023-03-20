<script setup lang="ts">
import type { Reminder } from "@/types/reminder";
import type { SensorInput } from "@/types/sensor";
import type { TaskData } from "@/types/task";
import { getReminders } from "@/apis/reminders";
import { onBeforeMount, ref, type Ref } from "vue";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

import defaultTaskImage from "@/assets/default_task.avif";

import TaskList from "@/components/TaskList.vue";

dayjs.extend(CustomParseFormat);

const reminders: Ref<Reminder[]> = ref([]);
const socket: Ref<Socket<DefaultEventsMap, DefaultEventsMap> | null> =
  ref(null);
const currentInput = ref("");
const taskListener = ref();
const currentTask: Ref<Reminder | null> = ref(null);

const populateReminders = async () => {
  try {
    reminders.value = await getReminders();
    selectCurrentTask(reminders.value[0]);
  } catch (error) {
    console.log(error);
  }
};

const getRecollieImage = () => {
  return new URL("/src/assets/idle_happy.gif", import.meta.url).href;
};

const selectCurrentTask = (task: Reminder) => {
  currentTask.value = task;
};

const initSocket = () => {
  socket.value = io("ws://localhost:8080/web-ui");
  socket.value.on("sensor", (data: SensorInput) => {
    switch (data.inputType) {
      case 1:
        currentInput.value = "Motion";
        break;
      case 2:
        currentInput.value = "Swipe Right";
        break;
      case 3:
        currentInput.value = "Swipe Left";
        break;
      default:
        break;
    }
  });
  socket.value.on("task", (data: TaskData) => {
    taskListener.value = data;
  });
};

onBeforeMount(() => {
  initSocket();
  populateReminders();
});

const broadcastTask = () => {
  socket.value?.emit("task", { taskId: 123, status: 1, location: 1 });
};
</script>

<template>
  <main class="grid grid-cols-12 h-screen p-8 gap-9">
    <div
      class="col-span-4 bg-white rounded-xl shadow-md pa-3 h-full overflow-scroll"
    >
      <task-list :reminders="reminders" />
    </div>

    <div class="col-span-8 flex flex-col justify-center items-center gap-6">
      <div
        class="bg-primary-99 h-3/5 w-full rounded-2xl text-primary-50 p-6"
        v-if="currentTask"
      >
        <div class="flex h-full">
          <div class="flex flex-col h-full w-1/2">
            <p class="text-4xl font-medium mb-2">{{ currentTask.name }}</p>
            <p class="text-xl">{{ currentTask.description }}</p>
            <p>{{ dayjs(currentTask.time, "hh:mm:ss").format("hh:mm A") }}</p>
          </div>

          <div class="h-full w-1/2">
            <va-image
              v-if="currentTask.image"
              :src="currentTask.image"
              :ratio="1"
            />
            <va-image v-else :src="defaultTaskImage" :ratio="1" />
          </div>
        </div>
      </div>
      <div class="bg-amber-200 h-2/5 w-full rounded-2xl">
        <va-image
          class="max-h-36"
          :src="getRecollieImage()"
          :ratio="1"
          fit="contain"
        />
      </div>
      <!-- <p class="text-center">INPUT: {{ currentInput }}</p>
      <p class="text-center">TASK LISTENER: {{ taskListener }}</p>
      <div>
        <va-button @click="broadcastTask"> Send </va-button>
      </div> -->
    </div>
  </main>
</template>
