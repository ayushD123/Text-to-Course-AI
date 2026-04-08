import { Link, useNavigate, useParams } from 'react-router-dom'

import ErrorMessage from '../components/ErrorMessage'
import { buildLessonPath, toSlug } from '../utils/routeHelpers'
import { getLatestOutline } from '../utils/storage'

function CoursePage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const latestOutline = getLatestOutline()

  if (!latestOutline?.outline) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Course not found</h2>
        <ErrorMessage message="No generated outline found yet. Please generate a course from Home first." />
      </section>
    )
  }

  if (latestOutline.courseId !== courseId) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Course not available</h2>
        <ErrorMessage message="This temporary scaffold stores only the latest generated outline." />
        <p className="text-sm text-slate-300">Open the latest course from Home to continue.</p>
      </section>
    )
  }

  const { outline } = latestOutline

  return (
    <section className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
      >
        ← Back
      </button>

      <header className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-white">{outline.title}</h2>
        <p className="text-sm text-slate-300">{outline.description}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {outline.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
              #{tag}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {outline.modules.map((module) => (
          <article key={module.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
            <h3 className="text-lg font-semibold text-white">{module.title}</h3>
            <ul className="mt-3 space-y-2">
              {module.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <Link
                    to={buildLessonPath(toSlug(lesson.title), {
                      courseTitle: outline.title,
                      moduleTitle: module.title,
                      lessonTitle: lesson.title,
                    })}
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
