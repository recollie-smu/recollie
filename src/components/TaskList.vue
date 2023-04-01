<script setup lang="ts">
import type { Reminder } from "@/types/reminder";
import { VaList } from "vuestic-ui/web-components";
import dayjs from "dayjs";
import CustomParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(CustomParseFormat);

const props = defineProps<{ reminders: Reminder[] }>();
</script>
<template>
  <va-list class="h-full">
    <va-list-label
      class="font-medium text-left rounded-t-xl mb-4 inline-flex items-center gap-2"
    >
      <va-icon name="event" color="black" />
      <p class="text-neutral-10 text-lg">Upcoming</p>
    </va-list-label>

    <va-list-item
      v-for="(reminder, index) in props.reminders"
      :key="index"
      class="h-1/2"
    >
      <div class="h-full w-full flex flex-col">
        <p class="text-primary-50 text-xl">
          {{ dayjs(reminder.time, "hh:mm:ss").format("hh:mm A") }}
        </p>
        <p class="text-black text-2xl font-medium">
          {{ reminder.name }}
        </p>
        <hr class="w-full" />
      </div>
    </va-list-item>
  </va-list>
</template>

<style scoped></style>
