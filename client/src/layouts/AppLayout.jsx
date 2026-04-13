import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

const navLinks = [{ label: 'Home', to: '/' }]

function AppLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  const handleCoursesClick = () => {
    navigate('/?section=courses')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <h1 className="text-base font-semibold text-indigo-400">Text-to-Learn</h1>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <p className="text-xs text-slate-400">Checking session...</p>
            ) : isAuthenticated ? (
              <>
                <p className="max-w-[160px] truncate text-xs text-slate-400">{user?.name || user?.email || 'Logged in'}</p>
                <button
                  type="button"
                  onClick={() =>
                    logout({
                      logoutParams: {
                        returnTo: window.location.origin,
                      },
                    })
                  }
                  className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => loginWithRedirect()}
                className="rounded-lg border border-indigo-600 px-2 py-1 text-xs text-indigo-300 hover:border-indigo-500"
              >
                Login
              </button>
            )}
          </div>
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

            <button
              type="button"
              onClick={handleCoursesClick}
              className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-left text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
            >
              Recent Courses
            </button>

            {isAuthenticated && (
              <Link
                to="/my-courses"
                className="whitespace-nowrap rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300"
              >
                My Courses
              </Link>
            )}
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
