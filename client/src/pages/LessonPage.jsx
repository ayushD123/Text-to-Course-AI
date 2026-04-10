import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LessonRenderer from '../components/LessonRenderer'
import LoadingSpinner from '../components/LoadingSpinner'
import { getJson, postJson } from '../utils/apiClient'
import { getLessonCache, saveLessonCache } from '../utils/storage'

const LESSON_LOADING_MESSAGES = [
  'Generating lesson content...',
  'Sharpening key concepts for this lesson...',
  'Drafting objectives your future self will thank you for...',
  'Structuring examples and explanations with care...',
  'Assembling practice questions for your quiz...',
  'Polishing this lesson to be clear and beginner-friendly...',
  'Convincing the backend to become a professor...',
  'Generating knowledge packets at mildly dramatic speed...',
  'Assembling modules, objectives, and a tiny bit of magic...',
  'Teaching the AI to teach, one section at a time...',
  'Building your course like a LEGO set for learning...',
  'Organizing chaos into a respectable curriculum...',
  'Please wait while we pretend this was instant...',
  'Giving your topic the full professor treatment...',
  'Fine-tuning the curriculum to perfection...',
  'Preparing your course for academic excellence...',
  'Drafting lessons faster than a last-minute student panic...',
  'Training tiny invisible professors behind the screen...',
]

const getNextRandomIndex = (currentIndex, total) => {
  if (total <= 1) return 0

  let nextIndex = currentIndex
  while (nextIndex === currentIndex) {
    nextIndex = Math.floor(Math.random() * total)
  }

  return nextIndex
}

function LessonPage() {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(() => getLessonCache(lessonId))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lessonLoadingMessage, setLessonLoadingMessage] = useState(LESSON_LOADING_MESSAGES[0])

  useEffect(() => {
    if (!isLoading) {
      setLessonLoadingMessage(LESSON_LOADING_MESSAGES[0])
      return
    }

    const intervalId = setInterval(() => {
      setLessonLoadingMessage((currentMessage) => {
        const currentIndex = LESSON_LOADING_MESSAGES.indexOf(currentMessage)
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex
        const nextIndex = getNextRandomIndex(safeCurrentIndex, LESSON_LOADING_MESSAGES.length)
        return LESSON_LOADING_MESSAGES[nextIndex]
      })
    }, 1700)

    return () => {
      clearInterval(intervalId)
    }
  }, [isLoading])

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

      {isLoading && <LoadingSpinner label={lessonLoadingMessage} />}
      {error && <ErrorMessage message={error} />}
      {!isLoading && !error && lesson && <LessonRenderer lesson={lesson} />}
    </section>
  )
}

export default LessonPage
