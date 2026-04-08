import { Link, Outlet } from 'react-router-dom'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Course Demo', to: '/courses/sample-course' },
  { label: 'Lesson Demo', to: '/lessons/sample-lesson' },
]

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-base font-semibold text-indigo-400">Text-to-Learn</h1>
          <p className="text-xs text-slate-400">Frontend Shell</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-slate-800 bg-slate-900 md:min-h-[calc(100vh-56px)] md:border-b-0 md:border-r">
          <nav className="flex gap-2 overflow-x-auto p-3 md:flex-col md:overflow-visible md:p-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
