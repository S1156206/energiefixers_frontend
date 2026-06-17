const BASE_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfter: string | null = null,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = localStorage.getItem('auth_token')

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })

  const data = await response.json()

  if (!response.ok) {
    const retryAfter = response.status === 429 && typeof data.data === 'string' ? data.data : null
    throw new ApiError(data.error ?? 'Er is iets misgegaan', response.status, retryAfter)
  }

  return (data.data !== undefined ? data.data : data) as T
}
