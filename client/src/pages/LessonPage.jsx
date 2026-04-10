import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LessonRenderer from '../components/LessonRenderer'
import LoadingSpinner from '../components/LoadingSpinner'
import { getJson, postJson } from '../utils/apiClient'
import { getLessonCache, saveLessonCache } from '../utils/storage'

function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(() => getLessonCache(lessonId))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        setIsLoading(true)
        setError('')

        const currentLessonResponse = await getJson(`/lessons/${lessonId}`)
        const currentLesson = currentLessonResponse.data

        if (currentLesson.status === 'generated') {
          setLesson(currentLesson)
          saveLessonCache(lessonId, currentLesson)
          return
        }

        const generatedResponse = await postJson('/lessons/generate', {
          lessonId,
        })

        setLesson(generatedResponse.data)
        saveLessonCache(lessonId, generatedResponse.data)
      } catch (requestError) {
        setError(requestError.message || 'Failed to generate lesson content.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLesson()
  }, [lessonId])

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
      >
        ← Back
      </button>

      {isLoading && <LoadingSpinner label="Generating lesson content..." />}
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && lesson && <LessonRenderer lesson={lesson} />}
    </section>
  )
}

export default LessonPage
