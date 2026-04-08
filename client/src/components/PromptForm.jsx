function PromptForm({ onSubmit, isLoading = false }) {
  const handleSubmit = (event) => {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const topic = String(formData.get('prompt') || '').trim()

    onSubmit?.(topic)
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
        What do you want to learn today?
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={5}
        placeholder="e.g. Explain JavaScript closures with beginner-friendly examples"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500 placeholder:text-slate-500 focus:ring"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isLoading}
      >
        {isLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-white" />}
        <span>{isLoading ? 'Generating...' : 'Generate Course'}</span>
      </button>
    </form>
  )
}

export default PromptForm
