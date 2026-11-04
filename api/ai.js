export default function handler(req, res) {
  return res.status(410).json({ error: 'This endpoint has been retired. Use the quiz endpoint with your own provider key.' })
}
