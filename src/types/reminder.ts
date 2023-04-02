export type Reminder = {
  /** The unique identifier for the reminder. Supabase generated. */
  id: number;
  /** The name of the reminder. */
  name: string;
  /** The status of the reminder. 0: Disabled, 1: Enabled */
  status: number;
  /** The description of the reminder. */
  description: string;
  /** The location of the reminder. */
  location: number;
  /** The duration of the reminder. */
  duration: number;
  /** The time of day for the reminder in the format "hh:mm:ss". */
  time: string;
  /** The date of the reminder in the format "YYYY-MM-DD". */
  date: string;
  /** Whether the reminder is set to repeat on Monday. */
  monday: boolean;
  /** Whether the reminder is set to repeat on Tuesday. */
  tuesday: boolean;
  /** Whether the reminder is set to repeat on Wednesday. */
  wednesday: boolean;
  /** Whether the reminder is set to repeat on Thursday. */
  thursday: boolean;
  /** Whether the reminder is set to repeat on Friday. */
  friday: boolean;
  /** Whether the reminder is set to repeat on Saturday. */
  saturday: boolean;
  /** Whether the reminder is set to repeat on Sunday. */
  sunday: boolean;
  /** The Supabase Storage path of the image associated with the reminder, if any. */
  image: string | null;
  /** The Supabase Storage path of the memo associated with the reminder, if any. */
  memo: string | null;
  /** The date and time when the reminder was created. */
  date_created: Date;
  /** The date and time when the reminder was last updated */
  date_updated: Date | null;
};

export type GameReminder = {
  /** The completion of the reminder. -1: new, 0: overdue, 1: completed, 2: In Progress */
  completion: number;
} & Reminder;

export type ReminderData = {
  updateId: string;
  reminderId: number;
  type: number;
  reminder: Reminder;
};
