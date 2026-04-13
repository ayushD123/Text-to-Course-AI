import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import { deleteJson, getJson, postJson } from '../utils/apiClient'
import { buildLessonPath } from '../utils/routeHelpers'
import { getLatestCourse, removeLatestCourse, saveLatestCourse } from '../utils/storage'

function CoursePage() {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0()
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(() => {
    const cached = getLatestCourse()
    const hasFullCourseData = Array.isArray(cached?.modules)
    return cached?.id === courseId && hasFullCourseData ? cached : null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState('')

  const handleDeleteCourse = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this course? This action cannot be undone.')

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      setError('')

      let accessToken = ''
      if (isAuthenticated) {
        accessToken = await getAccessTokenSilently()
      }

      await deleteJson(`/courses/${courseId}`, { accessToken })
      removeLatestCourse()
      navigate('/?section=courses', { replace: true })
    } catch (requestError) {
      setError(requestError.message || 'Failed to delete course')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClaimCourse = async () => {
    try {
      setIsClaiming(true)
      setError('')

      const accessToken = await getAccessTokenSilently()
      const response = await postJson(`/courses/${courseId}/claim`, {}, { accessToken })

      setCourse((currentCourse) => ({
        ...(currentCourse || {}),
        ownerId: response.data.ownerId,
        isPrivate: response.data.isPrivate,
      }))
    } catch (requestError) {
      setError(requestError.message || 'Failed to save this course')
    } finally {
      setIsClaiming(false)
    }
  }

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setIsLoading(true)
        setError('')

        let accessToken = ''
        if (isAuthenticated) {
          try {
            accessToken = await getAccessTokenSilently()
          } catch {
            accessToken = ''
          }
        }

        const response = await getJson(`/courses/${courseId}`, { accessToken })
        setCourse(response.data)
        saveLatestCourse(response.data)
      } catch (requestError) {
        setError(requestError.message || 'Failed to load course')
      } finally {
        setIsLoading(false)
      }
    }

    loadCourse()
  }, [courseId, isAuthenticated, getAccessTokenSilently])

  if (isLoading) {
    return <LoadingSpinner label="Loading course..." />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (!course) {
    return <ErrorMessage message="Course not found." />
  }

  const courseTags = Array.isArray(course.tags) ? course.tags : []
  const courseModules = Array.isArray(course.modules) ? course.modules : []
  const authUserId = user?.sub || ''
  const isOwnedByLoggedInUser = Boolean(isAuthenticated && authUserId && course.ownerId === authUserId)
  const canClaimCourse = Boolean(isAuthenticated && !course.ownerId)

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          {canClaimCourse && (
            <button
              type="button"
              onClick={handleClaimCourse}
              disabled={isClaiming}
              className="inline-flex items-center rounded-lg border border-indigo-600 bg-indigo-900/40 px-3 py-2 text-sm text-indigo-100 hover:bg-indigo-800/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isClaiming ? 'Saving...' : 'Save to My Courses'}
            </button>
          )}

          {(isOwnedByLoggedInUser || !course.ownerId) && (
            <button
              type="button"
              onClick={handleDeleteCourse}
              disabled={isDeleting}
              className="inline-flex items-center rounded-lg border border-rose-700 bg-rose-900/40 px-3 py-2 text-sm text-rose-100 hover:bg-rose-800/50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete Course'}
            </button>
          )}
        </div>
      </div>

      <header className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-white">{course.title}</h2>
        <p className="text-sm text-slate-300">{course.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {courseTags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {courseModules.map((module) => (
          <article key={module.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
            <ul className="mt-3 space-y-2">
              {(Array.isArray(module.lessons) ? module.lessons : []).map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={buildLessonPath(lesson.id)}
                    className="block rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
                  >
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default CoursePage
