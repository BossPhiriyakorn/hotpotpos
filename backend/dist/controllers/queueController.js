import pool from '../config/database.js';
// Get ready orders (for queue display)
export const getReadyOrders = async (req, res) => {
    try {
        const user = req.user;
        // For Queue users, MUST have branch_id
        let branchId = null;
        if (!user) {
            console.warn('[Queue Ready] ⚠️ No user found in request');
            return res.json({ success: true, data: [] });
        }
        // Admin should not access Queue (CMS เท่านั้น) -> return empty
        if (user.userType === 'admin') {
            console.warn('[Queue Ready] Admin user should not access queue endpoint. Returning empty.');
            return res.json({ success: true, data: [] });
        }
        else {
            // Non-admin users MUST have branch_id
            // Query database to get current branch_id (always fresh from DB)
            const userResult = await pool.query('SELECT id, username, branch_id FROM users WHERE id = $1 AND is_active = true', [user.id]);
            if (userResult.rows.length === 0) {
                console.warn(`[Queue Ready] User ${user.id} not found in database`);
                return res.json({ success: true, data: [] });
            }
            const dbUser = userResult.rows[0];
            branchId = dbUser.branch_id;
            // If user has no branch_id, return empty array
            if (!branchId) {
                console.warn(`[Queue Ready] User ${dbUser.username} (ID: ${dbUser.id}) has no branch_id assigned`);
                return res.json({
                    success: true,
                    data: [],
                    message: 'User has no branch assigned. Please contact administrator.'
                });
            }
            // Log branch info (only once per user session)
            console.log(`[Queue Ready] ${dbUser.username} (ID: ${dbUser.id}) → Branch ID: ${branchId}`);
        }
        let query = `
      SELECT 
        o.id,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style,
        o.branch_id
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT status, changed_at
        FROM kitchen_order_status
        WHERE order_id = o.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) kos ON true
      WHERE kos.status = 'done'
        AND o.order_status IN ('ready', 'preparing')
        AND kos.changed_at >= CURRENT_DATE
    `;
        const params = [];
        let paramCount = 1;
        // Filter by branch_id if user is not admin
        if (branchId !== null) {
            query += ` AND o.branch_id = $${paramCount}`;
            params.push(branchId);
            paramCount++;
        }
        query += ` ORDER BY o.queue_number ASC`;
        const result = await pool.query(query, params);
        // DEBUG: Log results only if there are orders or if branch mismatch detected
        if (result.rows.length > 0) {
            const branchIds = [...new Set(result.rows.map(o => o.branch_id))];
            if (branchId !== null && (branchIds.length > 1 || branchIds[0] !== branchId)) {
                console.warn(`[Queue Ready] ⚠️ Branch mismatch! Expected: ${branchId}, Found: ${branchIds.join(', ')}`);
                console.warn(`[Queue Ready] Orders:`, result.rows.map(o => ({ queue: o.queue_number, branch_id: o.branch_id })));
            }
        }
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Queue Ready Orders Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get in-progress orders (for queue display)
export const getInProgressOrders = async (req, res) => {
    try {
        const user = req.user;
        // For Queue users, MUST have branch_id
        let branchId = null;
        if (!user) {
            console.warn('[Queue In-Progress] ⚠️ No user found in request');
            return res.json({ success: true, data: [] });
        }
        // Admin should not access Queue (CMS เท่านั้น) -> return empty
        if (user.userType === 'admin') {
            console.warn('[Queue In-Progress] Admin user should not access queue endpoint. Returning empty.');
            return res.json({ success: true, data: [] });
        }
        else {
            // Non-admin users MUST have branch_id
            // Query database to get current branch_id (always fresh from DB)
            const userResult = await pool.query('SELECT id, username, branch_id FROM users WHERE id = $1 AND is_active = true', [user.id]);
            if (userResult.rows.length === 0) {
                console.warn(`[Queue In-Progress] User ${user.id} not found in database`);
                return res.json({ success: true, data: [] });
            }
            const dbUser = userResult.rows[0];
            branchId = dbUser.branch_id;
            // If user has no branch_id, return empty array
            if (!branchId) {
                console.warn(`[Queue In-Progress] User ${dbUser.username} (ID: ${dbUser.id}) has no branch_id assigned`);
                return res.json({
                    success: true,
                    data: [],
                    message: 'User has no branch assigned. Please contact administrator.'
                });
            }
            // Log branch info (only once per user session)
            console.log(`[Queue In-Progress] ${dbUser.username} (ID: ${dbUser.id}) → Branch ID: ${branchId}`);
        }
        let query = `
      SELECT 
        o.id,
        o.queue_number,
        o.dining_location,
        o.table_number,
        o.cooking_style,
        o.branch_id
      FROM orders o
      LEFT JOIN LATERAL (
        SELECT status, changed_at
        FROM kitchen_order_status
        WHERE order_id = o.id
        ORDER BY changed_at DESC
        LIMIT 1
      ) kos ON true
      WHERE kos.status = 'in-progress'
        AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
        AND kos.changed_at >= CURRENT_DATE
    `;
        const params = [];
        let paramCount = 1;
        // Filter by branch_id if user is not admin
        if (branchId !== null) {
            query += ` AND o.branch_id = $${paramCount}`;
            params.push(branchId);
            paramCount++;
        }
        query += ` ORDER BY o.queue_number ASC`;
        const result = await pool.query(query, params);
        // DEBUG: Log results only if there are orders or if branch mismatch detected
        if (result.rows.length > 0) {
            const branchIds = [...new Set(result.rows.map(o => o.branch_id))];
            if (branchId !== null && (branchIds.length > 1 || branchIds[0] !== branchId)) {
                console.warn(`[Queue In-Progress] ⚠️ Branch mismatch! Expected: ${branchId}, Found: ${branchIds.join(', ')}`);
                console.warn(`[Queue In-Progress] Orders:`, result.rows.map(o => ({ queue: o.queue_number, branch_id: o.branch_id })));
            }
        }
        res.json({ success: true, data: result.rows });
    }
    catch (error) {
        console.error('Queue In-Progress Orders Error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get order by queue number
export const getOrderByQueueNumber = async (req, res) => {
    try {
        const { queueNumber } = req.params;
        const result = await pool.query(`SELECT 
        o.*,
        s.name AS soup_name,
        sl.name AS spice_level_name
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN spice_levels sl ON o.spice_level_id = sl.id
      WHERE o.queue_number = $1
        AND o.created_at >= CURRENT_DATE
      ORDER BY o.created_at DESC
      LIMIT 1`, [queueNumber]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Order not found for this queue number',
            });
        }
        res.json({ success: true, data: result.rows[0] });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=queueController.js.map