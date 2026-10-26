export type Step = { text: string; minutes: number }

export type Question = {
  type: 'mcq' | 'written'
  prompt: string
  options?: string[]
  answer: string
  explanation: string
  quote: string
}

export type Plan = { id: string; steps: Step[]; questions: Question[] }
export type Reward = { id: number; name: string; emoji: string }
export type Hit = { id: string; title: string; snippet: string }
export type Result = { busy?: boolean; verdict?: string; feedback?: string; best?: string }