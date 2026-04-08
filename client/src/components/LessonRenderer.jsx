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

function VideoBlock({ block }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
      <p className="text-sm font-medium text-white">Video Placeholder</p>
      <p className="mt-1 text-sm text-slate-300">{block.title || 'Suggested video resource'}</p>
      <a className="mt-2 inline-block text-xs text-indigo-300 underline" href={block.url} target="_blank" rel="noreferrer">
        Open video link
      </a>
    </div>
  )
}

function McqHintBlock({ block }) {
  return <p className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300">{block.text}</p>
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

function renderBlock(block, index) {
  const key = `${block.type}-${index}`

  if (block.type === 'heading') return <HeadingBlock key={key} block={block} />
  if (block.type === 'paragraph') return <ParagraphBlock key={key} block={block} />
  if (block.type === 'code') return <CodeBlock key={key} block={block} />
  if (block.type === 'video') return <VideoBlock key={key} block={block} />
  if (block.type === 'mcq') return <McqHintBlock key={key} block={block} />

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

      <section className="space-y-4">{lesson.content.map(renderBlock)}</section>

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
