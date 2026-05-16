import pool from '../config/database.js';
import bcrypt from 'bcrypt';
// Get all users
export const getUsers = async (req, res) => {
    try {
        const { includeInactive } = req.query;
        let query = `
      SELECT u.id, u.username, u.user_type, u.is_active, u.branch_id,
              b.name as branch_name, b.code as branch_code
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
    `;
        if (includeInactive !== 'true') {
            query += ' WHERE u.is_active = true';
        }
        query += ' ORDER BY u.created_at DESC';
        const result = await pool.query(query);
        res.json({
            success: true,
            data: result.rows,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`SELECT u.id, u.username, u.user_type, u.is_active, u.branch_id,
              b.name as branch_name, b.code as branch_code
       FROM users u
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`, [id]);
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
    }
    catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Create user
export const createUser = async (req, res) => {
    try {
        const { username, password, user_type, branch_id, is_active } = req.body;
        // Validation
        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Username is required',
            });
        }
        if (!password || password.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Password is required',
            });
        }
        if (!user_type || !['admin', 'kiosk', 'kitchen', 'queue'].includes(user_type)) {
            return res.status(400).json({
                success: false,
                error: 'User type must be one of: admin, kiosk, kitchen, queue',
            });
        }
        // Check if username already exists (only active users)
        const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1 AND is_active = true', [username.trim()]);
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Username already exists',
            });
        }
        // Check if branch exists (if provided)
        if (branch_id) {
            const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1 AND is_active = true', [branch_id]);
            if (branchCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Branch not found or inactive',
                });
            }
        }
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const result = await pool.query(`INSERT INTO users (username, password_hash, user_type, branch_id, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, user_type, is_active, branch_id`, [
            username.trim(),
            passwordHash,
            user_type,
            branch_id || null,
            is_active !== undefined ? is_active : true,
        ]);
        // Get branch info
        if (result.rows[0].branch_id) {
            const branchResult = await pool.query('SELECT name, code FROM branches WHERE id = $1', [result.rows[0].branch_id]);
            if (branchResult.rows.length > 0) {
                result.rows[0].branch_name = branchResult.rows[0].name;
                result.rows[0].branch_code = branchResult.rows[0].code;
            }
        }
        res.status(201).json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, user_type, branch_id, is_active } = req.body;
        // Check if user exists
        const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Check if username already exists (excluding current user, only active users)
        if (username && username.trim() !== '') {
            const usernameCheck = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2 AND is_active = true', [username.trim(), id]);
            if (usernameCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already exists',
                });
            }
        }
        // Check if branch exists (if provided)
        if (branch_id) {
            const branchCheck = await pool.query('SELECT id FROM branches WHERE id = $1 AND is_active = true', [branch_id]);
            if (branchCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Branch not found or inactive',
                });
            }
        }
        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (username) {
            updates.push(`username = $${paramCount}`);
            params.push(username.trim());
            paramCount++;
        }
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            updates.push(`password_hash = $${paramCount}`);
            params.push(passwordHash);
            paramCount++;
        }
        if (user_type) {
            if (!['admin', 'kiosk', 'kitchen', 'queue'].includes(user_type)) {
                return res.status(400).json({
                    success: false,
                    error: 'User type must be one of: admin, kiosk, kitchen, queue',
                });
            }
            updates.push(`user_type = $${paramCount}`);
            params.push(user_type);
            paramCount++;
        }
        if (branch_id !== undefined) {
            updates.push(`branch_id = $${paramCount}`);
            params.push(branch_id || null);
            paramCount++;
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramCount}`);
            params.push(is_active);
            paramCount++;
        }
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update',
            });
        }
        params.push(id);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, user_type, is_active, branch_id`;
        const result = await pool.query(query, params);
        // Get branch info
        if (result.rows[0].branch_id) {
            const branchResult = await pool.query('SELECT name, code FROM branches WHERE id = $1', [result.rows[0].branch_id]);
            if (branchResult.rows.length > 0) {
                result.rows[0].branch_name = branchResult.rows[0].name;
                result.rows[0].branch_code = branchResult.rows[0].code;
            }
        }
        res.json({
            success: true,
            data: result.rows[0],
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Delete user (soft delete by setting is_active = false)
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if user exists
        const userCheck = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found',
            });
        }
        // Prevent deleting yourself
        const currentUser = req.user;
        if (currentUser && currentUser.id === parseInt(id)) {
            return res.status(400).json({
                success: false,
                error: 'Cannot delete your own account',
            });
        }
        // Soft delete: set is_active = false
        const result = await pool.query(`UPDATE users 
       SET is_active = false
       WHERE id = $1
       RETURNING id, username, is_active`, [id]);
        res.json({
            success: true,
            data: result.rows[0],
            message: 'User deactivated successfully',
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Generate random password
export const generatePassword = async (req, res) => {
    try {
        // Generate random password (12 characters: letters + numbers)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        res.json({
            success: true,
            data: { password },
        });
    }
    catch (error) {
        console.error('Generate password error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=userController.js.map