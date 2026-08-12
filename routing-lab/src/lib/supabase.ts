import { createClient } from '@supabase/supabase-js'

import { getRoutingLabConfig } from './config'
import type { Database } from './database'

let routingLabClient: ReturnType<typeof createClient<Database>> | undefined

export function getSupabase() {
  if (!routingLabClient) {
    const config = getRoutingLabConfig()

    routingLabClient = createClient<Database>(
      config.supabaseUrl,
      config.supabasePublishableKey,
      {
        auth: {
          autoRefreshToken: true,
          detectSessionInUrl: true,
          persistSession: true,
        },
      },
    )
  }

  return routingLabClient
}
