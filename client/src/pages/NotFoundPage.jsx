import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-3xl font-bold text-white">404</h2>
      <p className="text-sm text-slate-300">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Back to Home
      </Link>
    </section>
  )
}

export default NotFoundPage
