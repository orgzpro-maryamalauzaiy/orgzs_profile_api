import axios from 'axios'
import supabase from '../configs/supabase.js'

const PAYMENT_BASE_URL = process.env.PAYMENT_BASE_URL
const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY
console.log(PAYMENT_API_KEY)

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

    const auth = PAYMENT_API_KEY || 'xnd_development_GnQ8ab6Cwx2nLKLcoEy23evHEQK3P7q6vJOGdaZxqcBLi1Z4FzfAXX0Ht9elUxDP'
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

    const auth = PAYMENT_API_KEY || 'xnd_development_GnQ8ab6Cwx2nLKLcoEy23evHEQK3P7q6vJOGdaZxqcBLi1Z4FzfAXX0Ht9elUxDP'
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