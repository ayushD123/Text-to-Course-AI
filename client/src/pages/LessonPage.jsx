import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LessonRenderer from '../components/LessonRenderer'
import LoadingSpinner from '../components/LoadingSpinner'
import { postJson } from '../utils/apiClient'
import { getLatestLesson, saveLatestLesson } from '../utils/storage'

function LessonPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(() => getLatestLesson())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const courseTitle = searchParams.get('courseTitle') || ''
  const moduleTitle = searchParams.get('moduleTitle') || ''
  const lessonTitle = searchParams.get('lessonTitle') || ''

  useEffect(() => {
    if (!courseTitle || !moduleTitle || !lessonTitle) {
      setError('Missing lesson context. Please open a lesson from the course page.')
      return
    }

    const fetchLesson = async () => {
      try {
        setIsLoading(true)
        setError('')

        const response = await postJson('/lessons/generate', {
          courseTitle,
          moduleTitle,
          lessonTitle,
        })

        setLesson(response.data)
        saveLatestLesson(response.data)
      } catch (requestError) {
        setError(requestError.message || 'Failed to generate lesson content.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLesson()
  }, [courseTitle, moduleTitle, lessonTitle])

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
      >
        ← Back
      </button>

      {isLoading && <LoadingSpinner label="Generating lesson from mock backend..." />}
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && lesson && <LessonRenderer lesson={lesson} />}
    </section>
  )
}

export default LessonPage
