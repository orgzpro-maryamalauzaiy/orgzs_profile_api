import express from 'express'
import { callbackMid, createInvoiceMid } from '../controllers/invoicesController.js'

const routes = express.Router()

routes.post('/request-invoices', createInvoiceMid)
routes.post('/mid-callback', callbackMid)

export default routes