const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Import models
const User = require('./models/user');
const { authenticateToken } = require('./middleware/auth');

// Import routes
const paymentRoutes = require('./routes/payment');
const bookRoutes = require('./routes/books');
const reviewRoutes = require('./routes/reviews');
const userBookRoutes = require('./routes/userbooks');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/novelle';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10
})
.then(() => console.log('✓ MongoDB Connected Successfully'))
.catch(err => console.error('✗ MongoDB Connection Error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-novelle-2025'; // FIXED: Consistent default

// Helper Functions
function validateBase64Image(base64String) {
    if (!base64String) {
        return { valid: true, data: '' };
    }

    if (!base64String.startsWith('data:image/')) {
        return { valid: false, error: 'Invalid image format' };
    }
    
    const base64Data = base64String.split(',')[1] || '';
    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    console.log(`Image size: ${sizeInMB.toFixed(2)}MB`);
    
    if (sizeInMB > 10) {
        return { 
            valid: false, 
            error: `Image too large (${sizeInMB.toFixed(2)}MB). Please use an image smaller than 10MB.` 
        };
    }
    
    return { valid: true, data: base64String, size: sizeInMB };
}

// Routes

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        message: 'Novelle API is running', 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/payment', paymentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/user-books', userBookRoutes);

// Register Route - FIXED: Simplified payload, consistent secret
app.post('/api/auth/register', async (req, res) => {
    try {
        const { fullname, email, username, password, rating } = req.body;

        if (!fullname || !email || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide all required fields' 
            });
        }

        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });

        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email or username already exists' 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            fullname,
            email,
            username,
            password: hashedPassword,
            rating: rating || 0
        });

        await newUser.save();

        // FIXED: Sign ONLY with { userId } to match auth.js
        const token = jwt.sign(
            { userId: newUser._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                username: newUser.username,
                rating: newUser.rating,
                bio: newUser.bio,
                profilePicture: newUser.profilePicture,
                headerImage: newUser.headerImage,
                isPremium: newUser.isPremium,
                subscriptionEndDate: newUser.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

// Login Route - FIXED: Simplified payload, consistent secret
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check if subscription has expired
        if (user.isPremium && user.subscriptionEndDate < new Date()) {
            user.isPremium = false;
            user.subscriptionStatus = 'expired';
            await user.save();
        }

        // FIXED: Sign ONLY with { userId } to match auth.js
        const token = jwt.sign(
            { userId: user._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                rating: user.rating,
                bio: user.bio || '',
                profilePicture: user.profilePicture || '',
                headerImage: user.headerImage || '',
                isPremium: user.isPremium,
                subscriptionEndDate: user.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if subscription has expired
        if (user.isPremium && user.subscriptionEndDate < new Date()) {
            user.isPremium = false;
            user.subscriptionStatus = 'expired';
            await user.save();
        }

        res.status(200).json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Update User Profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        console.log('=== Profile Update Request ===');
        const { bio, profilePicture, headerImage } = req.body;

        const user = await User.findById(req.userId);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        if (bio !== undefined) {
            if (bio.length > 5000) {
                return res.status(400).json({
                    success: false,
                    message: 'Bio is too long (max 5000 characters)'
                });
            }
            user.bio = bio;
            console.log('✓ Bio updated');
        }

        if (profilePicture !== undefined && profilePicture !== user.profilePicture) {
            console.log('Validating profile picture...');
            const validation = validateBase64Image(profilePicture);
            
            if (!validation.valid) {
                console.error('✗ Profile picture validation failed:', validation.error);
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }
            
            user.profilePicture = profilePicture;
            console.log(`✓ Profile picture updated (${validation.size?.toFixed(2)}MB)`);
        }

        if (headerImage !== undefined && headerImage !== user.headerImage) {
            console.log('Validating header image...');
            const validation = validateBase64Image(headerImage);
            
            if (!validation.valid) {
                console.error('✗ Header image validation failed:', validation.error);
                return res.status(400).json({
                    success: false,
                    message: validation.error
                });
            }
            
            user.headerImage = headerImage;
            console.log(`✓ Header image updated (${validation.size?.toFixed(2)}MB)`);
        }

        const docSize = JSON.stringify(user.toObject()).length / (1024 * 1024);
        console.log(`Total document size: ${docSize.toFixed(2)}MB`);

        if (docSize > 15) {
            return res.status(400).json({
                success: false,
                message: 'Total profile data is too large. Please use smaller images.'
            });
        }

        console.log('Saving to MongoDB...');
        await user.save();
        console.log('✓ Profile saved successfully');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                rating: user.rating,
                bio: user.bio,
                profilePicture: user.profilePicture,
                headerImage: user.headerImage,
                isPremium: user.isPremium,
                subscriptionEndDate: user.subscriptionEndDate
            }
        });

    } catch (error) {
        console.error('✗ Profile update error:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Duplicate entry error' 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error: ' + error.message 
            });
        }

        if (error.message && error.message.includes('document')) {
            return res.status(400).json({
                success: false,
                message: 'Images are too large. Please use smaller images (under 3MB each).'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Server error while updating profile. Please try again.' 
        });
    }
});

// Get All Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password -profilePicture -headerImage');
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log('=================================');
    console.log(`✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ MongoDB URI: ${MONGODB_URI}`);
    console.log('✓ Max request size: 50MB');
    console.log('✓ CORS enabled for: http://localhost:3000');
    console.log('✓ Razorpay Integration: Active');
    console.log('✓ Google Books API: Active');
    console.log('=================================');
});