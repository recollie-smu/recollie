<script setup lang="ts">
import type { Reminder, GameReminder, ReminderData } from "@/types/reminder";
import type { SensorInput } from "@/types/sensor";
import type { TaskData } from "@/types/task";
import {
  getReminders,
  lowBattNotification,
  taskListNotification,
  taskNotification,
} from "@/apis/reminders";
import {
  health,
  numTreats,
  takeDamage,
  eatTreat,
  addTreat,
  getImage,
  recollieImage,
} from "@/composables/recollie";
import { computed, onBeforeMount, onBeforeUnmount, ref, type Ref } from "vue";
import { useTimeoutFn, useIntervalFn } from "@vueuse/core";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

import TaskList from "@/components/TaskList.vue";
import CurrentTask from "@/components/CurrentTask.vue";

dayjs.extend(CustomParseFormat);

const backgroundLongUrl = new URL(
  "/src/assets/background_long.jpg",
  import.meta.url
).href;
const backgroundShortUrl = new URL(
  "/src/assets/background_short.jpg",
  import.meta.url
).href;
const reminders: Ref<GameReminder[]> = ref([]);
const socket: Ref<Socket<DefaultEventsMap, DefaultEventsMap> | null> =
  ref(null);
const currentTask: Ref<GameReminder | null> = ref(null);
const taskStart = ref(() => {});
const taskStop = ref(() => {});
const taskPending = ref(false);
const isTaskCompleted = ref(true);
const stopTask = ref(() => {});
const stopTaskInterval = ref();
const isTaskIntervalActive = ref(false);
const selectedBackground = ref(backgroundLongUrl);
const petAudio = new Audio(
  new URL("/src/assets/pet.mp3", import.meta.url).href
);
const happyAudio = new Audio(
  new URL("/src/assets/happy.mp3", import.meta.url).href
);
const sadAudio = new Audio(
  new URL("/src/assets/sad.mp3", import.meta.url).href
);

const consumeTreat = () => {
  eatTreat();
  getImage();
};

const populateReminders = async () => {
  try {
    reminders.value = [];
    const retReminders = await getReminders();
    for (const retReminder of retReminders) {
      reminders.value.push({ ...retReminder, completion: 0 });
    }
    health.value = 100;
    getImage();
  } catch (error) {
    console.log(error);
  }
};

const filteredReminders = computed(() => {
  const tmpReminders: GameReminder[] = [];
  const currTime = dayjs();

  for (const reminder of reminders.value) {
    const reminderTime = dayjs(reminder.time, "hh:mm:ss");
    if (reminderTime.isAfter(currTime)) {
      tmpReminders.push(reminder);
    }
  }
  if (tmpReminders.length > 0) {
    const taskToSchedule = tmpReminders[0];
    const timeDiff = Math.abs(
      dayjs(taskToSchedule.time, "hh:mm:ss").diff(dayjs())
    );

    useTimeoutFn(() => {
      selectCurrentTask(taskToSchedule);
      if (socket.value) {
        socket.value.emit("task", {
          taskId: taskToSchedule.id,
          status: 1,
          location: taskToSchedule.location,
        });
      }
    }, timeDiff);
  }
  return tmpReminders;
});

const initSocket = () => {
  socket.value = io("ws://localhost:8080/web-ui");

  socket.value.on("sensor", (data: SensorInput) => {
    if (isTaskCompleted.value) {
      if (data.inputType === 2) {
        if (numTreats.value > 0) {
          consumeTreat();
          getImage(data.inputType);
        }
      } else {
        getImage(data.inputType);
      }
      if (data.inputType === 1) {
        happyAudio.play();
      }
    }
  });

  socket.value.on("task", async (data: TaskData) => {
    if (data.status === 3) {
      if (data.taskId === currentTask.value?.id) {
        isTaskCompleted.value = true;
        await taskNotification(
          3,
          currentTask.value.name,
          currentTask.value.location
        );
        stopTask.value();
        for (const reminder of reminders.value) {
          if (reminder.id === data.taskId) {
            reminder.completion = 1;
            break;
          }
        }
        stopTaskInterval.value();
        addTreat();
        currentTask.value = null;
        selectedBackground.value = backgroundLongUrl;
      }
    } else if (data.status === 4) {
      await lowBattNotification(data.location);
    }
  });

  socket.value.on("reminder", async (data: ReminderData) => {
    switch (data.type) {
      case 1: {
        // Add new reminder
        const inputReminderTime = dayjs(data.reminder.time, "hh:mm:ss");
        const tmpReminder: GameReminder = { ...data.reminder, completion: -1 };
        const tmpReminderList: Reminder[] = reminders.value;
        for (let index = 0; index < tmpReminderList.length; index++) {
          if (index + 1 === tmpReminderList.length) {
            // we have come to the end of the array
            // append to the end
            tmpReminderList.push(data.reminder);
            break;
          }
          const currReminder = tmpReminderList[index];
          const nextReminder = tmpReminderList[index + 1];
          const currReminderTime = dayjs(currReminder.time, "hh:mm:ss");
          const nextReminderTime = dayjs(nextReminder.time, "hh:mm:ss");

          if (index === 0 && inputReminderTime.isBefore(currReminderTime)) {
            tmpReminderList.unshift(tmpReminder);
            break;
          }
          if (
            inputReminderTime.isAfter(currReminderTime) &&
            inputReminderTime.isAfter(nextReminderTime)
          ) {
            continue;
          } else if (
            inputReminderTime.isAfter(currReminderTime) &&
            inputReminderTime.isBefore(nextReminderTime)
          ) {
            tmpReminderList.splice(index, 0, tmpReminder);
            break;
          }
        }
        break;
      }
      case 2: {
        // Update a reminder
        const reminderIdx = reminders.value.findIndex((reminder) => {
          reminder.id === data.reminderId;
        });
        if (reminderIdx !== -1)
          reminders.value[reminderIdx] = { ...data.reminder, completion: 0 };
        break;
      }
      case 3: {
        // Delete a reminder
        const reminderIdx = reminders.value.findIndex((reminder) => {
          reminder.id === data.reminderId;
        });
        if (reminderIdx !== -1) reminders.value.splice(reminderIdx, 1);
        break;
      }
      case 4:
        await taskListNotification(reminders.value);
        break;

      default:
        console.warn(`Received: ${JSON.stringify(data)}`);
        break;
    }
    getImage();
  });
};

const getNextDaysReminders = () => {
  const currDateTime = dayjs();
  const nextDateTime = dayjs(currDateTime.format("DD/MM/YYYY"), "DD/MM/YYYY")
    .add(1, "minute")
    .add(1, "day");
  const timeDiff = Math.abs(currDateTime.diff(nextDateTime));

  useTimeoutFn(() => {
    populateReminders();
    getNextDaysReminders();
  }, timeDiff);
};

const selectCurrentTask = (task: GameReminder) => {
  if (taskPending.value) {
    //Stop the currently running task if we are selecting a new one
    taskStop.value();
  }
  currentTask.value = task;
  selectedBackground.value = backgroundShortUrl;
  const taskTime = dayjs(task.time, "HH:mm:ss");
  const timeVal = Math.abs(taskTime.diff(dayjs()));
  const { isPending, start, stop } = useTimeoutFn(() => {
    isTaskCompleted.value = false;
    broadcastTask(task);
  }, timeVal);
  taskPending.value = isPending.value;
  taskStart.value = start;
  taskStop.value = stop;
};

const broadcastTask = (task: GameReminder) => {
  const { stop } = useTimeoutFn(
    async () => {
      // minus health
      if (currentTask.value) {
        stopTaskInterval.value();
        const currentTaskIdx = reminders.value.findIndex((val) => {
          return val.id === currentTask.value?.id;
        });
        if (currentTaskIdx !== -1) {
          reminders.value[currentTaskIdx].completion = 0;
        }

        await taskNotification(
          2,
          currentTask.value.name,
          currentTask.value.location
        );

        if (socket.value) {
          socket.value.emit("task", {
            taskId: currentTask.value?.id,
            status: 2,
            location: currentTask.value?.location,
          });
        }
      }
      sadAudio.play();
      getImage();
    },
    currentTask.value ? currentTask.value.duration : 300000
  );

  const dmgPerTick = 80 / (task.duration / 10000);
  const { pause, isActive } = useIntervalFn(() => {
    takeDamage(dmgPerTick);
    getImage();
  }, 10000);
  stopTaskInterval.value = pause;
  isTaskIntervalActive.value = isActive.value;
  stopTask.value = stop;
};

const pet = async () => {
  getImage(3);
  await petAudio.play();
};

onBeforeMount(() => {
  initSocket();
  populateReminders();
  getNextDaysReminders();
});

onBeforeUnmount(() => {
  if (taskPending.value) {
    taskStop.value();
  }
});
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
        v-if="currentTask && isTaskCompleted === false"
      >
        <current-task :task="currentTask" />
      </div>

      <div
        :style="{ backgroundImage: `url(${selectedBackground})` }"
        class="bg-amber-100 h-2/5 w-full rounded-2xl shadow-amber-200 shadow-sm flex flex-col justify-center items-center"
      >
        <va-progress-bar
          class="m-2 px-2"
          color="success"
          :size="24"
          :model-value="health"
          content-inside
          show-percent
        />
        <va-image
          class="max-h-36 w-36"
          :src="recollieImage"
          :ratio="1"
          fit="contain"
        />
        <div
          class="flex justify-center items-center w-full"
          v-if="isTaskCompleted"
        >
          <va-button-group id="onscreen-btns" class="h-8">
            <va-button
              icon="waving_hand"
              color="white"
              @click="pet"
              :disabled="!isTaskCompleted"
            />

            <va-button
              icon="egg_alt"
              color="white"
              @click="eatTreat"
              :disabled="!isTaskCompleted || numTreats === 0"
            />
          </va-button-group>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
#onscreen-btns {
  @apply flex-none !important;
}
</style>
