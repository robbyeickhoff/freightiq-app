import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://finjqunyuyfxiesumuxk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VqMhpn0vzkrR4GnrzUnBQw_qRYZKqPq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
