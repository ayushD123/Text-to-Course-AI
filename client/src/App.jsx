import { Navigate, Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="rounded-xl border border-slate-800 bg-slate-900 px-10 py-8 text-center shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Welcome to</p>
        <h1 className="mt-3 text-4xl font-bold text-indigo-400">Text-to-Learn</h1>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
