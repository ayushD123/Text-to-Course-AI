const Groq = require('groq-sdk')
const AppError = require('../utils/appError')

const buildOutlinePrompt = (topic) => {
  return [
    'You are an API that outputs course outlines as JSON.',
    'Return ONLY raw JSON. No markdown, no code fences, no explanation text.',
    'Generate a beginner-friendly but practical course outline for the given topic.',
    'Use this exact JSON shape:',
    '{',
    '  "title": "string",',
    '  "description": "string",',
    '  "tags": ["string"],',
    '  "modules": [',
    '    {',
    '      "title": "string",',
    '      "lessons": [',
    '        { "title": "string" }',
    '      ]',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- modules length: 3 to 6',
    '- lessons length per module: 3 to 5',
    '- tags length: 3 to 6',
    '- lesson titles must be concise and non-empty',
    `Topic: ${topic}`,
  ].join('\n')
}

const buildRepairPrompt = (rawResponse) => {
  return [
    'Fix the following content into valid JSON only.',
    'Return ONLY JSON. No markdown, no code fences, no extra text.',
    'Preserve meaning and structure for this shape:',
    '{"title":"string","description":"string","tags":["string"],"modules":[{"title":"string","lessons":[{"title":"string"}]}]}',
    'Content to repair:',
    rawResponse,
  ].join('\n')
}

const buildLessonPrompt = ({ courseTitle, moduleTitle, lessonTitle }) => {
  return [
    'You are an API that outputs lesson content as strict JSON.',
    'Return ONLY raw JSON. No markdown, no code fences, no explanation text.',
    'Generate a practical, beginner-friendly lesson using the exact schema below.',
    '{',
    '  "title": "string",',
    '  "objectives": ["string"],',
    '  "content": [',
    '    { "type": "heading", "text": "string" },',
    '    { "type": "paragraph", "text": "string" },',
    '    { "type": "code", "language": "javascript", "code": "string" },',
    '    { "type": "video", "title": "string" },',
    '    { "type": "mcq", "text": "string" }',
    '  ],',
    '  "readings": ["string"],',
    '  "videoQuery": "string",',
    '  "mcqs": [',
    '    {',
    '      "question": "string",',
    '      "options": ["string", "string", "string", "string"],',
    '      "answer": "A|B|C|D",',
    '      "explanation": "string"',
    '    }',
    '  ]',
    '}',
    'Rules:',
    '- objectives length: 3 to 6',
    '- content must contain only these block types: heading, paragraph, code, video, mcq',
    '- include code block only if genuinely useful for this lesson',
    '- readings length: 2 to 6',
    '- mcqs length: 4 to 5, each with exactly 4 options and valid answer A/B/C/D',
    '- keep language clear and concise',
    `Course title: ${courseTitle}`,
    `Module title: ${moduleTitle}`,
    `Lesson title: ${lessonTitle}`,
  ].join('\n')
}

const tryParseJson = (rawText) => {
  const text = String(rawText || '').trim()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch (error) {
    return null
  }
}

const callGroqChatCompletion = async ({ apiKey, model, userPrompt }) => {
  const groq = new Groq({ apiKey })

  try {
    const data = await groq.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You must return strict raw JSON only.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    return String(data?.choices?.[0]?.message?.content || '').trim()
  } catch (error) {
    console.warn('[generation][groq] API request failed', {
      status: error?.status || null,
      code: error?.code || null,
      message: error?.message || 'unknown error',
    })
    throw new AppError(502, 'Groq provider request failed')
  }
}

const parseWithSingleRepair = async ({ apiKey, model, initialPrompt, malformedErrorMessage }) => {
  const firstRawText = await callGroqChatCompletion({
    apiKey,
    model,
    userPrompt: initialPrompt,
  })

  const firstParsed = tryParseJson(firstRawText)
  if (firstParsed) {
    return firstParsed
  }

  console.warn('[generation][groq] Invalid JSON on first attempt', {
    preview: firstRawText.slice(0, 300),
    length: firstRawText.length,
  })

  const repairRawText = await callGroqChatCompletion({
    apiKey,
    model,
    userPrompt: buildRepairPrompt(firstRawText),
  })

  const repairedParsed = tryParseJson(repairRawText)
  if (!repairedParsed) {
    console.warn('[generation][groq] Invalid JSON after repair attempt', {
      preview: repairRawText.slice(0, 300),
      length: repairRawText.length,
    })
    throw new AppError(502, malformedErrorMessage)
  }

  return repairedParsed
}

const generateWithGroq = async ({ topic, apiKey, model }) => {
  if (!apiKey) {
    throw new AppError(500, 'GROQ_API_KEY is missing for groq provider')
  }

  return parseWithSingleRepair({
    apiKey,
    model,
    initialPrompt: buildOutlinePrompt(topic),
    malformedErrorMessage: 'AI provider returned malformed outline JSON',
  })
}

const generateLessonWithGroq = async ({ context, apiKey, model }) => {
  if (!apiKey) {
    throw new AppError(500, 'GROQ_API_KEY is missing for groq provider')
  }

  return parseWithSingleRepair({
    apiKey,
    model,
    initialPrompt: buildLessonPrompt(context),
    malformedErrorMessage: 'AI provider returned malformed lesson JSON',
  })
}

module.exports = {
  generateWithGroq,
  generateLessonWithGroq,
}
