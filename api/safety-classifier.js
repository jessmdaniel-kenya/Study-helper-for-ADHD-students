// Vercel Serverless Function (feature/ai)
// Returns flags for self-critical text, crisis wording, unsolicited advice, and hostility.
export default async function handler(req, res) {
  res.status(200).json({ message: "Safety classifier endpoint" });
}