import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PDF_PAGE_MARGIN_MM = 10

const toSafeFileName = (value) => {
  const sanitized = (value || 'lesson').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return sanitized || 'lesson'
}

function LessonPDFExporter({ lesson, explanationHeading, explanationText }) {
  const exportContentRef = useRef(null)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  const handleDownloadPdf = async () => {
    if (!lesson || !exportContentRef.current) return

    try {
      setIsExporting(true)
      setError('')

      await new Promise((resolve) => setTimeout(resolve, 0))

      const canvas = await html2canvas(exportContentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imageData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const printableWidth = pageWidth - PDF_PAGE_MARGIN_MM * 2
      const printableHeight = pageHeight - PDF_PAGE_MARGIN_MM * 2
      const imageHeight = (canvas.height * printableWidth) / canvas.width

      let renderedHeight = 0

      pdf.addImage(
        imageData,
        'PNG',
        PDF_PAGE_MARGIN_MM,
        PDF_PAGE_MARGIN_MM,
        printableWidth,
        imageHeight,
        undefined,
        'FAST',
      )

      while (renderedHeight + printableHeight < imageHeight) {
        renderedHeight += printableHeight
        pdf.addPage()
        pdf.addImage(
          imageData,
          'PNG',
          PDF_PAGE_MARGIN_MM,
          PDF_PAGE_MARGIN_MM - renderedHeight,
          printableWidth,
          imageHeight,
          undefined,
          'FAST',
        )
      }

      pdf.save(`${toSafeFileName(lesson.title)}.pdf`)
    } catch {
      setError('Unable to export lesson as PDF right now. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isExporting || !lesson}
          className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-indigo-500 hover:text-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? 'Preparing PDF...' : 'Download lesson PDF'}
        </button>
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      </div>

      <article ref={exportContentRef} className="pointer-events-none fixed -left-[99999px] top-0 z-[-1] w-[900px] bg-white p-10 text-slate-900">
        <header className="space-y-3 border-b border-slate-200 pb-5">
          <h1 className="text-3xl font-bold">{lesson?.title}</h1>
          <section>
            <h2 className="text-base font-semibold">Objectives</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
              {(lesson?.objectives || []).map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>
        </header>

        <section className="mt-6 space-y-3">
          <h2 className="text-xl font-semibold">{explanationHeading}</h2>
          <p className="whitespace-pre-wrap text-sm leading-7">{explanationText}</p>
        </section>

        <section className="mt-6 space-y-4">
          {(lesson?.content || []).map((block, index) => {
            const key = `${block?.type || 'block'}-${index}`

            if (block?.type === 'heading') {
              return (
                <h3 key={key} className="text-xl font-semibold text-slate-900">
                  {block.text}
                </h3>
              )
            }

            if (block?.type === 'paragraph') {
              return (
                <p key={key} className="text-sm leading-7 text-slate-800">
                  {block.text}
                </p>
              )
            }

            if (block?.type === 'code') {
              return (
                <div key={key} className="rounded-lg border border-slate-300 bg-slate-100 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{block.language || 'code'}</p>
                  <pre className="overflow-x-auto text-xs leading-6 text-slate-900">
                    <code>{block.code}</code>
                  </pre>
                </div>
              )
            }

            return null
          })}
        </section>

        <section className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="text-xl font-semibold">Readings</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
            {(lesson?.readings || []).map((reading) => (
              <li key={reading}>{reading}</li>
            ))}
          </ul>
        </section>

        <section className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Quiz</h2>
          {(lesson?.mcqs || []).map((mcq, index) => (
            <article key={`${mcq.question}-${index}`} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {index + 1}. {mcq.question}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-800">
                {(mcq.options || []).map((option) => (
                  <li key={option}>{option}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs font-semibold text-emerald-700">Answer: {mcq.answer}</p>
              <p className="mt-1 text-xs text-slate-700">{mcq.explanation}</p>
            </article>
          ))}
        </section>
      </article>
    </>
  )
}

export default LessonPDFExporter