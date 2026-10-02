import { z } from 'zod'
import { readItem, removeItem, writeItem } from '../../../lib/storage'
import type { Session } from '../types'

const sessionSchema = z.object({
  userId: z.uuid(),
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
})

export const sessionRepository = {
  get(): Session | null {
    return readItem('session', sessionSchema)
  },

  save(session: Session): void {
    writeItem('session', session)
  },

  clear(): void {
    removeItem('session')
  },
}
