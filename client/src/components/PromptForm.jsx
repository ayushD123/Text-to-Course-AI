function PromptForm() {
  return (
    <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
        What do you want to learn today?
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={5}
        placeholder="e.g. Explain JavaScript closures with beginner-friendly examples"
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-indigo-500 placeholder:text-slate-500 focus:ring"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Generate Course
      </button>
    </form>
  )
}

export default PromptForm
