// Vercel Serverless Function (feature/ai)
// Calls AI provider securely using AI_API_KEY. Generates structured JSON output validated with Zod.
export default async function handler(req, res) {
  res.status(200).json({ message: "AI question engine endpoint" });
}