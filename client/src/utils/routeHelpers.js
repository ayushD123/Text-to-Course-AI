export const buildCoursePath = (courseId) => `/courses/${courseId}`

export const buildLessonPath = (lessonId, query = {}) => {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, String(value))
  })

  const queryString = params.toString()
  return queryString ? `/lessons/${lessonId}?${queryString}` : `/lessons/${lessonId}`
}

export const toSlug = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
