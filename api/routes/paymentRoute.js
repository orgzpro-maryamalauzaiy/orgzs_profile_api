import express from 'express'
import { callbackMid, createGeneralInvoice, createInvoiceMid } from '../controllers/invoicesController.js'

const routes = express.Router()

routes.post('/request-invoices', createInvoiceMid)
routes.post('/request-general-invoices', createGeneralInvoice)
routes.post('/mid-callback', callbackMid)

export default routes