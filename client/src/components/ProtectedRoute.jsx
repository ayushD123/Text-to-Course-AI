import { useAuth0 } from '@auth0/auth0-react'

import LoadingSpinner from './LoadingSpinner'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner label="Checking your session..." />
  }

  if (!isAuthenticated) {
    return (
      <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-white">Login required</h2>
        <p className="text-sm text-slate-300">Please login to access this page.</p>
        <button
          type="button"
          onClick={() => loginWithRedirect()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Login with Auth0
        </button>
      </section>
    )
  }

  return children
}

export default ProtectedRoute
