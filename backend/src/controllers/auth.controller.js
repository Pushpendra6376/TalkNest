import User from "../models/user.model";

export const register = (req, res) => {
    const {fullName, email, password} = req.body;

    try {
        
    } catch (error) {
        
    }

}

export const login = (req, res) => {
    
}

export const logout = (req, res) => {
    
}

export default {register, login, logout};