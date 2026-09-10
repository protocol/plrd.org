import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Observatory from '@/components/lab/explorations/Observatory'
import { findFrontierQuestion, frontierQuestions } from '@/components/lab/explorations/lab-explorations'

type Props = { params: Promise<{ question: string }> }
export function generateStaticParams() { return frontierQuestions.map(item => ({ question: item.id })) }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const question = findFrontierQuestion((await params).question)
  return {
    title: question ? `${question.shortTitle} — Observatory` : 'Question not found',
    description: question?.question,
    robots: { index: false, follow: false },
  }
}
export default async function QuestionPage({ params }: Props) {
  const question = findFrontierQuestion((await params).question)
  if (!question) notFound()
  return <Observatory initialQuestion={question.id} />
}
