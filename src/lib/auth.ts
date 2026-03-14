import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Returns the Supabase auth user for the current request.
 * React cache() deduplicates this across layout + all child pages
 * in the same render pass — only one network call to Supabase per request.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Returns the Prisma DB user for the current request.
 * Deduped with React cache() — only one DB query per request even if
 * layout AND the page both call this.
 */
export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser()
  if (!authUser?.email) return null
  return prisma.user.findUnique({ where: { email: authUser.email } })
})
