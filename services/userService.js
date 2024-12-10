const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const sequelize = require('../util/database');
const JWT_SECRET = "Nethra";

console.log(JWT_SECRET);

function generateAccessToken(id) {
    return jwt.sign({ userId: id }, JWT_SECRET);
}


exports.createUser = async (req) => {
    const { username, email, password } = req.body;

    
    const t = await sequelize.transaction();

    try {
        
        const existingUser = await User.findOne({ where: { email }, transaction: t });
        if (existingUser) {
            await t.rollback(); 
            throw new Error('User already exists.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create(
            { username, email, password: hashedPassword },
            { transaction: t }
        );

        await t.commit(); 
        return newUser;
    } catch (error) {
        if (!t.finished) await t.rollback(); 
        throw error; 
    }
};

exports.loginUser = async (email, password) => {
    console.log(`loginUser called with email: ${email}`);
    const user = await User.findOne({ where: { email } });
    if (!user) {
        console.error('User not found');
        throw new Error('User not found');
    }

    console.log('Comparing passwords...');
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
        console.error('Incorrect password');
        throw new Error('Incorrect password');
    }

    console.log('Generating token...');
    const token = generateAccessToken(user.id);
    console.log('Generated token:', token);
    return { token, user };
};
