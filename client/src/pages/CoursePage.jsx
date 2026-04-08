import { useParams } from 'react-router-dom'

import LoadingSpinner from '../components/LoadingSpinner'

function CoursePage() {
  const { courseId } = useParams()

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Course Page</h2>
      <p className="text-sm text-slate-300">Course ID: {courseId}</p>
      <p className="text-sm text-slate-400">This is a placeholder for the course overview and module list.</p>
      <LoadingSpinner label="Course content UI coming soon" />
    </section>
  )
}

export default CoursePage
