const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-novelle-2025';

// Register
exports.register = async (req, res) => {
    try {
        const { fullname, username, email, password } = req.body;
        if (!fullname || !username || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields required' });
        }
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User exists' });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({ fullname, username, email, password: hashedPassword, isPremium: false });
        await newUser.save();
        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            success: true,
            user: { id: newUser._id, fullname, username, email, isPremium: false },
            token
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email/password required' });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ success: false, message: 'Wrong email/password' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(200).json({
            success: true,
            user: { id: user._id, fullname: user.fullname, username: user.username, email: user.email, isPremium: user.isPremium },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};