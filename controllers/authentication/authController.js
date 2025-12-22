import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/user.js';
import UserProfile from '../../models/userprofile.js';
import {authenticateToken} from '../../middleware/authMiddleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate user ID
const generateUserId = () => {
  return 'USER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};








const validatePhoneNumber = (phoneNumber) => {
  // Remove all non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits (without country code)
  if (digitsOnly.length === 10) {
    return {
      isValid: true,
      formattedNumber: digitsOnly,
      countryCode: '+91' // Default to India, you can modify this
    };
  }
  
  // Check if it has country code + 10 digits (e.g., +911234567890)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return {
      isValid: true,
      formattedNumber: digitsOnly.slice(2), // Remove country code
      countryCode: '+91'
    };
  }
  
  // Check for other country codes (e.g., +1 1234567890)
  if (digitsOnly.length > 10) {
    // This is a simple check - you might want more sophisticated validation
    const countryCode = '+' + digitsOnly.slice(0, digitsOnly.length - 10);
    const localNumber = digitsOnly.slice(digitsOnly.length - 10);
    
    if (localNumber.length === 10) {
      return {
        isValid: true,
        formattedNumber: localNumber,
        countryCode: countryCode
      };
    }
  }
  
  return {
    isValid: false,
    formattedNumber: null,
    countryCode: null
  };
};









// User Registration
export const signup = async (req, res) => {
  try {
    const { name, email, contactNo, age, password, userType, selectedModes } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }



    // Validate and format phone number
    if (contactNo) {
      const phoneValidation = validatePhoneNumber(contactNo);
      if (!phoneValidation.isValid) {
        return res.status(400).json({ 
          error: 'Invalid phone number. Please provide a valid 10-digit phone number with or without country code.' 
        });
      }
    }


    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      name,
      email,
      contactNo,
      age,
      password: hashedPassword,
      userType: userType || 'client'
    });
    await user.save();

    // Create user profile
    const userProfile = new UserProfile({
      userId: user._id,
      modes: selectedModes || {
        military: false,
        disaster: false,
        delivery: false,
        surveillance: false,
        agricultural: false,
        recreational: false
      },
      subscription: {
        duration: 1,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        isActive: true
      },
      userType: userType || 'client'
    });
    await userProfile.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// User Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        userType: user.userType 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    console.log("📩 Incoming GET /api/getprofile");
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify and decode the token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    // Extract user info from token
    const { userId, email } = decoded;
    console.log("Decoded Token Info:", decoded);
    if (!userId || !email) {
      return res.status(403).json({ error: 'Invalid token payload' });
    }

    // Find user by userId from token
    const user = await User.findById(userId).select('-password');

    console.log("Fetched User:", user);
    const userProfile = await UserProfile.findOne({ userId });
    console.log("Fetched UserProfile:", userProfile);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify that the email in token matches the user's email
    if (user.email !== email) {
      return res.status(403).json({ error: 'Token email mismatch' });
    }

    res.json({
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        contactNo: user.contactNo,
        age: user.age,
        userType: user.userType,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      profile: userProfile
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// verifytoken function for testing
// export const verifyToken = async (req, res) => {
//   try {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
//     if (!token) {
//       return res.status(401).json({ error: 'Access tokenrequired' });
//     }

//     jwt.verify(token, JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.status(403).json({ error: 'Invalid or expired token' });
//       }
//       res.json({ message: 'Token is valid', user });
//     });
//     } catch (error) {
//         console.error('Token verification error:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// }



export const verifyToken = authenticateToken;