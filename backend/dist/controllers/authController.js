import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtExpSecondsNextBangkok1am } from '../utils/jwtExpiryBangkok.js';
// Login
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required',
            });
        }
        // Get user from database with branch information
        const result = await pool.query(`SELECT u.*, b.id as branch_id, b.name as branch_name, b.code as branch_code
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.username = $1 AND u.is_active = true`, [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password',
            });
        }
        const user = result.rows[0];
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid username or password',
            });
        }
        // Generate JWT token
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return res.status(500).json({
                success: false,
                error: 'JWT secret not configured',
            });
        }
        const exp = jwtExpSecondsNextBangkok1am();
        const token = jwt.sign({
            id: user.id,
            username: user.username,
            userType: user.user_type,
            exp,
        }, secret);
        // Log activity
        const userAgent = req.headers['user-agent'] || null;
        const details = JSON.stringify({ username: user.username });
        const ipAddress = req.ip || req.socket.remoteAddress || null;
        await pool.query(`INSERT INTO activity_logs (user_type, user_id, action, status, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
            user.user_type,
            user.id,
            'login',
            'success',
            ipAddress,
            userAgent,
            details,
        ]);
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    userType: user.user_type,
                    branchId: user.branch_id || null,
                    branchName: user.branch_name || null,
                    branchCode: user.branch_code || null,
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get current user
export const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Not authenticated',
            });
        }
        const result = await pool.query(`SELECT u.id, u.username, u.user_type, u.is_active, u.branch_id, 
              b.name as branch_name, b.code as branch_code
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`, [req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                id: row.id,
                username: row.username,
                userType: row.user_type,
                branchId: row.branch_id ?? null,
                branchName: row.branch_name ?? null,
                branchCode: row.branch_code ?? null,
                isActive: row.is_active,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=authController.js.map