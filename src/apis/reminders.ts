import type { GameReminder, Reminder } from "@/types/reminder";
import ky from "ky";

const telegramToken = import.meta.env.VITE_TELEGRAM_TOKEN;
const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
const taskLocations = ["Bathroom", "Bedroom", "Kitchen", "Living Room"];

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

export const taskNotification = async (
  type: number,
  taskName: string,
  taskLocation: number
) => {
  let telePayload = "";
  switch (type) {
    case 2:
      telePayload = `\u2757 Task ${taskName} (${taskLocations[taskLocation]}) is overdue.`;
      break;
    case 3:
      telePayload = `\u2705 Task ${taskName} (${taskLocations[taskLocation]}) is completed.`;
      break;
    default:
      return;
  }
  ky.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    json: {
      chat_id: telegramChatId,
      text: telePayload,
    },
  })
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error);
    });
};

export const taskListNotification = async (reminders: GameReminder[]) => {
  let telePayload = "";
  let overdueCounter = 0;
  let completedCounter = 0;

  for (const gameReminder of reminders) {
    switch (gameReminder.completion) {
      case -1:
        telePayload += `\u2b50 Task ${gameReminder.name} has not begun \n`;
        break;
      case 0:
        overdueCounter++;
        telePayload += `\u274c Task ${gameReminder.name} is overdue \n`;
        break;
      case 1:
        completedCounter++;
        telePayload += `\u2714 Task ${gameReminder.name} is completed \n`;
        break;
      case 2:
        telePayload += `\u2755 Task ${gameReminder.name} is in progress \n`;
        break;

      default:
        break;
    }
  }

  let finalPayload = `${completedCounter}/${reminders.length} task(s) completed \u2714 \n There are ${overdueCounter} task(s) overdue! \u274c \n`;
  finalPayload += "\n\n===========================\n\n";
  finalPayload += telePayload;
  ky.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    json: {
      chat_id: telegramChatId,
      text: finalPayload,
    },
  })
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error);
    });
};

export const lowBattNotification = async (location: number) => {
  const telePayload = `Device at location ${taskLocations[location]} has low battery! Please replace it soon!`;
  ky.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    json: {
      chat_id: telegramChatId,
      text: telePayload,
    },
  })
    .then(() => {
      console.log("Message sent");
    })
    .catch((error) => {
      console.log(error);
    });
};
