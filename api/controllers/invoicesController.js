import axios from 'axios'
import supabase from '../configs/supabase.js'
import { logger } from '../core/Logger.js'

const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY
console.log(PAYMENT_API_KEY)

const PG_API_URL = process.env.SERVER_MODE == 'development'?process.env.PG_SANDBOX_URL: process.env.PG_PROD_URL

export const createInvoice_ = async (req, res) => {
    console.log(req.body, req.headers)
    const { price, payment_method, va_number, full_name, class_name, packet, category, type } = req.body
    const { orgz_id } = req.headers.OI

    let { data: orgz_packets, error_p } = await supabase
                                        .from('orgz_packets')
                                        .select("*")
                                        .eq('code', packet)
                                        .is('deleted_at', null)
    if(error_p){
        logger.error('Error get packet info')
        res.status(500).json({message: 'Failed create invoice'})
    }

    const prefix = 'INO'
    const { data: orders, error_o } = await supabase
                            .from('orgz_orders')
                            .select('*')
                            .eq('orgz_id', orgz_id)
                            .is('deleted_at', null)
                            .order('created_at', {ascending: false})
                            .limit(1).single()
    if(error_o){
        logger.error('Error when request invoice')
        res.status(500).json({message: 'Error when request invoice'})
    }

    const order = parseInt(orders.invoice_number.slice(-4)) + 1

    const invoice_number = `${prefix}${new Date().getFullYear().slice(-2)}/${type}/${order}`

    const { data: orgz_orders, error_orders } = await supabase
                            .from('orgz_orders')
                            .insert([
                                {
                                    total_price: price,
                                    total_amount: amount,
                                    total_discount: discount,
                                    promo_code: promo_code,
                                    admin_fee: 0,
                                    // created_by: ,
                                    order_status: 'pending',
                                    // orgz_user_id uuid null,
                                    orgz_id: orgz_id,
                                    orgz_packet_id: orgz_packets.id,
                                    invoice_number: invoice_number,
                                },
                            ])
                            .select()
                            .single()
    if(error_orders){
        logger.error('Error when create order')
        res.status(500).json({message: 'Error when create order'})

    }

    let channel_properties = {}
    let date_now = new Date()
    let hours = date_now.getHours()
    let new_hours = hours + 60
    let expired_at = date_now.setMinutes(new_hours)

    const auth = PAYMENT_API_KEY
    // Convert a string to Base64
    const authString = `${auth}:`;
    const base64String = Buffer.from(authString).toString('base64');

    console.log('Original String:', authString);
    console.log('Base64 Encoded:', base64String);
    // res.setHeader('Authorization', `Basic ${base64String}`)


    if(payment_method == 'MANDIRI_VIRTUAL_ACCOUNT'){
        channel_properties = {
            "expires_at" : expired_at,
            "display_name" : full_name[0],
            "virtual_account_number" : va_number,
            "verification_data": {
                "customer_name": full_name,
                "accepted_name_variations": [
                full_name,
                full_name
                ],
                "allowed_bank_accounts": [
                {
                    "bank_name": "BRI",
                    "account_number": "2876783233",
                    "account_name": "John Doe"
                }
                ]
            }
        }
    }
    if(payment_method == 'BSI_VIRTUAL_ACCOUNT'){
        channel_properties = {
            "expires_at" : expired_at,
            "display_name" : full_name,
            "virtual_account_number" : va_number
        }
    }
    const order_id = orgz_orders.invoice_number || '321654'
    const data = JSON.stringify({
        "reference_id": `order_${order_id}`,
        "type": "PAY",
        "country": "ID",
        "currency": "IDR",
        "request_amount": price,
        "capture_method": "AUTOMATIC",
        "channel_code": payment_method,
        "channel_properties": channel_properties,
        "description": `Pembayaran Kelas ${class_name} - ${packet}`,
        "metadata": {
            "order_id": order_id,
            "customer_type": "premium"
        }
    });

    try {
        await axios.post(PAYMENT_BASE_URL || 'https://api.xendit.co', data, {withCredential: true})
                        .then(response => {
                            console.log(response)
                            response.status == 200 ?
                            // 'SUCCESED'
                                    res.status(200).json({message: 'Successfully create invoice', data: response.actions.value}):
                                    res.status(500).json({message: 'Failed create invoice'})
                                })
                        .catch(error => {
                            console.log(error)
                            res.status(500).json({message: 'Error when create invoice'})
                        })
    } catch (error) {
        res.status(500).json({message: 'Error when create invoice'+ error})
    }
}

export const createInvoice = async (req, res) => {
    const {full_name, phone_number, class_name, packet, category, price, amount, discount, promo_code, admin_fee} = req.body

    const { orgz_id } = req.headers.OI

    let { data: orgz_packets, error_p } = await supabase
                                        .from('orgz_packets')
                                        .select("*")
                                        .eq('code', packet)
                                        .is('deleted_at', null)
    if(error_p){
        logger.error('Error get packet info')
        res.status(500).json({message: 'Failed create invoice'})
    }

    const prefix = 'INO'
    const { data: orders, error_o } = await supabase
                            .from('orgz_orders')
                            .select('*')
                            .eq('orgz_id', orgz_id)
                            .is('deleted_at', null)
                            .order('created_at', {ascending: false})
                            .limit(1).single()
    if(error_o){
        logger.error('Error when request invoice')
        res.status(500).json({message: 'Error when request invoice'})
    }

    const order = parseInt(orders.invoice_number.slice(-4)) + 1

    const invoice_number = `${prefix}${new Date().getFullYear().slice(-2)}/${type}/${order}`

    const { data: orgz_orders, error_orders } = await supabase
                            .from('orgz_orders')
                            .insert([
                                {
                                    total_price: price,
                                    total_amount: amount,
                                    total_discount: discount,
                                    promo_code: promo_code,
                                    admin_fee: 0,
                                    // created_by: ,
                                    order_status: 'pending',
                                    // orgz_user_id uuid null,
                                    orgz_id: orgz_id,
                                    orgz_packet_id: orgz_packets.id,
                                    invoice_number: invoice_number,
                                },
                            ])
                            .select()
                            .single()
    if(error_orders){
        logger.error('Error when create order')
        res.status(500).json({message: 'Error when create order'})

    }

    const order_id = orgz_orders.invoice_number || '321654'

    // const new_orders = {
    //     orgz_id: 'af8361e6-11ff-4800-b996-f2d567a7e56d',
    //     total_price: price,
    //     total_amount: amount,
    //     total_discount: discount,
    //     promo_code: promo_code,
    //     admin_fee: admin_fee,
    // }

    // const { data: order, error } = await supabase
    //     .from('orgz_orders')
    //     .insert([
    //         new_orders
    //     ])
    //     .select()

    console.log(order)

    // if(!order || error){
    //     return res.status(200).json({message: 'Failed create order'})
    // }

    const data = {
        "external_id": `CO-${order_id}`,
        "amount": amount,
        "description": packet || "",
        "invoice_duration": 86400,
        "customer": {
            "given_names": full_name[0],
            "surname": full_name[0],
            "email": '',
            "mobile_number": phone_number
        },
        "success_redirect_url": "https://www.google.com",
        "failure_redirect_url": "https://www.google.com",
        "currency": "IDR",
        "items": [
            {
            "name": class_name,
            "quantity": 1,
            "price": price,
            "category": category,
            "url": "https://yourcompany.com/example_item"
            }
        ],
        "metadata": {
            "store_branch": "Jakarta"
        }
    }

    const auth = PAYMENT_API_KEY
    // Convert a string to Base64
    const authString = `${auth}:`;
    const base64String = Buffer.from(authString).toString('base64');

    console.log('Original String:', authString);
    console.log('Base64 Encoded:', base64String);
    // res.setHeader('Authorization', `Basic ${base64String}`)

    try {
        await axios.post(`${PAYMENT_BASE_URL || 'https://api.xendit.co'}/v2/invoices`, data, {headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + base64String
        }})
                        .then( async (response) => {
                            console.log(response)
                            if(response.data.status !== 'PENDING'){
                                const { data: order, error } = await supabase
                                                        .from('orgz_orders')
                                                        .update({ order_status: response.data.status })
                                                        .eq('id', order.id)
                                                        .select()
                                return res.status(500).json({message: 'Failed create invoice'})

                            }
                            res.status(200).json({message: 'Successfully create invoice', data: response.data.invoice_url})
                        })
                        .catch(error => {
                            console.log(error)
                            res.status(500).json({message: 'Error when create invoice' + error})
                        })

        // res.status(201).json({message: 'S'})
    } catch (error) {
        res.status(500).json({message: 'Error when create invoice'+ error})
    }
}

export const createInvoiceMid = async (req, res) => {
  try {
    // req.cookie

    // const {products, total_amount, total_price, admin_fee, total_discount, promo_code} = req.body
    // const uni = req.user.uni

    const {participants, phone_number, class_name, class_id, packet, category, type, total_price, amount, discount, promo_code, admin_fee} = req.body

    const transaction_date = new Date().toISOString()

    const orgz_id = req.headers.oi

    console.log(orgz_id, req.headers)

    const { data: orgz_packets, error_p } = await supabase
                                        .from('orgz_packets')
                                        .select("*")
                                        .eq('code', packet)
                                        .is('deleted_at', null)

    console.log('packet:', orgz_packets)

    if(error_p){
        logger.error('Error get packet info')
        res.status(400).json({message: 'Packet not found'})
    }

    const prefix = 'INO'
    const { data: orders, error_o } = await supabase
                            .from('orgz_orders')
                            .select('*')
                            .eq('orgz_id', orgz_id)
                            .is('deleted_at', null)
                            .order('created_at', {ascending: false})
                            .limit(1)

    console.log('orders', orders, error_o, orders[0]?.invoice_number)

    if(error_o){
        logger.error('Error when request invoice: ' + error_o)
        return res.status(500).json({message: 'Error when request invoice'})
    }

    const start = '0000'
    const order = orders[0].invoice_number? String(parseInt(orders[0].invoice_number.slice(-4)) + 1).padStart(4, '0') : String(1).padStart(4, '0')

    const invoice_number = `${prefix}${String(new Date().getFullYear()).slice(-2)}${type || 'CLASS'}-${order}`

    // const order =
    const { data, error } = await supabase
                            .from('orgz_orders')
                            .insert([{
                                    total_price: parseInt(total_price),
                                    total_amount: parseInt(amount),
                                    total_discount: parseInt(discount) || 0,
                                    promo_code: promo_code,
                                    admin_fee: 0,
                                    // created_by: ,
                                    order_status: 'pending',
                                    // orgz_user_id uuid null,
                                    orgz_id: orgz_id,
                                    orgz_packet_id: orgz_packets.id,
                                    invoice_number: invoice_number
                                }
                            ])
                            .select()

    console.log('invoice_number', invoice_number, data, error)

    if(error){
        logger.error('Error when create order')
        return res.status(500).json({message: 'Error when create order: ' + error})

    }


    const order_id = invoice_number || '321654'

    // const new_orders = {
    //     orgz_id: 'af8361e6-11ff-4800-b996-f2d567a7e56d',
    //     total_price: price,
    //     total_amount: amount,
    //     total_discount: discount,
    //     promo_code: promo_code,
    //     admin_fee: admin_fee,
    // }

    // const { data: order, error } = await supabase
    //     .from('orgz_orders')
    //     .insert([
    //         new_orders
    //     ])
    //     .select()

    // const prefix = 'INS-'
    // const orders = await pool.query('SELECT invoice_number FROM orders ORDER BY invoice_number desc')

    // console.log('orders', orders.rows, uni)

    // let inv_number = `${prefix}-${new Date().getFullYear()}`
    // let order = '00000'
    // if(!orders){
    //     order = String(1).padStart(4, '0')
    // }else{
    //     order = String(parseInt(orders.rows[0].invoice_number.split('/')[2]) + 1).padStart(4, '0')
    // }

    // inv_number = `${inv_number}-${order}`
    // const {rows} = await pool.query('INSERT INTO orders (invoice_number, total_price, total_amount, total_discount, admin_fee, promo_code, order_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    //     [inv_number, total_price, total_amount, total_discount, admin_fee, promo_code, 'pending' ]
    // )

    // console.log('new_order', rows)

    // if(!rows){
    //     return res.status(400).json({error: true, message: 'Error create order'})
    // }

    // const new_order = await pool.query('SELECT * FROM orders WHERE invoice_number = $1 AND deleted_at is null', [inv_number])

    // const order_id = 'INS/' + new Date().getSeconds()

    // req.user.uni ||
    // req.user.account_id ||
    // const account_id = '004d28d4-a4b6-4a70-bc24-5dc55ace83f1'
    // const users = await pool.query('SELECT id FROM users WHERE uni = $1', [uni])

    // const customers = await pool.query('SELECT c.email,c.full_name,c.phone_number FROM customers c LEFT JOIN users u ON u.account_id = c.id WHERE uni = $1 AND u.deleted_at is null', [uni])

    // if(customers){
        // products.forEach((item) => {
        //     const { rows } = pool.query('INSERT INTO order_details (order_id, product_id, price, amount, discount, promo_code, admin_fee) VALUES ($1, $2, $3, $4, $5, $6, $7)', [new_order.rows[0].id, item._id, item.price, item.quantity, 0, "", 0])
        // });

        // if(!rows){
        //     return res.status(200).json({error: true, message: 'Error when create order'})
        // }
        // const customer = customers.rows[0]

        const username = process.env.SERVER_MODE == 'development'?process.env.PG_SANDBOX_SERVER_KEY: process.env.PG_PROD_SERVER_KEY
        console.log('username', username)
        // const AUTH_STRING = 'Basic ' + btoa(username + ":")
        const AUTH_STRING = 'Basic ' + new Buffer(username + ":").toString('base64')
        console.log('AUTH_STRING', AUTH_STRING, PG_API_URL)

        const transaction = {
            transaction_details: {
                order_id: invoice_number,
                gross_amount: parseInt(total_price)
            },
            // item_details: [{
            //     id: class_id,
            //     price: parseInt(total_price),
            //     quantity: amount,
            //     name: class_name,
            //     category: type
            // }],
            // "customer_details": {
            //     "first_name": "salma",
            //     "last_name": "-",
            //     "email": "-",
            //     "phone": phone_number
            // }
        }
        // "merchant_name": 'RQA'

        console.log(transaction)

        await axios.post(`${PG_API_URL}/transactions`, transaction, {headers: {accept: 'application/json', 'content-type': 'application/json', Authorization: AUTH_STRING}})
                    .then(async result => {
                        console.log('result', result)
                        if(result.status == 201){
                            // const { data, error } = await supabase
                            //                         .from('orgz_orders')
                            //                         .update({ order_status: 'pending', updated_at: new Date().toDateString() })
                            //                         .eq('id', order_id)
                            //                         .select().single()

                            // if(error){
                            //     return res.status(400).json({error: true, message: 'Error create invoice'})
                            // }
                            res.status(200).json({error: false, message: 'Successfull create invoice', data: {token: result.data.token, payment_url: result.data.redirect_url, transaction_date: transaction_date}})

                        }
                    })
                    .catch(error => {
                        return res.status(400).json({error: true, message: 'Error when create invoice: ' + error})
                    })

        // let parameter = {
        //     "transaction_details": {
        //         "order_id": new_order.rows[0].id,
        //         "gross_amount": amount
        //     },
        //     "credit_card":{
        //         "secure" : true
        //     },
        //     "customer_details": {
        //         "first_name": customer.full_name,
        //         "last_name": '-',
        //         "email": customer.email,
        //         "phone": customer.phone_number
        //     }
        // };

        // snap.createTransaction(parameter)
        //     .then((transaction)=>{
        //         // transaction token
        //         console.log(transaction)
        //         let transactionToken = transaction.token;
        //         console.log('transactionToken:',transactionToken);

        //         res.json({transactionToken})
        //     })
    // }


  } catch (error) {
    return res.status(500).json({error: 'Error when create invoice ' + error})
  }
}

export const createGeneralInvoice = async (req, res) => {
  try {
    // req.cookie

    // const {products, total_amount, total_price, admin_fee, total_discount, promo_code} = req.body
    // const uni = req.user.uni

    const {participants, phone_number, class_name, class_id, packet, category, type, total_price, amount, discount, promo_code, admin_fee} = req.body

    const transaction_date = new Date().toISOString()

    const orgz_id = req.headers.oi

    console.log(orgz_id, req.headers)

    const { data: orgz_packets, error_p } = await supabase
                                        .from('orgz_packets')
                                        .select("*")
                                        .eq('code', packet)
                                        .is('deleted_at', null)

    console.log('packet:', orgz_packets)

    if(error_p){
        logger.error('Error get packet info')
        res.status(400).json({message: 'Packet not found'})
    }

    const prefix = 'INO'
    const { data: orders, error_o } = await supabase
                            .from('orgz_orders')
                            .select('*')
                            .eq('orgz_id', orgz_id)
                            .is('deleted_at', null)
                            .order('created_at', {ascending: false})
                            .limit(1)

    console.log('orders', orders, error_o, orders[0]?.invoice_number)

    if(error_o){
        logger.error('Error when request invoice: ' + error_o)
        return res.status(500).json({message: 'Error when request invoice'})
    }

    const start = '0000'
    const order = orders[0].invoice_number? String(parseInt(orders[0].invoice_number.slice(-4)) + 1).padStart(4, '0') : String(1).padStart(4, '0')

    const invoice_number = `${prefix}${String(new Date().getFullYear()).slice(-2)}/${type || 'CLASS'}/${order}`

    // const order =
    const { data, error } = await supabase
                            .from('orgz_orders')
                            .insert([{
                                    total_price: parseInt(total_price),
                                    total_amount: parseInt(amount),
                                    total_discount: parseInt(discount) || 0,
                                    promo_code: promo_code,
                                    admin_fee: 0,
                                    // created_by: ,
                                    order_status: 'pending',
                                    // orgz_user_id uuid null,
                                    orgz_id: orgz_id,
                                    orgz_packet_id: orgz_packets.id,
                                    invoice_number: invoice_number
                                }
                            ])
                            .select()

    console.log('invoice_number', invoice_number, data, error)

    if(error){
        logger.error('Error when create order')
        return res.status(500).json({message: 'Error when create order: ' + error})

    }

    const transaction = {
        transaction_details: {
            order_id: invoice_number,
            gross_amount: parseInt(total_price)
        },
        item_details: [{
            id: class_id,
            price: parseInt(total_price),
            quantity: amount,
            name: class_name,
            category: type
        }],
        "customer_details": {
            "first_name": participants,
            "last_name": "-",
            "email": "-",
            "phone": phone_number
        }
    }


    // const order_id = invoice_number || '321654'

    // const new_orders = {
    //     orgz_id: 'af8361e6-11ff-4800-b996-f2d567a7e56d',
    //     total_price: price,
    //     total_amount: amount,
    //     total_discount: discount,
    //     promo_code: promo_code,
    //     admin_fee: admin_fee,
    // }

    // const { data: order, error } = await supabase
    //     .from('orgz_orders')
    //     .insert([
    //         new_orders
    //     ])
    //     .select()

    // const prefix = 'INS-'
    // const orders = await pool.query('SELECT invoice_number FROM orders ORDER BY invoice_number desc')

    // console.log('orders', orders.rows, uni)

    // let inv_number = `${prefix}-${new Date().getFullYear()}`
    // let order = '00000'
    // if(!orders){
    //     order = String(1).padStart(4, '0')
    // }else{
    //     order = String(parseInt(orders.rows[0].invoice_number.split('/')[2]) + 1).padStart(4, '0')
    // }

    // inv_number = `${inv_number}-${order}`
    // const {rows} = await pool.query('INSERT INTO orders (invoice_number, total_price, total_amount, total_discount, admin_fee, promo_code, order_status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    //     [inv_number, total_price, total_amount, total_discount, admin_fee, promo_code, 'pending' ]
    // )

    // console.log('new_order', rows)

    // if(!rows){
    //     return res.status(400).json({error: true, message: 'Error create order'})
    // }

    // const new_order = await pool.query('SELECT * FROM orders WHERE invoice_number = $1 AND deleted_at is null', [inv_number])

    // const order_id = 'INS/' + new Date().getSeconds()

    // req.user.uni ||
    // req.user.account_id ||
    // const account_id = '004d28d4-a4b6-4a70-bc24-5dc55ace83f1'
    // const users = await pool.query('SELECT id FROM users WHERE uni = $1', [uni])

    // const customers = await pool.query('SELECT c.email,c.full_name,c.phone_number FROM customers c LEFT JOIN users u ON u.account_id = c.id WHERE uni = $1 AND u.deleted_at is null', [uni])

    // if(customers){
        // products.forEach((item) => {
        //     const { rows } = pool.query('INSERT INTO order_details (order_id, product_id, price, amount, discount, promo_code, admin_fee) VALUES ($1, $2, $3, $4, $5, $6, $7)', [new_order.rows[0].id, item._id, item.price, item.quantity, 0, "", 0])
        // });

        // if(!rows){
        //     return res.status(200).json({error: true, message: 'Error when create order'})
        // }
        // const customer = customers.rows[0]

        res.status(200).json({error: false, message: 'Successfull create invoice', data: transaction})

        // const username = process.env.SERVER_MODE == 'development'?process.env.PG_SANDBOX_SERVER_KEY: process.env.PG_PROD_SERVER_KEY
        // console.log('username', username)
        // const AUTH_STRING = 'Basic ' + btoa(username + ":")
        // console.log('AUTH_STRING', AUTH_STRING, PG_API_URL)
        // const AUTH_STRING = 'Basic ' + new Buffer(username + ":").toString('base64')
        // // "merchant_name": 'RQA'

        // console.log(transaction)

        // await axios.post(`${PG_API_URL}/transactions`, transaction, {headers: {accept: 'application/json', 'content-type': 'application/json', Authorization: AUTH_STRING}})
        //             .then(result => {
        //                 console.log('result', result)
        //                 if(result.status == 201){
        //                     // const { data, error } = await supabase
        //                     //                         .from('orgz_orders')
        //                     //                         .update({ order_status: 'pending', updated_at: new Date().toDateString() })
        //                     //                         .eq('id', order_id)
        //                     //                         .select().single()

        //                     // if(error){
        //                     //     return res.status(400).json({error: true, message: 'Error create invoice'})


        //                     // }
        //                     res.status(200).json({error: false, message: 'Successfull create invoice', data: {token: result.data.token, payment_url: result.data.redirect_url, transaction_date: transaction_date}})

        //                 }
        //             })
        //             .catch(error => {
        //                 return res.status(400).json({error: true, message: 'Error when create invoice: ' + error})
        //             })

        // let parameter = {
        //     "transaction_details": {
        //         "order_id": new_order.rows[0].id,
        //         "gross_amount": amount
        //     },
        //     "credit_card":{
        //         "secure" : true
        //     },
        //     "customer_details": {
        //         "first_name": customer.full_name,
        //         "last_name": '-',
        //         "email": customer.email,
        //         "phone": customer.phone_number
        //     }
        // };

        // snap.createTransaction(parameter)
        //     .then((transaction)=>{
        //         // transaction token
        //         console.log(transaction)
        //         let transactionToken = transaction.token;
        //         console.log('transactionToken:',transactionToken);

        //         res.json({transactionToken})
        //     })
    // }


  } catch (error) {
    return res.status(500).json({error: 'Error when create invoice ' + error})
  }
}

export const callbackMid = async (req, res) => {

    try {
        const {order_id, gross_amount, bank, status_code, transaction_status, transaction_time, payment_type } = req.body

        console.log(req.body)

        if(order_id){
            try {

                // const callbacks = await pool.query('INSERT INTO payment_logs (api, headers, body, order_id, result) VALUES ($1, $2, $3, $4, $5)', [req.headers.host, req.headers, req.body, order_id, 'ok'])

                const { data: m_payment_logs, error } = await supabase
                                        .from('m_payment_logs')
                                        .insert([
                                            { api: req.headers.host, headers: req.headers, body: req.body, order_id: order_id, result: transaction_status, status_code: status_code},
                                        ])
                                        .select().single()

                if(error) return res.status(400).json({error: true, message: 'Error when handle callback' + error + m_payment_logs})


                const { data, error_payments } = await supabase
                                        .from('orgz_order_payments')
                                        .insert([
                                            { payment_method: payment_type, payment_status: transaction_status, status_code: status_code, settlement_date: transaction_time, order_id: order_id },
                                        ])
                                        .select()
                // const { data: orgz_order_payments, error_payments } = await supabase
                //                         .from('orgz_order_payments')
                //                         .insert([
                //                             { payment_method: payment_type, payment_status: transaction_status, status_code: status_code, settlement_date: transaction_time, order_id: order_id },
                //                         ])
                //                         .select()
                // const payments = await pool.query('INSERT INTO orgz_order_payments (payment_method, payment_status, status_code, settlement_date, order_id) VALUES ($1, $2, $3, $4, $5)', [payment_type, transaction_status, status_code, transaction_date, order_id])

                if(error_payments) return res.status(400).json({error: true, message: 'Error when update payment' + error_payments})

                    console.log(data, error_payments)

                const { data: orgz_orders, error_orders } = await supabase
                                        .from('orgz_orders')
                                        .update({ order_status: 'successed', updated_at: new Date().toDateString() })
                                        .eq('invoice_number', order_id)
                                        .eq('total_amount', gross_amount)
                                        .select()
                // const {rows} = await pool.query(`UPDATE orgz_orders SET order_status = 'successed' WHERE id = $1 AND total_amount = $2`, [order_id, gross_amount])

                if(error_orders) return res.status(400).json({error: true, message: 'Error when update order: ' + error_orders})


                if(bank){
                    const { data, error } = await supabase
                                            .from('orgz_order_payments')
                                            .update({ bank_code: bank, updated_at: new Date().toDateString()})
                                            .eq('id', payments.id)
                                            .select()
                    // const {rows} = await pool.query(`INSERT INTO order_payments (bank_code, updated_at) VALUES ($1, $2)`, [bank, new Date().toDateString()])

                    if(error){
                        return res.status(200).json({error: false, message: 'Successfully save callback' + error})
                    }
                }

                res.status(200).json({error: false, message: 'Successfully save callback'})


            } catch (error) {
                return res.status(400).json({error: true, message: 'Error when store callback: ' + error})
            }
        }

    } catch (error) {
        return res.status(400).json({error: true, message: 'Error when send callback: ' + error})
    }
}