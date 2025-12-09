import { Request, Response } from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    // Get user from database
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND is_active = true',
      [username]
    );

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

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        userType: user.user_type,
      },
      secret,
      { expiresIn: '24h' }
    );

    // Log activity
    const userAgent = req.headers['user-agent'] || null;
    const details = JSON.stringify({ username: user.username });
    const ipAddress = req.ip || req.socket.remoteAddress || null;

    await pool.query(
      `INSERT INTO activity_logs (user_type, user_id, action, status, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.user_type,
        user.id,
        'login',
        'success',
        ipAddress,
        userAgent,
        details,
      ]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          userType: user.user_type,
        },
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get current user
export const getCurrentUser = async (req: any, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    const result = await pool.query('SELECT id, username, user_type, is_active FROM users WHERE id = $1', [
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

