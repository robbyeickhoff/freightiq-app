type RoutingLabConfig = {
  allowedEmail: string
  supabasePublishableKey: string
  supabaseUrl: string
}

function requireEnvironmentValue(name: string, value: string | undefined) {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`Missing required Routing Lab environment value: ${name}`)
  }

  return normalizedValue
}

export function getRoutingLabConfig(): RoutingLabConfig {
  return {
    allowedEmail: requireEnvironmentValue(
      'VITE_ROUTING_LAB_ALLOWED_EMAIL',
      import.meta.env.VITE_ROUTING_LAB_ALLOWED_EMAIL,
    ).toLowerCase(),
    supabasePublishableKey: requireEnvironmentValue(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    ),
    supabaseUrl: requireEnvironmentValue(
      'VITE_SUPABASE_URL',
      import.meta.env.VITE_SUPABASE_URL,
    ),
  }
}
