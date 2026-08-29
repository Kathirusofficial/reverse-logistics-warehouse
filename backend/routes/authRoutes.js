const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already taken' });

        const user = new User({ name, email, password, role: role || 'worker' });
        await user.save();
        res.status(201).json({ message: 'Registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
        
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            process.env.JWT_SECRET || "default_warehouse_secret_key",
            { expiresIn: '1d' }
        );

        res.json({ email: user.email, name: user.name, role: user.role, id: user._id, token });
    } catch (err) {
        res.status(500).json({ message: 'Login failed' });
    }
});

module.exports = router;

