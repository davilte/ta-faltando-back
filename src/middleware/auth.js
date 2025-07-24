import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader?.split(' ')[1]

  if (!token) return res.sendStatus(401)

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = Number(payload.userId)
    next()
  } catch {
    res.sendStatus(403)
  }
}
