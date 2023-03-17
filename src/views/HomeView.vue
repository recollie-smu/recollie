<script setup lang="ts">
import type { Reminder } from "@/types/reminder";
import type { SensorInput } from "@/types/sensor";
import { ref, type Ref } from "vue";
import { VaList } from "vuestic-ui/web-components";
import { supabase } from "@/apis/supabase";
import { io, Socket } from "socket.io-client";
import dayjs from "dayjs";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import type { TaskData } from "@/types/task";
const reminders: Ref<Reminder[]> = ref([]);
const socket: Ref<Socket<DefaultEventsMap, DefaultEventsMap> | null> =
  ref(null);
const currentInput = ref("");
const taskListener = ref();

const getReminders = async () => {
  try {
    const res = await supabase.from("reminders").select();
    const resData = res.data as Reminder[];
    const currDate = new Date();
    const day = currDate.getDay();
    const currTime = Date.now();
    const currDayjsTime = dayjs();

    const filteredList = resData.filter((reminder) => {
      switch (day) {
        case 0:
          return reminder.sunday;
        case 1:
          return reminder.monday;
        case 2:
          return reminder.tuesday;
        case 3:
          return reminder.wednesday;
        case 4:
          return reminder.thursday;
        case 5:
          return reminder.friday;
        case 6:
          return reminder.saturday;
        default:
          break;
      }
    });
    filteredList.sort((itemA, itemB) => {
      return itemA.time.localeCompare(itemB.time);
    });
    reminders.value = filteredList;
  } catch (error) {
    console.log(error);
  }
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
initSocket();
getReminders();

const broadcastTask = () => {
  socket.value?.emit("task", { taskId: 123, status: 1, location: 1 });
};
</script>

<template>
  <main class="grid grid-cols-12 h-screen p-4 bg-slate-400">
    <va-list class="col-span-4 bg-white rounded-lg">
      <va-list-label class="text-lg bg-blue-600 rounded-t-lg mb-2">
        <p class="text-white">Today's Schedule</p>
      </va-list-label>

      <va-list-item
        v-for="(reminder, index) in reminders"
        :key="index"
        class="list__item mb-4 h-12 px-4"
      >
        <div
          class="bg-blue-400 rounded-lg w-full h-full flex justify-center items-center"
        >
          <va-list-item-section>
            <va-list-item-label
              class="flex justify-around items-center text-center p-2"
            >
              <p class="w-1/2">{{ reminder.time }}</p>
              <p class="w-1/2">{{ reminder.name }}</p>
            </va-list-item-label>
          </va-list-item-section>
        </div>
      </va-list-item>
    </va-list>

    <div class="col-span-8 flex flex-col justify-center items-center">
      <p class="text-center">INPUT: {{ currentInput }}</p>
      <p class="text-center">TASK LISTENER: {{ taskListener }}</p>
      <div>
        <va-button @click="broadcastTask"> Send </va-button>
      </div>
    </div>
  </main>
</template>
