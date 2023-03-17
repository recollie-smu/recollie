import type { Reminder } from "@/types/reminder";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ref, type Ref } from "vue";

const supabase: SupabaseClient = createClient(
  "https://mwfpdptcrkbvcslxkhup.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13ZnBkcHRjcmtidmNzbHhraHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY3ODcwNjkzMCwiZXhwIjoxOTk0MjgyOTMwfQ.BsX8cpCNSWzqlhJlHCm_Yhc9sG4oiM-oPW1Om_Wiqsg"
);

// const channel: Ref<RealtimeChannel | null> = ref(null);
// const users = ref(new Set<string>());

// const openOrCreateChannel = (channelName: string, username: string) => {
//   const currChannel = supabase.channel(channelName, {
//     config: {
//       presence: {
//         key: username,
//       },
//     },
//   });
//   channel.value = currChannel.subscribe(async (status) => {
//     if (status === "SUBSCRIBED") {
//       await currChannel.track({
//         online_at: new Date().toISOString(),
//       });
//     }
//   });
// };

const addReminder = async (reminder: Reminder) => {
  await supabase.from("reminders").insert(reminder);
};

export { supabase };
