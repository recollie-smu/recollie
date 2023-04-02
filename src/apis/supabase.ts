import type { Reminder } from "@/types/reminder";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ref, type Ref } from "vue";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabaseTable = import.meta.env.VITE_SUPABASE_TABLE;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

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

// const addReminder = async (reminder: Reminder) => {
//   await supabase.from(supabaseTable).insert(reminder);
// };

export { supabase };
