import { createClient } from '@supabase/supabase-js'

import { getRoutingLabConfig } from './config'

let routingLabClient: ReturnType<typeof createClient> | undefined

export function getSupabase() {
  if (!routingLabClient) {
    const config = getRoutingLabConfig()

    routingLabClient = createClient(
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
