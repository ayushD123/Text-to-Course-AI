import { useParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'

function LessonPage() {
  const { lessonId } = useParams()

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Lesson Page</h2>
      <p className="text-sm text-slate-300">Lesson ID: {lessonId}</p>
      <p className="text-sm text-slate-400">This is a placeholder for lesson content and navigation.</p>
      <ErrorMessage message="Lesson UI placeholder only. No backend integration yet." />
    </section>
  )
}

export default LessonPage
