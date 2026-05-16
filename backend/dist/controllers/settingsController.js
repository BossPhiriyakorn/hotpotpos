import pool from '../config/database.js';
import { isValidImageReference } from '../utils/imageReference.js';
// Get all settings
export const getSettings = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM settings ORDER BY category, key');
        // Convert to key-value object
        const settings = {};
        result.rows.forEach((row) => {
            // Convert value based on data_type
            let value = row.value;
            if (row.data_type === 'number') {
                value = parseFloat(row.value);
            }
            else if (row.data_type === 'boolean') {
                value = row.value === 'true';
            }
            else if (row.data_type === 'json') {
                try {
                    value = JSON.parse(row.value);
                }
                catch {
                    value = row.value;
                }
            }
            settings[row.key] = value;
        });
        res.json({ success: true, data: settings });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get setting by key
export const getSettingByKey = async (req, res) => {
    try {
        const { key } = req.params;
        const result = await pool.query('SELECT * FROM settings WHERE key = $1', [key]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Setting not found' });
        }
        const row = result.rows[0];
        let value = row.value;
        // Convert value based on data_type
        if (row.data_type === 'number') {
            value = parseFloat(row.value);
        }
        else if (row.data_type === 'boolean') {
            value = row.value === 'true';
        }
        else if (row.data_type === 'json') {
            try {
                value = JSON.parse(row.value);
            }
            catch {
                value = row.value;
            }
        }
        res.json({ success: true, data: { ...row, value } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Update setting (upsert - create if doesn't exist)
export const updateSetting = async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description, category, data_type } = req.body;
        // Validate key
        if (!key || key.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Setting key is required',
            });
        }
        // Validate value for image settings (logo, QR codes): data URL, https, หรือ gdrive:FILE_ID
        if ((key === 'logo' || key === 'member_qr_code' || key === 'payment_qr_code') && value) {
            if (typeof value !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Image value must be a string',
                });
            }
            if (!isValidImageReference(value)) {
                return res.status(400).json({
                    success: false,
                    error: 'Image must be a data URL, https URL, or gdrive:FILE_ID',
                });
            }
            if (value.startsWith('data:image/') && value.length > 15 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    error: 'Image is too large. Maximum size is 10MB',
                });
            }
        }
        // Convert value to string
        let stringValue = value;
        if (typeof value === 'object' && value !== null) {
            stringValue = JSON.stringify(value);
        }
        else if (value === null || value === undefined) {
            stringValue = '';
        }
        else {
            stringValue = String(value);
        }
        // Try to update first
        const updateResult = await pool.query(`UPDATE settings 
       SET value = COALESCE($1, value),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           data_type = COALESCE($4, data_type),
           updated_at = CURRENT_TIMESTAMP
       WHERE key = $5
       RETURNING *`, [stringValue, description, category, data_type, key]);
        // If setting doesn't exist, create it
        if (updateResult.rows.length === 0) {
            // Determine default category and data_type based on key
            let defaultCategory = category || 'general';
            let defaultDataType = data_type || 'text';
            let defaultDescription = description || '';
            // Set defaults based on key patterns
            if (key.includes('logo') || key.includes('qr') || key.includes('image')) {
                defaultCategory = 'shop';
                defaultDataType = 'text';
                defaultDescription = defaultDescription || `Shop ${key.replace(/_/g, ' ')}`;
            }
            else if (key.includes('welcome') || key.includes('title') || key.includes('subtitle')) {
                defaultCategory = 'layout';
                defaultDataType = 'text';
                defaultDescription = defaultDescription || `Layout ${key.replace(/_/g, ' ')}`;
            }
            else if (key.includes('grid') || key.includes('show_')) {
                defaultCategory = 'layout';
                defaultDataType = 'boolean';
                defaultDescription = defaultDescription || `Layout ${key.replace(/_/g, ' ')}`;
            }
            const insertResult = await pool.query(`INSERT INTO settings (key, value, description, category, data_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [key, stringValue, defaultDescription, defaultCategory, defaultDataType]);
            res.json({ success: true, data: insertResult.rows[0] });
        }
        else {
            res.json({ success: true, data: updateResult.rows[0] });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Get price per 100g
export const getPricePer100g = async (req, res) => {
    try {
        const result = await pool.query("SELECT value FROM settings WHERE key = 'price_per_100g'");
        if (result.rows.length === 0) {
            return res.json({ success: true, data: { pricePer100g: 29 } }); // Default
        }
        res.json({
            success: true,
            data: { pricePer100g: parseFloat(result.rows[0].value) },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// Update price per 100g
export const updatePricePer100g = async (req, res) => {
    try {
        const { pricePer100g } = req.body;
        const result = await pool.query(`UPDATE settings 
       SET value = $1, updated_at = CURRENT_TIMESTAMP
       WHERE key = 'price_per_100g'
       RETURNING *`, [String(pricePer100g)]);
        if (result.rows.length === 0) {
            // Create if doesn't exist
            await pool.query(`INSERT INTO settings (key, value, description, category, data_type)
         VALUES ('price_per_100g', $1, 'ราคาต่อ 100 กรัม', 'pricing', 'number')
         RETURNING *`, [String(pricePer100g)]);
        }
        res.json({ success: true, data: { pricePer100g } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
//# sourceMappingURL=settingsController.js.map