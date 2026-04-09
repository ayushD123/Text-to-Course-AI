const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const parseError = async (response) => {
  try {
    const data = await response.json()
    return data?.error?.message || 'Request failed'
  } catch {
    return 'Request failed'
  }
}

export const getJson = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}

export const postJson = async (path, body) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}

export const deleteJson = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}
