import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser?.email) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { subscribers: true } },
    },
  })

  if (!user) redirect('/login')

  return (
    <DashboardClient
      user={{
        id: user.id,
        displayName: user.displayName,
        username: user.username,
        role: user.role,
        subscriberCount: user._count.subscribers,
        posts: user.posts.map((p: typeof user.posts[number]) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          isLocked: p.isLocked,
          price: p.price ? Number(p.price) : null,
          likesCount: p.likesCount,
          createdAt: p.createdAt.toISOString(),
        })),
      }}
    />
  )
}
