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

export const taskNotification = async (type: number, chatId: number) => {
  // let telePayload = "";
  //      switch (taskPayload.status) {
  //          case 2:
  //              telePayload = `\u2757 Task ${taskPayload.taskId} (${taskPayload.location}) is overdue.`;
  //              break;
  //          case 3:
  //              telePayload = `\u2705 Task ${taskPayload.taskId} (${taskPayload.location}) is completed.`;
  //              break;
  //          default:
  //              return
  //      }
  //      axios.post(`https://api.telegram.org/bot${teleCreds.token}/sendMessage`,
  //      {
  //          'chat_id': teleCreds.chatId,
  //          'text': telePayload
  //      })
  //      .then(() => {
  //          console.log('Message sent');
  //      }).catch((error) => {
  //          console.log(error);
  //      });

}

export const taskListNotification = async (chatId: number) => {
  // let telePayload = "";

  //      axios.post(`https://api.telegram.org/bot${teleCreds.token}/sendMessage`,
  //      {
  //          'chat_id': teleCreds.chatId,
  //          'text': telePayload
  //      })
  //      .then(() => {
  //          console.log('Message sent');
  //      }).catch((error) => {
  //          console.log(error);
  //      });

}

export const lowBattNotification = async (chatId: number, location: number) => {
  // let telePayload = "";

  //      axios.post(`https://api.telegram.org/bot${teleCreds.token}/sendMessage`,
  //      {
  //          'chat_id': teleCreds.chatId,
  //          'text': telePayload
  //      })
  //      .then(() => {
  //          console.log('Message sent');
  //      }).catch((error) => {
  //          console.log(error);
  //      });

}
