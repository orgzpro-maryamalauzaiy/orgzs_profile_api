import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
// import { logger } from './core/Logger.js'
import authRoute from './routes/authRoute.js'
import userRoute from './routes/userRoute.js'
import paymentRoute from './routes/paymentRoute.js'

const app = express()

dotenv.config()

const allowedOrigins = ['http://localhost:3000', 'http://localhost:3001', 'https://15f1-113-11-180-17.ngrok-free.app','https://orgzsprofileapi.vercel.app']

// (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'))
//     }
//   }
const corsOptions = {
  origin: allowedOrigins,
  // methods: ['GET', 'POST'], // Specify allowed HTTP methods
  // allowedHeaders: ['Content-Type'], // Specify allowed headers
  credentials: true,
};

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())
app.use(/.*/, cors())
// app.use(cors(corsOptions))

// app.use(cors())

app.get('/',(req, res) => {
    res.send("Hello from Organization Profile server")
})

app.use('/api/auth', authRoute)
app.use('/api/users', userRoute)
app.use('/api/payments', paymentRoute)

const PORT = process.env.PORT || 5050

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
    // logger.info(`Server is running on port ${PORT}`)
})