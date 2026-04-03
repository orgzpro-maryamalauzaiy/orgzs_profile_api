// import express from 'express'
// import userModel from '../models/userModel.js'


// export const getUsers = async(req, res) => {
//     const data = []
//     res.status(200).json({error: false, message: 'Get user successfully', data: data})
// }

// export const registUser = async (req, res) => {
//     const { fullname, email, password } = req.body

//     const user = await userModel.find({email: email})
//     if(user)
//         return res.json({message: error.message})

//     try {
//         await bcrypt.genSalt(10, async (err, salt) => {
//             if(err) return res.json(err.message)
//             else{
//                 await bcrypt.hash(password, salt, async (err, hash) =>{
//                     const user = await userModel.create({
//                         fullname,
//                         email, password
//                     })
//                 })
        
//             }

//         })


        
//     } catch (error) {
//         return res.json({message: error})
//     }
// }