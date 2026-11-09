import { readApiResponse } from './apiResponse'

export type SafetyReview = {
  flagged: boolean
  flags: Record<string, boolean>
  severity: 'crisis' | 'concern' | 'low' | 'none'
  action: string
  evidence: string[]
  message: string
}

export async function reviewCommunityText(text: string): Promise<SafetyReview> {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  const response = await fetch(`${apiBaseUrl}/api/safety-classifier`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  return readApiResponse<SafetyReview>(response)
}
