const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { seedWelcomeInventory } = require('../utils/welcomeInventory');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, accountType, phone } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const role =
      accountType === 'store_owner' ? 'store_owner' : 'customer';
    const phoneClean = typeof phone === 'string' ? phone.trim() : '';
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone: phoneClean || undefined,
    });
    try {
      await seedWelcomeInventory(user._id);
    } catch (e) {
      console.error('Welcome inventory seed failed:', e.message);
    }
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (phone !== undefined) {
      user.phone = typeof phone === 'string' ? phone.trim() : '';
    }
    await user.save();
    const fresh = await User.findById(user._id).select('-password');
    res.json(fresh);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};