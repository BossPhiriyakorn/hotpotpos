import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get all addons
export const getAddons = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM addons WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get addon by ID
export const getAddonById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM addons WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Addon not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create addon
export const createAddon = async (req: Request, res: Response) => {
  try {
    const { name, price, image_url, description, is_special, sort_order, is_active } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Addon name is required',
      });
    }

    if (price === undefined || price === null || isNaN(parseFloat(price))) {
      return res.status(400).json({
        success: false,
        error: 'Valid price is required',
      });
    }

    const priceNum = parseFloat(price);
    if (priceNum < 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than or equal to 0',
      });
    }

    // Validate image_url if provided (should be base64 data URL)
    if (image_url && typeof image_url === 'string' && image_url.length > 0) {
      if (!image_url.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          error: 'Image must be a valid base64 data URL',
        });
      }
      // Check if base64 string is too large (max 10MB after compression)
      if (image_url.length > 15 * 1024 * 1024) { // ~15MB base64 = ~10MB actual
        return res.status(400).json({
          success: false,
          error: 'Image is too large. Maximum size is 10MB',
        });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO addons (name, price, image_url, description, is_special, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name.trim(), 
        priceNum, 
        image_url || null, 
        description ? description.trim() : null, 
        is_special || false, 
        sort_order || 0,
        is_active !== undefined ? is_active : true
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Addon with this name already exists',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update addon
export const updateAddon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, image_url, description, is_special, sort_order, is_active } = req.body;

    // Validate price if provided
    if (price !== undefined && price !== null) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Price must be a valid number greater than or equal to 0',
        });
      }
    }

    // Validate name if provided
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Addon name cannot be empty',
      });
    }

    // Validate image_url if provided
    if (image_url !== undefined && image_url !== null && image_url !== '') {
      if (typeof image_url !== 'string' || !image_url.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          error: 'Image must be a valid base64 data URL',
        });
      }
      if (image_url.length > 15 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Image is too large. Maximum size is 10MB',
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE addons 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           image_url = COALESCE($3, image_url),
           description = COALESCE($4, description),
           is_special = COALESCE($5, is_special),
           sort_order = COALESCE($6, sort_order),
           is_active = COALESCE($7, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name ? name.trim() : null, 
        price !== undefined ? parseFloat(price) : null, 
        image_url || null, 
        description ? description.trim() : null, 
        is_special, 
        sort_order, 
        is_active, 
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Addon not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete addon
export const deleteAddon = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid addon ID',
      });
    }

    // Check if addon exists and is not being used in orders
    const checkResult = await pool.query(
      'SELECT COUNT(*) as count FROM order_addons WHERE addon_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      // Soft delete instead of hard delete
      const result = await pool.query(
        'UPDATE addons SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Addon not found' });
      }
      
      return res.json({ success: true, message: 'Addon deactivated successfully (used in orders)' });
    }

    // Hard delete if not used
    const result = await pool.query('DELETE FROM addons WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Addon not found' });
    }
    
    res.json({ success: true, message: 'Addon deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all soups
export const getSoups = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM soups WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get soup by ID
export const getSoupById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM soups WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Soup not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create soup
export const createSoup = async (req: Request, res: Response) => {
  try {
    const { id, name, image_url, is_spicy, is_special, sort_order, is_active } = req.body;

    // Validation
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Soup ID is required',
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Soup name is required',
      });
    }

    if (!image_url || image_url.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Soup image URL is required',
      });
    }

    // Validate image_url format
    if (!image_url.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Image must be a valid base64 data URL',
      });
    }

    // Check image size
    if (image_url.length > 15 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image is too large. Maximum size is 10MB',
      });
    }
    
    const result = await pool.query(
      `INSERT INTO soups (id, name, image_url, is_spicy, is_special, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        id.trim(), 
        name.trim(), 
        image_url.trim(), 
        is_spicy || false, 
        is_special || false, 
        sort_order || 0,
        is_active !== undefined ? is_active : true
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Soup with this ID already exists',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update soup
export const updateSoup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, image_url, is_spicy, is_special, sort_order, is_active } = req.body;

    // Validate name if provided
    if (name !== undefined && (!name || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        error: 'Soup name cannot be empty',
      });
    }

    // Validate image_url if provided
    if (image_url !== undefined && image_url !== null && image_url !== '') {
      if (typeof image_url !== 'string' || !image_url.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          error: 'Image must be a valid base64 data URL',
        });
      }
      if (image_url.length > 15 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          error: 'Image is too large. Maximum size is 10MB',
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE soups 
       SET name = COALESCE($1, name),
           image_url = COALESCE($2, image_url),
           is_spicy = COALESCE($3, is_spicy),
           is_special = COALESCE($4, is_special),
           sort_order = COALESCE($5, sort_order),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [
        name ? name.trim() : null, 
        image_url ? image_url.trim() : null, 
        is_spicy, 
        is_special, 
        sort_order, 
        is_active, 
        id
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Soup not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete soup
export const deleteSoup = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid soup ID',
      });
    }

    // Check if soup is being used in orders
    const checkResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE soup_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      // Soft delete instead of hard delete
      const result = await pool.query(
        'UPDATE soups SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Soup not found' });
      }
      
      return res.json({ success: true, message: 'Soup deactivated successfully (used in orders)' });
    }

    // Hard delete if not used
    const result = await pool.query('DELETE FROM soups WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Soup not found' });
    }
    
    res.json({ success: true, message: 'Soup deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all spice levels
export const getSpiceLevels = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM spice_levels WHERE is_active = true ORDER BY sort_order'
    );
    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get spice level by ID
export const getSpiceLevelById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM spice_levels WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Spice level not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create spice level
export const createSpiceLevel = async (req: Request, res: Response) => {
  try {
    const { id, name, price, sort_order, is_active } = req.body;

    if (!id || !name) {
      return res.status(400).json({
        success: false,
        error: 'ID and name are required',
      });
    }
    
    // Calculate next sort_order (max + 1) to show new items at the end
    let finalSortOrder = sort_order;
    if (!sort_order || sort_order === 0) {
      const maxSortResult = await pool.query(
        'SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM spice_levels'
      );
      finalSortOrder = parseInt(maxSortResult.rows[0].max_sort) + 1;
    }
    
    const result = await pool.query(
      `INSERT INTO spice_levels (id, name, price, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        name,
        price || 0,
        finalSortOrder,
        is_active !== undefined ? is_active : true
      ]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        error: 'Spice level with this ID already exists',
      });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update spice level
export const updateSpiceLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, price, sort_order, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE spice_levels 
       SET name = COALESCE($1, name),
           price = COALESCE($2, price),
           sort_order = COALESCE($3, sort_order),
           is_active = COALESCE($4, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [name, price, sort_order, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Spice level not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete spice level
export const deleteSpiceLevel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Invalid spice level ID',
      });
    }

    // Check if spice level is being used in orders
    const checkResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE spice_level_id = $1',
      [id]
    );
    
    if (parseInt(checkResult.rows[0].count) > 0) {
      // Soft delete instead of hard delete
      const result = await pool.query(
        'UPDATE spice_levels SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Spice level not found' });
      }
      
      return res.json({ success: true, message: 'Spice level deactivated successfully (used in orders)' });
    }

    // Hard delete if not used
    const result = await pool.query('DELETE FROM spice_levels WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Spice level not found' });
    }
    
    res.json({ success: true, message: 'Spice level deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

