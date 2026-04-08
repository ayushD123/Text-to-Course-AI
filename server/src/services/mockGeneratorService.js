const buildSeed = (text) => {
  return String(text)
    .split('')
    .reduce((total, char, index) => total + char.charCodeAt(0) * (index + 1), 0)
}

const toTopicLabel = (topic) => {
  return topic
    .trim()
    .split(/\s+/)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

const buildTags = (topicLabel) => {
  const words = topicLabel
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 3)

  return [...new Set([topicLabel.toLowerCase().replace(/\s+/g, '-'), ...words, 'beginner-friendly'])]
}

const generateOutline = (topic) => {
  const topicLabel = toTopicLabel(topic)
  const seed = buildSeed(topicLabel)
  const moduleCount = 3 + (seed % 3)

  const modules = Array.from({ length: moduleCount }).map((_, moduleIndex) => {
    const lessonCount = 3 + ((seed + moduleIndex) % 2)
    const moduleNumber = moduleIndex + 1

    const lessons = Array.from({ length: lessonCount }).map((__, lessonIndex) => {
      const lessonNumber = lessonIndex + 1
      return {
        id: `m${moduleNumber}-l${lessonNumber}`,
        title: `${topicLabel} Lesson ${moduleNumber}.${lessonNumber}`,
      }
    })

    return {
      id: `module-${moduleNumber}`,
      title: `${topicLabel} Module ${moduleNumber}`,
      lessons,
    }
  })

  return {
    title: `${topicLabel} Course`,
    description: `A practical and beginner-friendly course outline for ${topicLabel}.`,
    tags: buildTags(topicLabel),
    modules,
  }
}

const generateLesson = ({ courseTitle, moduleTitle, lessonTitle }) => {
  const lessonSeed = buildSeed(`${courseTitle}-${moduleTitle}-${lessonTitle}`)

  const mcqs = Array.from({ length: 4 }).map((_, index) => {
    const questionNo = index + 1
    return {
      question: `Question ${questionNo}: What is the best summary of ${lessonTitle}?`,
      options: [
        `Option A for ${lessonTitle}`,
        `Option B for ${lessonTitle}`,
        `Option C for ${lessonTitle}`,
        `Option D for ${lessonTitle}`,
      ],
      answer: ['A', 'B', 'C', 'D'][(lessonSeed + index) % 4],
      explanation: `This checks core understanding of ${lessonTitle} in the context of ${moduleTitle}.`,
    }
  })

  return {
    title: lessonTitle,
    objectives: [
      `Understand the core idea of ${lessonTitle}`,
      `Explain how ${lessonTitle} fits into ${moduleTitle}`,
      `Apply ${lessonTitle} concepts in a small exercise`,
    ],
    content: [
      { type: 'heading', text: lessonTitle },
      {
        type: 'paragraph',
        text: `${lessonTitle} is an important concept inside ${courseTitle}. This mock lesson gives a clear and structured walkthrough.`,
      },
      {
        type: 'code',
        language: 'javascript',
        code: `// Example snippet for ${lessonTitle}\nfunction demoConcept() {\n  return '${lessonTitle}';\n}`,
      },
      {
        type: 'video',
        provider: 'youtube',
        title: `${lessonTitle} - visual walkthrough`,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      {
        type: 'mcq',
        text: 'Practice with the quiz section below to test your understanding.',
      },
    ],
    readings: [
      `${courseTitle} handbook section on ${moduleTitle}`,
      `${lessonTitle} quick reference notes`,
    ],
    mcqs,
  }
}

module.exports = {
  generateOutline,
  generateLesson,
}
