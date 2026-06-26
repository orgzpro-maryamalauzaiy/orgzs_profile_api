import supabase from "../configs/supabase.js"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

const ROLE_ID = process.env.DEFAULT_CUSTOMER_ROLE_ID

export const login = async (req, res) => {
    try {
        const { username, password } = req.body

        const { data: orgz_users, error } = await supabase.from('orgz_users')
                                .select('*, orgz_identities (orgz_name)')
                                .eq('email', username)
                                .eq('is_active', true)
                                .single()
                                // .eq('password', hashed_password)
        console.log('orgz_users', orgz_users)
        if(!orgz_users){
            return res.status(400).json({status: '01', message: 'User not found'})
        }

        const is_match = await bcrypt.compare(password, orgz_users.hashed_password)

        if(!is_match){
            return res.status(400).json({status: '01', message: 'email or password wrong!'})
        }

        const JWT_SECRET = process.env.JWT_SECRET
        const token = jwt.sign({email: orgz_users.email, orgz_id: orgz_users.orgz_id}, JWT_SECRET, { expiresIn: '24h' })

        res.cookie('token', token, {
            httpOnly: true,
            secure: true
        })

        res.status(200).json({status: "00", message: 'Successfully logged in!', data: {username: orgz_users.email, full_name: orgz_users.full_name, orgz_id: orgz_users.orgz_id, orgz_name: orgz_users.orgz_identities.orgz_name, token}})

    } catch (error) {
        res.status(500).json({status: '01', message: 'Failed log in: ' + error})
    }

}

export const register = async (req, res) => {
    console.log(req.body, req.header)
    try {
        const { email, password, type } = req.body

        const salt = bcrypt.genSalt(10)
        const hashed_password = bcrypt.hash(password, salt)

        const { data, error } = await supabase.from('orgz_users')
                                .select('*')
                                .eq('email', email)
                                .eq('is_active', true)
                                .single()
                                // .eq('password', hashed_password)
        if(data){
            return res.json({status: '01', message: 'email not available.'})
        }

        const { user, user_err } = await supabase.auth.signUp({
            email: email,
            password: hashed_password,
        })

        if(err){
            return res.json({status: '01', message: 'Failed to register.'})
        }

        const { users, users_err } = await supabase
                                .from('users')
                                .insert([
                                    { email: email, role_id: ROLE_ID, picture: AVATAR_MALE },
                                ])
                                .select().single()
        if(error){
            return res.json({status: '01', message: 'Failed to register.'})
        }

        const { data: orgz_users, orgz_users_error } = await supabase
                                .from('orgz_users')
                                .insert([
                                    { orgz_id:  req.header.orgz_id,
                                        user_id: users.id,
                                        is_active: true,
                                        hashed_password: hashed_password,
                                        phone_number: phoner_number,
                                        job: job,
                                        avatar: AVATAR_MALE,
                                        full_name: full_name
                                    },
                                ])
                                .select()

        if(orgz_users_error){
            return res.json({status: '01', message: 'Failed to register.'})
        }

        res.json({status: "00", message: 'Successfully register!'})

    } catch (error) {
        res.json({status: '01', message: 'Failed to register.'})
    }

}

export const logout = (req, res) => {

    try {

        return res.clearCookie('token').json({status: '00', message: 'Logout successfully'})

    } catch (error) {
        return res.status(400).json({status: '01', message: 'Failed to logout'})
    }
}


// module.exports = {login, register, logout}


// module.exports = {login, register}