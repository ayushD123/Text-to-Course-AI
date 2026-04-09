export const buildCoursePath = (courseId) => `/courses/${courseId}`

export const buildLessonPath = (lessonId) => `/lessons/${lessonId}`

export const toSlug = (text) =>
  String(text)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
