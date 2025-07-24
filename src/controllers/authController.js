import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sql } from '../config/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function register(req, res) {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  const password_hash = await bcrypt.hash(password, 10)

  try {
    const [user] = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${password_hash})
      RETURNING id, name, email;
    `
    res.status(201).json(user)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: 'Email already in use' })
  }
}

export async function login(req, res) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const [user] = await sql`
    SELECT * FROM users WHERE email = ${email};
  `
  if (!user) return res.status(401).json({ error: 'Invalid credentials' })

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token })
}
