import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { CreateQuizForm } from '@/components/admin/create-quiz-form'
import { UserRole } from '@/types'

export default async function CreateQuizPage() {
  try {
    const session = await requireRole('ADMIN')
    return <CreateQuizForm userId={session.id} />
  } catch (error) {
    redirect('/admin')
  }
}
