const KEYS = {
  latestOutline: 'ttl_latest_outline',
  latestLesson: 'ttl_latest_lesson',
}

export const saveLatestOutline = (outlinePayload) => {
  localStorage.setItem(KEYS.latestOutline, JSON.stringify(outlinePayload))
}

export const getLatestOutline = () => {
  const raw = localStorage.getItem(KEYS.latestOutline)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const saveLatestLesson = (lessonPayload) => {
  localStorage.setItem(KEYS.latestLesson, JSON.stringify(lessonPayload))
}

export const getLatestLesson = () => {
  const raw = localStorage.getItem(KEYS.latestLesson)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
