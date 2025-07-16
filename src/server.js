import express from 'express'
import dotenv from 'dotenv'
import { initDB } from './config/db.js'
import routes from './routes/index.js'

dotenv.config()
const app = express()
const PORT = process.env.PORT || 5001

app.use(express.json()) // Parse JSON bodies
app.use('/api/v1', routes) // Usar rotas externas

app.get('/', (req, res) => {
    res.send('Hello World!!!')
})

app.post("/api/v1/", async (req, res) => {})

initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
})