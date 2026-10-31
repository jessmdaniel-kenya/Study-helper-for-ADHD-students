export async function readApiResponse<T>(response: Response): Promise<T> {
  const text = await response.text()
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(
      `The quiz API returned an empty or invalid response (HTTP ${response.status}). ` +
      'Make sure the local dev server is running and check its terminal for errors.',
    )
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'error' in data &&
      typeof data.error === 'string'
        ? data.error
        : `The quiz API request failed (HTTP ${response.status}).`
    throw new Error(message)
  }

  return data as T
}
