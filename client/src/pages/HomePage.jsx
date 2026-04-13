import { useEffect, useRef, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import PromptForm from '../components/PromptForm'
import { getJson, postJson } from '../utils/apiClient'
import { buildCoursePath } from '../utils/routeHelpers'
import { getLatestCourse, removeLatestCourse, saveLatestCourse } from '../utils/storage'

const OUTLINE_LOADING_MESSAGES = [
  'Cooking up a course so good, even the syllabus is excited...',
  'Summoning lesson plans from the academic void...',
  'Turning your idea into chapters, coffee not included...',
  'Polishing the outline until it looks suspiciously intelligent...',
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

function HomePage() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const savedCoursesRef = useRef(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCoursesLoading, setIsCoursesLoading] = useState(true)
  const [error, setError] = useState('')
  const [coursesError, setCoursesError] = useState('')
  const [uiNotice, setUiNotice] = useState('')
  const [courses, setCourses] = useState([])
  const [latestCourse, setLatestCourse] = useState(() => getLatestCourse())
  const [outlineLoadingMessage, setOutlineLoadingMessage] = useState(OUTLINE_LOADING_MESSAGES[0])

  const section = searchParams.get('section')
  const visibleCourses = courses.filter((course) => course.id !== latestCourse?.id)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsCoursesLoading(true)
        setCoursesError('')

        if (!isAuthenticated) {
          setCourses([])
          setLatestCourse(null)
          removeLatestCourse()
          return
        }

        let accessToken = ''
        try {
          accessToken = await getAccessTokenSilently()
        } catch {
          accessToken = ''
        }

        const response = await getJson('/courses', { accessToken })
        const loadedCourses = response.data || []

        setCourses(loadedCourses)
        setLatestCourse((currentLatestCourse) => {
          if (currentLatestCourse && loadedCourses.some((course) => course.id === currentLatestCourse.id)) {
            return currentLatestCourse
          }

          const nextLatestCourse = loadedCourses[0] || null

          if (nextLatestCourse) {
            saveLatestCourse(nextLatestCourse)
          } else {
            removeLatestCourse()
          }

          return nextLatestCourse
        })
      } catch (requestError) {
        setCoursesError(requestError.message || 'Failed to load courses')
      } finally {
        setIsCoursesLoading(false)
      }
    }

    loadCourses()
  }, [isAuthenticated, getAccessTokenSilently])

  useEffect(() => {
    if (section !== 'courses' || isCoursesLoading) {
      return
    }

    if (courses.length === 0) {
      setUiNotice('No course generated so far.')
    } else {
      savedCoursesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setUiNotice('')
    }

    const params = new URLSearchParams(searchParams)
    params.delete('section')
    setSearchParams(params, { replace: true })
  }, [section, isCoursesLoading, courses.length, searchParams, setSearchParams])

  useEffect(() => {
    if (!isLoading) {
      setOutlineLoadingMessage(OUTLINE_LOADING_MESSAGES[0])
      return
    }

    const intervalId = setInterval(() => {
      setOutlineLoadingMessage((currentMessage) => {
        const currentIndex = OUTLINE_LOADING_MESSAGES.indexOf(currentMessage)
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex
        const nextIndex = getNextRandomIndex(safeCurrentIndex, OUTLINE_LOADING_MESSAGES.length)
        return OUTLINE_LOADING_MESSAGES[nextIndex]
      })
    }, 1700)

    return () => {
      clearInterval(intervalId)
    }
  }, [isLoading])

  const handleGenerate = async (topic) => {
    if (!topic) {
      setError('Please enter a topic before generating a personalised course .')
      return
    }

    if (!isAuthenticated) {
      setError('Please login to generate and save your courses.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      let accessToken = ''
      try {
        accessToken = await getAccessTokenSilently()
      } catch {
        accessToken = ''
      }

      const response = await postJson('/courses/generate-outline', { topic }, { accessToken })
      const course = response.data

      saveLatestCourse(course)
      setLatestCourse(course)
      setCourses((prev) => {
        const deduped = prev.filter((item) => item.id !== course.id)
        return [course, ...deduped]
      })

      navigate(buildCoursePath(course.id))
    } catch (requestError) {
      setError(requestError.message || 'Failed to generate outline. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Create your next learning path</h2>
        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
          Describe what you want to learn and we will generate a structured course for you.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <PromptForm onSubmit={handleGenerate} isLoading={isLoading} />
        {isLoading && (
          <div className="mt-4">
            <LoadingSpinner label={outlineLoadingMessage} />
          </div>
        )}
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </div>

      {uiNotice && (
        <div className="rounded-xl border border-amber-600/60 bg-amber-950/30 p-3 text-sm text-amber-200">{uiNotice}</div>
      )}

      <div ref={savedCoursesRef} className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Recent Courses</h3>
        {!isAuthenticated && !isCoursesLoading && (
          <p className="mt-3 text-sm text-slate-400">Login to save your courses.</p>
        )}
        {isCoursesLoading && (
          <div className="mt-3">
            <LoadingSpinner label="Loading saved courses..." />
          </div>
        )}
        {coursesError && (
          <div className="mt-3">
            <ErrorMessage message={coursesError} />
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {latestCourse?.title && (
            <Link
              to={buildCoursePath(latestCourse.id)}
              className="rounded-lg border border-indigo-600 bg-slate-950 px-4 py-3 text-sm text-indigo-300 hover:border-indigo-500"
            >
              Latest: {latestCourse.title}
            </Link>
          )}
          {visibleCourses.map((course) => (
            <Link
              key={course.id}
              to={buildCoursePath(course.id)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
            >
              {course.title}
            </Link>
          ))}
          {isAuthenticated && !isCoursesLoading && !coursesError && visibleCourses.length === 0 && !latestCourse?.title && (
            <p className="text-sm text-slate-400">No saved courses yet. Generate your first one above.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default HomePage
