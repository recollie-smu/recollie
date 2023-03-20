import type { Reminder } from "@/types/reminder";
import ky from "ky";

export const getReminders = async () => {
  try {
    const res: Reminder[] = await ky
      .get("http://localhost:8080/api/reminders")
      .json();
    return res;
  } catch (error) {
    console.log(error);
  }
  return [];
};
