import { useEffect, useState } from 'react'

const PROMPT_HINT_MESSAGES = [
  "Explain JavaScript closures with beginner-friendly examples",
  "Teach Python loops with simple real-world exercises",
  "Explain SQL joins like I’m a complete beginner",
  "Help me understand APIs with practical examples",
  "Explain recursion without making my brain crash",
  "Teach Git and GitHub step by step",
  "Where did my cat go? Explain object detection with simple examples",
  "Why does my code break only during demos?",
  "Explain async and await like I’m waiting for noodles to cook",
  "Teach me CSS because my website looks like it’s from the 90s",
  "Teach me how to build a REST API with Node.js and Express",
  "Teach me CSS Styling because my buttons look like rectangles from the Stone Age",
  "Teach me how to build a REST API with Node.js and Express because I want to be a backend wizard",
  "Explain React hooks in simple terms because I keep getting lost in useEffect",

  "Why does my Wi-Fi disappear when the meeting starts?",
  "Explain machine learning in plain English",
  "How does Google Maps know I ignored the turn again?",
  "Teach Docker with beginner-friendly examples",
  "Why is centering a div harder than life decisions?",
  "Explain database indexing with simple analogies",
  "How does Netflix know I’ll watch one more episode?",
  "Teach me debugging like I’m a detective",
  "Why does the bug vanish when the senior developer arrives?",
  "Explain cloud computing like I’m renting a supercomputer"
]

function PromptForm({ onSubmit, isLoading = false }) {
  const [placeholderHint, setPlaceholderHint] = useState(PROMPT_HINT_MESSAGES[0])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setPlaceholderHint((currentHint) => {
        const currentIndex = PROMPT_HINT_MESSAGES.indexOf(currentHint)
        const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex
        const nextIndex = (safeCurrentIndex + 1) % PROMPT_HINT_MESSAGES.length

        return PROMPT_HINT_MESSAGES[nextIndex]
      })
    }, 2200)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

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
        placeholder={placeholderHint}
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
