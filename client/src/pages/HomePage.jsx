import { Link } from 'react-router-dom'

import PromptForm from '../components/PromptForm'
import { buildCoursePath } from '../utils/routeHelpers'

const placeholderCourses = [
  { id: 'javascript-basics', title: 'JavaScript Basics' },
  { id: 'react-intro', title: 'React Introduction' },
]

function HomePage() {
  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">Create your next learning path</h2>
        <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
          Describe what you want to learn and generate a structured course outline.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <PromptForm />
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white">Recent / Generated Courses</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
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
