import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = express.Router();

// SECURITY: JWT_SECRET must be set in environment
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('CRITICAL: JWT_SECRET environment variable is not set!');
    process.exit(1);
}
const JWT_EXPIRES_IN = '7d';

// Register
router.post('/register', async (req, res) => {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        // Check if user exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'An account with this email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, full_name, role, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role, status, created_at`,
            [email.toLowerCase().trim(), passwordHash, fullName.trim(), 'user', 'active']
        );

        const user = result.rows[0];

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Store session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await pool.query(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
                status: user.status,
                createdAt: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'An error occurred during registration' });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = result.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check status
        if (user.status !== 'active') {
            return res.status(403).json({ error: 'Your account has been suspended' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Store session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await pool.query(
            'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
                status: user.status,
                createdAt: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
    }
});

// Logout
router.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            await pool.query('DELETE FROM sessions WHERE token = $1', [token]);
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    res.json({ message: 'Logged out successfully' });
});

// Password validation function
const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 5) {
        errors.push('Password must be at least 5 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

// Change password
router.post('/change-password', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
        return res.status(400).json({ 
            error: 'Password does not meet requirements',
            details: validation.errors
        });
    }
    
    try {
        // Verify token and get user
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user with password hash
        const userResult = await pool.query(
            'SELECT id, password_hash FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({ error: 'New password must be different from current password' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);
        
        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPasswordHash, user.id]
        );
        
        // Invalidate all existing sessions (force re-login for security)
        await pool.query(
            'DELETE FROM sessions WHERE user_id = $1',
            [user.id]
        );
        
        // Audit log
        await pool.query(
            'INSERT INTO audit_logs (actor_id, action, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [user.id, 'password.changed', user.id, JSON.stringify({ changed_at: new Date().toISOString() }), req.ip]
        );
        
        res.json({ message: 'Password changed successfully. Please log in again.' });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Password change error:', error);
        res.status(500).json({ error: 'An error occurred while changing password' });
    }
});

// Get current user (verify token)
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // Check if session exists
        const session = await pool.query(
            'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (session.rows.length === 0) {
            return res.status(401).json({ error: 'Session expired' });
        }

        // Get user
        const result = await pool.query(
            'SELECT id, email, full_name, role, status, created_at FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.full_name,
                role: user.role,
                status: user.status,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

export default router;
