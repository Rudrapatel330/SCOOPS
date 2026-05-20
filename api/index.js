const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent payload too large attacks

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again later.' }
});

app.use('/api/', limiter);

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const orderValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('phone').trim().isMobilePhone(),
  body('address').trim().isLength({ min: 5, max: 255 }).escape().withMessage('Address must be between 5 and 255 characters.'),
  body('items').isArray().withMessage('Items must be an array.'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Total price must be a positive number.')
];

// Login Endpoint (Handles both Admin & Users)
app.post('/api/login', async (req, res) => {
  const { name, email, phone } = req.body;

  // 1. Admin Detection
  if (email === 'rudraptl@gmail.com' && phone === '26112008@Rudra') {
    return res.json({ action: 'requires_mfa' });
  }

  // 2. Regular User Validation
  if (!name || name.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
  if (!phone || phone.length < 7) return res.status(400).json({ error: 'Invalid phone number.' });

  try {
    // Attempt to upsert with email
    let { data, error } = await supabase
      .from('users')
      .upsert([{ name, email: email || null, phone }], { onConflict: 'phone' })
      .select();

    // If it fails (likely because 'email' column doesn't exist yet), fallback to name/phone
    if (error && error.message.includes('email')) {
      const fallback = await supabase
        .from('users')
        .upsert([{ name, phone }], { onConflict: 'phone' })
        .select();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    res.json({ message: 'Login successful', user: data[0] });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// Order Checkout Endpoint
app.post('/api/orders', orderValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, phone, address, items, totalPrice } = req.body;

  try {
    // Ensure user exists or create
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([{ name, phone }], { onConflict: 'phone' })
      .select();

    if (userError) throw userError;

    // Insert order into Supabase orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: userData[0].id,
        name,
        phone,
        address,
        items,
        total_price: totalPrice,
        created_at: new Date().toISOString()
      }]);

    if (orderError) throw orderError;

    res.status(201).json({ message: 'Order created successfully!' });
  } catch (error) {
    console.error('Order error:', error);
    res.status(500).json({ error: 'Internal server error while creating order.' });
  }
});

// Delete Account Endpoint
app.delete('/api/account', [body('phone').trim().isMobilePhone()], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone } = req.body;

  try {
    // Find user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Delete orders first
    await supabase.from('orders').delete().eq('user_id', user.id);

    // Delete user
    const { error: deleteError } = await supabase.from('users').delete().eq('id', user.id);
    if (deleteError) throw deleteError;

    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error during account deletion.' });
  }
});

// Get Order History Endpoint
app.get('/api/orders', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    res.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error fetching orders.' });
  }
});

// Delete Single Order Endpoint
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { phone } = req.body;

  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', id)
      .single();

    if (orderError || !order || order.user_id !== user.id) {
      return res.status(403).json({ error: 'Unauthorized or order not found.' });
    }

    const { error: deleteError } = await supabase.from('orders').delete().eq('id', id);
    if (deleteError) throw deleteError;

    res.json({ message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: 'Internal server error deleting order.' });
  }
});

// ===== ADMIN SECURITY & ROUTES =====

// Helper to get time in IST (HHMM format)
const getISTTimeCode = (offsetMinutes = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + offsetMinutes);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const parts = formatter.formatToParts(d);
  const h = parts.find(p => p.type === 'hour').value;
  const m = parts.find(p => p.type === 'minute').value;
  return `${h}${m}`;
};

// Admin MFA Verification Endpoint
app.post('/api/admin/verify_mfa', async (req, res) => {
  const { code } = req.body;

  // Secure Time-based Code Verification (allows +/- 1 minute drift)
  const currentCode = getISTTimeCode(0);
  const prevCode = getISTTimeCode(-1);
  const nextCode = getISTTimeCode(1);

  if (code !== currentCode && code !== prevCode && code !== nextCode) {
    return res.status(401).json({ error: 'Invalid secure time code' });
  }

  // Generate secure session token derived from Supabase Secret
  const adminToken = crypto.createHmac('sha256', process.env.SUPABASE_KEY || 'fallback_secret')
                           .update('admin_session_auth')
                           .digest('hex');

  res.json({ token: adminToken });
});

// Admin Authentication Middleware
const adminAuthMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedToken = crypto.createHmac('sha256', process.env.SUPABASE_KEY || 'fallback_secret')
                              .update('admin_session_auth')
                              .digest('hex');

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized admin access' });
  }
  next();
};

// Get ALL Orders for Admin
app.get('/api/admin/orders', adminAuthMiddleware, async (req, res) => {
  try {
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    res.json({ orders });
  } catch (error) {
    console.error('Admin fetch orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
