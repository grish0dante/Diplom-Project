const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The user's username
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email
 *         password:
 *           type: string
 *           format: password
 *           description: The user's password
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT token for authentication
 *         user:
 *           type: object
 *           properties:
 *             username:
 *               type: string
 *             email:
 *               type: string
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email or username already exists
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  console.log('Registration attempt:', { email: req.body.email, username: req.body.username });
  try {
    const { username, email, password } = req.body;

    // Перевірка, чи існує користувач
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      console.log('Registration failed: Email already exists');
      return res.status(400).json({ message: 'Email already registered' });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log('Registration failed: Username already taken');
      return res.status(400).json({ message: 'Username already taken' });
    }

    // Зашифрувати пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створити нового користувача
    const newUser = new User({ 
      username, 
      email, 
      password: hashedPassword 
    });

    await newUser.save();
    console.log('User registered successfully:', { userId: newUser._id, username: newUser.username });
    
    // Створити токен
    const token = jwt.sign(
      { userId: newUser._id }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '1h' }
    );

    // Повернення успіху з токеном і даними користувача
    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        username: newUser.username,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      // Обробка помилки повторюваного ключа
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `This ${field} is already registered` 
      });
    }
    res.status(500).json({ message: 'Server error during registration' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  console.log('Login attempt:', { email: req.body.email });
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Login failed: Invalid password');
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    console.log('Login successful:', { userId: user._id, username: user.username });

    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'secret_key', 
      { expiresIn: '1h' }
    );

    res.json({ 
      token, 
      user: { 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Verify user token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/verify', auth, async (req, res) => {
  console.log('Token verification attempt:', { userId: req.user.userId });
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      console.log('Token verification failed: User not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Token verification successful:', { userId: user._id, username: user.username });
    res.json({ user });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
