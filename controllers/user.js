const userService = require('../services/userService');

exports.postAddUsers = async (req, res) => {
    try {
        const newUser = await userService.createUser(req);
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ error: error.message });
    }
};

exports.postLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log('Received login request for email:', email);

    try {
        const { token, user } = await userService.loginUser(email, password);
        console.log('Login successful:', user);
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Error during login:', error.message);
        const statusCode = error.message === 'User not found' || error.message === 'Incorrect password' ? 401 : 500;
        res.status(statusCode).json({ error: error.message });
    }
};
