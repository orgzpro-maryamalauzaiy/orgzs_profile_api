import express from 'express'
import { createInvoice } from '../models/invoicesModel.js'

const routes = express.Router()

routes.post('/request-invoices', createInvoice)

export default routes