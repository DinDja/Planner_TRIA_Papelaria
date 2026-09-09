const LEGACY_LOCAL_PREFIX = 'plannerhub-'
const CURRENT_LOCAL_PREFIX = 'tria-papelaria-'
const LEGACY_SESSION_PREFIX = 'plannerhub:seeded:'
const CURRENT_SESSION_PREFIX = 'tria-papelaria:seeded:'

/**
 * Renames browser persistence keys from the previous product name while
 * preserving the serialized Zustand state already saved by the user.
 */
export function migrateLegacyStorage() {
  if (typeof window === 'undefined') return

  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index)
      if (!key?.startsWith(LEGACY_LOCAL_PREFIX)) continue

      const nextKey = CURRENT_LOCAL_PREFIX + key.slice(LEGACY_LOCAL_PREFIX.length)
      if (localStorage.getItem(nextKey) === null) {
        const value = localStorage.getItem(key)
        if (value !== null) localStorage.setItem(nextKey, value)
      }
      localStorage.removeItem(key)
    }
  } catch {}

  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (!key?.startsWith(LEGACY_SESSION_PREFIX)) continue

      const nextKey = CURRENT_SESSION_PREFIX + key.slice(LEGACY_SESSION_PREFIX.length)
      if (sessionStorage.getItem(nextKey) === null) {
        const value = sessionStorage.getItem(key)
        if (value !== null) sessionStorage.setItem(nextKey, value)
      }
      sessionStorage.removeItem(key)
    }
  } catch {}
}
