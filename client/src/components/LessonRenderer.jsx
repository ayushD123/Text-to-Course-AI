import { useEffect, useState } from 'react'

import { getJson } from '../utils/apiClient'

function HeadingBlock({ block }) {
  return <h3 className="text-xl font-semibold text-white">{block.text}</h3>
}

function ParagraphBlock({ block }) {
  return <p className="text-sm leading-6 text-slate-200 sm:text-base">{block.text}</p>
}

function CodeBlock({ block }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
      <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">{block.language || 'code'}</p>
      <pre className="overflow-x-auto text-xs text-slate-200 sm:text-sm">
        <code>{block.code}</code>
      </pre>
    </div>
  )
}

function VideoBlock({ block, lessonVideoQuery }) {
  const [videoResult, setVideoResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const query = (block.videoQuery || lessonVideoQuery || '').trim()

  useEffect(() => {
    const fetchVideo = async () => {
      if (!query) {
        setVideoResult(null)
        setError('')
        return
      }

      try {
        setIsLoading(true)
        setError('')

        const response = await getJson(`/videos/search?query=${encodeURIComponent(query)}`)
        const results = Array.isArray(response?.data?.results) ? response.data.results : []
        setVideoResult(results[0] || null)
      } catch (requestError) {
        setError(requestError.message || 'Failed to load video')
      } finally {
        setIsLoading(false)
      }
    }

    fetchVideo()
  }, [query])

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
      <p className="text-sm font-medium text-white">Video</p>
      <p className="mt-1 text-sm text-slate-300">{block.title || 'Suggested video resource'}</p>

      {isLoading && <p className="mt-3 text-xs text-slate-400">Loading video...</p>}

      {!isLoading && error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

      {!isLoading && !error && !videoResult && <p className="mt-3 text-xs text-slate-400">No video found for this lesson yet.</p>}

      {!isLoading && !error && videoResult && (
        <div className="mt-3 space-y-2">
          <div className="overflow-hidden rounded-lg border border-slate-800">
            <iframe
              title={videoResult.title}
              src={videoResult.embedUrl}
              className="h-56 w-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-sm text-slate-200">{videoResult.title}</p>
          {videoResult.channelTitle ? <p className="text-xs text-slate-400">Channel: {videoResult.channelTitle}</p> : null}
          <a className="inline-block text-xs text-indigo-300 underline" href={videoResult.watchUrl} target="_blank" rel="noreferrer">
            Open on YouTube
          </a>
        </div>
      )}
    </div>
  )
}

function QuizSection({ mcqs = [] }) {
  return (
    <section className="space-y-4">
      <h4 className="text-lg font-semibold text-white">Quiz</h4>
      {mcqs.map((mcq, index) => (
        <article key={mcq.question} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-medium text-slate-100">
            {index + 1}. {mcq.question}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
            {mcq.options.map((option) => (
              <li key={option}>{option}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-emerald-300">Answer: {mcq.answer}</p>
          <p className="text-xs text-slate-400">{mcq.explanation}</p>
        </article>
      ))}
    </section>
  )
}

function renderBlock(block, index, lessonVideoQuery) {
  const key = `${block.type}-${index}`

  if (block.type === 'heading') return <HeadingBlock key={key} block={block} />
  if (block.type === 'paragraph') return <ParagraphBlock key={key} block={block} />
  if (block.type === 'code') return <CodeBlock key={key} block={block} />
  if (block.type === 'video') return <VideoBlock key={key} block={block} lessonVideoQuery={lessonVideoQuery} />
  if (block.type === 'mcq') return null

  return null
}

function LessonRenderer({ lesson }) {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-bold text-white">{lesson.title}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {lesson.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
      </header>

      <section className="space-y-4">{lesson.content.map((block, index) => renderBlock(block, index, lesson.videoQuery))}</section>

      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h4 className="text-lg font-semibold text-white">Readings</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
          {lesson.readings.map((reading) => (
            <li key={reading}>{reading}</li>
          ))}
        </ul>
      </section>

      <QuizSection mcqs={lesson.mcqs} />
    </div>
  )
}

export default LessonRenderer
