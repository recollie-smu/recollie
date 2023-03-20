<script setup lang="ts">
import type { Reminder } from "@/types/reminder";
import type { SensorInput } from "@/types/sensor";
import type { TaskData } from "@/types/task";
import { getReminders } from "@/apis/reminders";
import { computed, onBeforeMount, onBeforeUnmount, ref, type Ref } from "vue";
import { useTimeoutFn } from "@vueuse/core";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

import TaskList from "@/components/TaskList.vue";
import CurrentTask from "@/components/CurrentTask.vue";

dayjs.extend(CustomParseFormat);

const reminders: Ref<Reminder[]> = ref([]);
const socket: Ref<Socket<DefaultEventsMap, DefaultEventsMap> | null> =
  ref(null);
const currentInput = ref("");
const currentTask: Ref<Reminder | null> = ref(null);
const recollieMood = ref(0);
const recollieImage = ref("");
const { isPending, start, stop } = useTimeoutFn(() => {
  getRecollieImage();
}, 3000);
const taskStart = ref(() => {});
const taskStop = ref(() => {});
const taskPending = ref(false);
const isTaskCompleted = ref(true);
const stopTask = ref(() => {});
const treats = ref(0);

const populateReminders = async () => {
  try {
    reminders.value = await getReminders();
  } catch (error) {
    console.log(error);
  }
};

const filteredReminders = computed(() => {
  const tmpReminders: Reminder[] = [];
  const currTime = dayjs();

  for (const reminder of reminders.value) {
    const reminderTime = dayjs(reminder.time, "hh:mm:ss");
    if (reminderTime.isAfter(currTime)) {
      tmpReminders.push(reminder);
    }
  }
  if (tmpReminders.length > 0) {
    const taskToSchedule = tmpReminders[0];
    const timeDiff = dayjs(taskToSchedule.time, "hh:mm:ss").diff(dayjs());

    useTimeoutFn(() => {
      selectCurrentTask(taskToSchedule);
    }, timeDiff);
  }
  return tmpReminders;
});

const getRecollieImage = (motionType?: number) => {
  let imageUrl = "/src/assets/";
  if (motionType) {
    switch (motionType) {
      case 0:
        imageUrl += "detect_happy.gif";
        break;
      case 1:
        imageUrl += "eat.gif";
        break;
      case 2:
        imageUrl += "pet.gif";
        break;

      default:
        imageUrl += "detect_happy.gif";
        break;
    }
    start();
  } else {
    switch (recollieMood.value) {
      case 0:
        imageUrl += "idle_happy.gif";
        break;
      case 1:
        imageUrl += "idle_normal.gif";
        break;
      case 2:
        imageUrl += "idle_sad.gif";
        break;
      default:
        imageUrl += "idle_normal.gif";
        break;
    }
  }
  recollieImage.value = new URL(imageUrl, import.meta.url).href;
};

const selectCurrentTask = (task: Reminder) => {
  currentTask.value = task;
  const taskTime = dayjs(task.time, "hh:mm:ss");
  const timeVal = taskTime.diff(dayjs());
  const { isPending, start, stop } = useTimeoutFn(() => {
    isTaskCompleted.value = false;
    broadcastTask(task.id, task.location);
  }, timeVal);
  taskPending.value = isPending.value;
  taskStart.value = start;
  taskStop.value = stop;
};

const initSocket = () => {
  socket.value = io("ws://localhost:8080/web-ui");

  socket.value.on("sensor", (data: SensorInput) => {
    switch (data.inputType) {
      case 1:
        getRecollieImage(0);
        break;
      case 2:
        getRecollieImage(1);
        break;
      case 3:
        getRecollieImage(2);
        break;
      default:
        break;
    }
  });

  socket.value.on("task", (data: TaskData) => {
    if (data.status === 3) {
      stopTask.value();
      treats.value++;
    }
  });
};

onBeforeMount(() => {
  initSocket();
  populateReminders();
  getRecollieImage();
});

onBeforeUnmount(() => {
  if (isPending.value) {
    stop();
  }
});

const broadcastTask = (taskId: number, location: number) => {
  socket.value?.emit("task", { taskId, status: 1, location });
  const { start, stop } = useTimeoutFn(
    () => {
      // minus health
    },
    currentTask.value ? currentTask.value.duration : 300000
  );
  start();
  stopTask.value = stop;
};

const consumeTreat = () => {
  treats.value--;
};
</script>

<template>
  <main class="grid grid-cols-12 gap-9">
    <div
      class="col-span-4 bg-white rounded-xl shadow-sm pa-3 h-full overflow-scroll"
    >
      <task-list :reminders="filteredReminders" />
    </div>

    <div class="col-span-8 flex flex-col justify-center items-center gap-6">
      <div
        class="bg-primary-99 h-3/5 w-full rounded-2xl text-primary-50 p-6 shadow-primary-95 shadow-sm"
        v-if="currentTask"
      >
        <current-task :task="currentTask" />
      </div>

      <div
        class="bg-amber-100 h-2/5 w-full rounded-2xl shadow-amber-200 shadow-sm"
      >
        <va-image
          class="max-h-36"
          :src="recollieImage"
          :ratio="1"
          fit="contain"
        />
      </div>
    </div>
  </main>
</template>
