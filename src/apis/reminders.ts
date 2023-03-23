import type { GameReminder, Reminder } from "@/types/reminder";
import ky from "ky";

const telegramToken = import.meta.env.VITE_TELEGRAM_TOKEN;
const telegramChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

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
      telePayload = `\u2757 Task ${taskName} (${taskLocation}) is overdue.`;
      break;
    case 3:
      telePayload = `\u2705 Task ${taskName} (${taskLocation}) is completed.`;
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

export const taskListNotification = async (
  chatId: number,
  reminders: GameReminder[]
) => {
  let telePayload = "";
  for (const gameReminder of reminders) {
    switch (gameReminder.completion) {
      case -1:
        telePayload += `\u2b50 Task ${gameReminder.name} has not begun \n`;
        break;
      case 0:
        telePayload += `\u274c Task ${gameReminder.name} is overdue \n`;
        break;
      case 1:
        telePayload += `\u2714 Task ${gameReminder.name} is completed \n`;
        break;
      case 2:
        telePayload += `\u2755 Task ${gameReminder.name} is in progress \n`;
        break;

      default:
        break;
    }
    telePayload += ``;
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

export const lowBattNotification = async (location: number) => {
  const telePayload = `Device at location ${location} has low battery! Please replace it soon!`;
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
