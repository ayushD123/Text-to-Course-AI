import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import LoadingSpinner from '../components/LoadingSpinner'
import PromptForm from '../components/PromptForm'
import { postJson } from '../utils/apiClient'
import { buildCoursePath, toSlug } from '../utils/routeHelpers'
import { getLatestOutline, saveLatestOutline } from '../utils/storage'

const placeholderCourses = [
  { id: 'javascript-basics', title: 'JavaScript Basics' },
  { id: 'react-intro', title: 'React Introduction' },
]

function HomePage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const latestOutline = useMemo(() => getLatestOutline(), [])

  const handleGenerate = async (topic) => {
    if (!topic) {
      setError('Please enter a topic before generating a course outline.')
      return
    }

    try {
      setIsLoading(true)
      setError('')

      const response = await postJson('/courses/generate-outline', { topic })
      const outline = response.data
      const courseId = toSlug(outline.title || topic)

      saveLatestOutline({
        courseId,
        topic,
        outline,
        generatedAt: new Date().toISOString(),
      })

      navigate(buildCoursePath(courseId))
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
          Describe what you want to learn and generate a structured course outline.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <PromptForm onSubmit={handleGenerate} isLoading={isLoading} />
        {isLoading && (
          <div className="mt-4">
            <LoadingSpinner label="Generating outline from mock backend..." />
          </div>
        )}
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Recent / Generated Courses</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {latestOutline?.outline?.title && (
            <Link
              to={buildCoursePath(latestOutline.courseId)}
              className="rounded-lg border border-indigo-600 bg-slate-950 px-4 py-3 text-sm text-indigo-300 hover:border-indigo-500"
            >
              Latest: {latestOutline.outline.title}
            </Link>
          )}
          {placeholderCourses.map((course) => (
            <Link
              key={course.id}
              to={buildCoursePath(course.id)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
            >
              {course.title}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomePage
