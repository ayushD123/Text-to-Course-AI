const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const parseError = async (response) => {
  try {
    const data = await response.json()
    return data?.error?.message || 'Request failed'
  } catch {
    return 'Request failed'
  }
}

const buildHeaders = ({ accessToken, hasBody = false } = {}) => {
  const headers = {}

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  return headers
}

export const getJson = async (path, options = {}) => {
  const { accessToken } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: 'no-store',
    headers: buildHeaders({ accessToken }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}

export const postJson = async (path, body, options = {}) => {
  const { accessToken } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders({ accessToken, hasBody: true }),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}

export const deleteJson = async (path, options = {}) => {
  const { accessToken } = options

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders({ accessToken }),
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return response.json()
}
