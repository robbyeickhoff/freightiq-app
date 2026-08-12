import type { SupportedStorage } from '@supabase/supabase-js'

const cookieMaxAgeSeconds = 60 * 60 * 24 * 30

function cookieName(key: string) {
  return `routing-lab-${key}`
}

function readCookie(key: string) {
  const prefix = `${encodeURIComponent(cookieName(key))}=`
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

function writeCookie(key: string, value: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''

  document.cookie = `${encodeURIComponent(cookieName(key))}=${encodeURIComponent(
    value,
  )}; Path=/; Max-Age=${cookieMaxAgeSeconds}; SameSite=Lax${secure}`
}

function removeCookie(key: string) {
  document.cookie = `${encodeURIComponent(
    cookieName(key),
  )}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function createRoutingLabAuthStorage(): SupportedStorage {
  return {
    getItem(key) {
      return window.localStorage.getItem(key) ?? readCookie(key)
    },
    removeItem(key) {
      window.localStorage.removeItem(key)
      removeCookie(key)
    },
    setItem(key, value) {
      window.localStorage.setItem(key, value)
      writeCookie(key, value)
    },
  }
}
