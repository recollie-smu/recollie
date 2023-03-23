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
import { useTimeoutFn } from "@vueuse/core";
import { io, Socket } from "socket.io-client";
import type { DefaultEventsMap } from "@socket.io/component-emitter";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

import TaskList from "@/components/TaskList.vue";
import CurrentTask from "@/components/CurrentTask.vue";

dayjs.extend(CustomParseFormat);

const reminders: Ref<GameReminder[]> = ref([]);
const socket: Ref<Socket<DefaultEventsMap, DefaultEventsMap> | null> =
  ref(null);
const currentTask: Ref<GameReminder | null> = ref(null);
const taskStart = ref(() => {});
const taskStop = ref(() => {});
const taskPending = ref(false);
const isTaskCompleted = ref(true);
const stopTask = ref(() => {});

const consumeTreat = () => {
  let remainingTasks = 0;
  for (const reminder of reminders.value) {
    if (reminder.completion === -1) remainingTasks++;
  }
  const healthValue = (100 - health.value) / remainingTasks;

  eatTreat(healthValue);
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
    }, timeDiff);
  }
  return tmpReminders;
});

const initSocket = () => {
  socket.value = io("ws://localhost:8080/web-ui");

  socket.value.on("sensor", (data: SensorInput) => {
    if (data.inputType === 2) {
      consumeTreat();
    }
    getImage(data.inputType);
  });

  socket.value.on("task", (data: TaskData) => {
    if (data.status === 3) {
      if (data.taskId === currentTask.value?.id) {
        stopTask.value();
        for (const reminder of reminders.value) {
          if (reminder.id === data.taskId) {
            reminder.completion = 1;
            break;
          }
        }
        addTreat();
      }
    } else if (data.status === 4) {
      lowBattNotification(data.taskId, data.location);
    }
  });

  socket.value.on("reminder", (data: ReminderData) => {
    switch (data.type) {
      case 1: {
        // Add new reminder
        const inputReminderTime = dayjs(data.reminder.time, "hh:mm:ss");
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

          if (
            inputReminderTime.isAfter(currReminderTime) &&
            inputReminderTime.isAfter(nextReminderTime)
          ) {
            continue;
          } else if (
            inputReminderTime.isAfter(currReminderTime) &&
            inputReminderTime.isBefore(nextReminderTime)
          ) {
            tmpReminderList.splice(index, 0, data.reminder);
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
        taskListNotification(data.reminderId);
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
  const taskTime = dayjs(task.time, "hh:mm:ss");
  const timeVal = Math.abs(taskTime.diff(dayjs()));
  const { isPending, start, stop } = useTimeoutFn(() => {
    isTaskCompleted.value = false;
    broadcastTask();
  }, timeVal);
  taskPending.value = isPending.value;
  taskStart.value = start;
  taskStop.value = stop;
};

const broadcastTask = () => {
  const { start, stop } = useTimeoutFn(
    () => {
      // minus health
      const dmgAmount = health.value / reminders.value.length;
      if (currentTask.value) {
        const currentTaskIdx = reminders.value.findIndex((val) => {
          return val.id === currentTask.value?.id;
        });
        if (currentTaskIdx !== -1) {
          reminders.value[currentTaskIdx].completion = 0;
        }
      }
      takeDamage(dmgAmount);
      getImage();
      isTaskCompleted.value = true;
    },
    currentTask.value ? currentTask.value.duration : 300000
  );
  start();
  stopTask.value = stop;
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
        class="bg-amber-100 h-2/5 w-full rounded-2xl shadow-amber-200 shadow-sm flex flex-col justify-center items-center"
      >
        <va-image
          class="max-h-36 w-36"
          :src="recollieImage"
          :ratio="1"
          fit="contain"
        />
        <div class="flex justify-center items-center w-full">
          <va-button-group id="onscreen-btns" class="h-8">
            <va-button
              icon="waving_hand"
              color="white"
              @click="getImage(2)"
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
