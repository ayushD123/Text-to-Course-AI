const KEYS = {
  latestCourse: 'ttl_latest_course',
  lessonCachePrefix: 'ttl_lesson_',
}

export const saveLatestCourse = (coursePayload) => {
  localStorage.setItem(KEYS.latestCourse, JSON.stringify(coursePayload))
}

export const getLatestCourse = () => {
  const raw = localStorage.getItem(KEYS.latestCourse)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const removeLatestCourse = () => {
  localStorage.removeItem(KEYS.latestCourse)
}

export const saveLessonCache = (lessonId, lessonPayload) => {
  localStorage.setItem(`${KEYS.lessonCachePrefix}${lessonId}`, JSON.stringify(lessonPayload))
}

export const getLessonCache = (lessonId) => {
  const raw = localStorage.getItem(`${KEYS.lessonCachePrefix}${lessonId}`)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
