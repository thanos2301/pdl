import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { auth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Sign In
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Error signing in' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: req.userId
      }
    });
    
    if (!profile) {
      return res.json({
        name: '',
        gender: '',
        dob: null,
        country: '',
        height: null,
        weight: null
      });
    }
    
    res.json(profile);
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, gender, dob, country, height, weight } = req.body;

    // Validate required fields
    if (!name || !gender || !dob || !country || !height || !weight) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate height and weight
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (heightNum < 1 || heightNum > 300) {
      return res.status(400).json({ error: 'Height must be between 1 and 300 cm' });
    }

    if (weightNum < 1 || weightNum > 500) {
      return res.status(400).json({ error: 'Weight must be between 1 and 500 kg' });
    }

    // Update or create profile using upsert
    const profile = await prisma.profile.upsert({
      where: {
        userId: req.userId
      },
      update: {
        name,
        gender,
        dob: new Date(dob),
        country,
        height: heightNum,
        weight: weightNum,
      },
      create: {
        userId: req.userId,
        name,
        gender,
        dob: new Date(dob),
        country,
        height: heightNum,
        weight: weightNum,
      }
    });

    res.json(profile);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Error updating profile' });
  }
});

export default router; 