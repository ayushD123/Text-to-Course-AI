import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
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
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(() => getLessonCache(lessonId))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [explanationMode, setExplanationMode] = useState('english')
  const [isHinglishLoading, setIsHinglishLoading] = useState(false)
  const [hinglishError, setHinglishError] = useState('')
  const [lessonLoadingMessage, setLessonLoadingMessage] = useState(LESSON_LOADING_MESSAGES[0])

  const getAccessToken = async () => {
    if (!isAuthenticated) return ''

    try {
      return await getAccessTokenSilently()
    } catch {
      return ''
    }
  }

  const getEnglishExplanation = (lessonPayload) => {
    if (!lessonPayload || !Array.isArray(lessonPayload.content)) return ''

    const paragraphText = lessonPayload.content
      .filter((block) => block?.type === 'paragraph' && typeof block?.text === 'string')
      .map((block) => block.text.trim())
      .filter(Boolean)

    if (paragraphText.length > 0) {
      return paragraphText.join(' ')
    }

    const headingText = lessonPayload.content
      .filter((block) => block?.type === 'heading' && typeof block?.text === 'string')
      .map((block) => block.text.trim())
      .filter(Boolean)

    return headingText.join(' ')
  }

  const handleSwitchToEnglish = () => {
    setExplanationMode('english')
    setHinglishError('')
  }

  const handleSwitchToHinglish = async () => {
    setExplanationMode('hinglish')
    setHinglishError('')

    if (!lesson || (lesson.hinglishExplanation || '').trim()) {
      return
    }

    try {
      setIsHinglishLoading(true)
      const accessToken = await getAccessToken()
      const response = await postJson(`/lessons/${lessonId}/hinglish`, {}, { accessToken })
      setLesson(response.data)
      saveLessonCache(lessonId, response.data)
    } catch (requestError) {
      setHinglishError(requestError.message || 'Failed to load Hinglish explanation.')
    } finally {
      setIsHinglishLoading(false)
    }
  }

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
    setExplanationMode('english')
    setHinglishError('')

    const fetchLesson = async () => {
      try {
        setIsLoading(true)
        setError('')

        const accessToken = await getAccessToken()

        const currentLessonResponse = await getJson(`/lessons/${lessonId}`, { accessToken })
        const currentLesson = currentLessonResponse.data

        if (currentLesson.status === 'generated') {
          setLesson(currentLesson)
          saveLessonCache(lessonId, currentLesson)
          return
        }

        const generatedResponse = await postJson('/lessons/generate', {
          lessonId,
        }, { accessToken })

        setLesson(generatedResponse.data)
        saveLessonCache(lessonId, generatedResponse.data)
      } catch (requestError) {
        setError(requestError.message || 'Failed to generate lesson content.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLesson()
  }, [lessonId, isAuthenticated, getAccessTokenSilently])

  const englishExplanation = getEnglishExplanation(lesson)
  const hinglishExplanation = (lesson?.hinglishExplanation || '').trim()

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
      {!isLoading && !error && lesson && (
        <div className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Lesson Explanation</h3>
              <div className="inline-flex rounded-lg border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={handleSwitchToEnglish}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    explanationMode === 'english' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToHinglish}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    explanationMode === 'hinglish' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Hinglish
                </button>
              </div>
            </div>

            {explanationMode === 'english' && (
              <p className="text-sm leading-6 text-slate-200">{englishExplanation || 'English explanation is not available yet.'}</p>
            )}

            {explanationMode === 'hinglish' && isHinglishLoading && <p className="text-sm text-slate-300">Generating Hinglish explanation...</p>}

            {explanationMode === 'hinglish' && !isHinglishLoading && hinglishError && <ErrorMessage message={hinglishError} />}

            {explanationMode === 'hinglish' && !isHinglishLoading && !hinglishError && (
              <p className="text-sm leading-6 text-slate-200">{hinglishExplanation || 'Hinglish explanation is not available yet.'}</p>
            )}
          </section>

          <LessonRenderer lesson={lesson} />
        </div>
      )}
    </section>
  )
}

export default LessonPage
