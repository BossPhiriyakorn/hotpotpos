import { Request, Response } from 'express';
import pool from '../config/database.js';

// Get dashboard summary
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const user = (req as any).user;

    // Default to current month
    const start = (typeof startDate === 'string' ? startDate : null) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = (typeof endDate === 'string' ? endDate : null) || new Date().toISOString().split('T')[0];

    // Determine branch filter
    let finalBranchId: number | null = null;
    if (branchId && branchId !== 'all' && branchId !== '') {
      finalBranchId = parseInt(branchId as string);
    } else if (user && user.userType !== 'admin') {
      // Non-admin users can only see their branch
      const userResult = await pool.query('SELECT branch_id FROM users WHERE id = $1', [user.id]);
      if (userResult.rows.length > 0 && userResult.rows[0].branch_id) {
        finalBranchId = userResult.rows[0].branch_id;
      }
    }

    // Build query with branch filter
    let summaryQuery = `
      SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
        AND order_status != 'cancelled'
    `;
    const summaryParams: any[] = [start, end];
    if (finalBranchId !== null) {
      summaryQuery += ` AND branch_id = $3`;
      summaryParams.push(finalBranchId);
    }

    const summaryResult = await pool.query(summaryQuery, summaryParams);

    const totalRevenue = parseFloat(summaryResult.rows[0].total_revenue) || 0;
    const totalOrders = parseInt(summaryResult.rows[0].total_orders) || 0;

    // Get previous period for comparison (same period last month)
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    startDateObj.setMonth(startDateObj.getMonth() - 1);
    endDateObj.setMonth(endDateObj.getMonth() - 1);
    const prevStart = startDateObj.toISOString().split('T')[0];
    const prevEnd = endDateObj.toISOString().split('T')[0];

    let prevSummaryQuery = `
      SELECT 
        COALESCE(SUM(total_price), 0) as total_revenue,
        COUNT(*) as total_orders
      FROM orders
      WHERE DATE(created_at) >= $1 AND DATE(created_at) <= $2
        AND order_status != 'cancelled'
    `;
    const prevSummaryParams: any[] = [prevStart, prevEnd];
    if (finalBranchId !== null) {
      prevSummaryQuery += ` AND branch_id = $3`;
      prevSummaryParams.push(finalBranchId);
    }

    const prevSummaryResult = await pool.query(prevSummaryQuery, prevSummaryParams);

    const prevRevenue = parseFloat(prevSummaryResult.rows[0].total_revenue) || 0;
    const prevOrders = parseInt(prevSummaryResult.rows[0].total_orders) || 0;

    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersGrowth = prevOrders > 0 ? ((totalOrders - prevOrders) / prevOrders) * 100 : 0;

    // Get chart data (last 7 days)
    let chartDataQuery = `
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_price), 0) as sales,
        COUNT(*) as orders
      FROM orders
      WHERE DATE(created_at) >= CURRENT_DATE - INTERVAL '6 days'
        AND order_status != 'cancelled'
    `;
    const chartDataParams: any[] = [];
    if (finalBranchId !== null) {
      chartDataQuery += ` AND branch_id = $1`;
      chartDataParams.push(finalBranchId);
    }
    chartDataQuery += ` GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC`;

    const chartDataResult = await pool.query(chartDataQuery, chartDataParams);

    const chartData = chartDataResult.rows.map((row: any) => ({
      fullDate: row.date.toISOString().split('T')[0],
      day: new Date(row.date).toLocaleDateString('th-TH', { weekday: 'long' }),
      sales: parseFloat(row.sales),
      orders: parseInt(row.orders),
    }));

    // Get recent orders (last 8) with addon count and branch info
    let recentOrdersQuery = `
      SELECT 
        o.id,
        o.order_number,
        o.queue_number,
        o.total_price,
        o.created_at,
        o.dining_location,
        o.payment_method,
        s.name as soup_name,
        b.name as branch_name,
        b.code as branch_code,
        COUNT(DISTINCT oa.id) as addon_count
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN order_addons oa ON o.id = oa.order_id
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE o.order_status != 'cancelled'
    `;
    const recentOrdersParams: any[] = [];
    if (finalBranchId !== null) {
      recentOrdersQuery += ` AND o.branch_id = $1`;
      recentOrdersParams.push(finalBranchId);
    }
    recentOrdersQuery += ` GROUP BY o.id, o.order_number, o.queue_number, o.total_price, o.created_at, o.dining_location, o.payment_method, s.name, b.name, b.code
      ORDER BY o.created_at DESC
      LIMIT 8`;

    const recentOrdersResult = await pool.query(recentOrdersQuery, recentOrdersParams);

    const recentOrders = recentOrdersResult.rows.map((order: any) => ({
      id: order.order_number || `ORD-${order.id}`,
      receiptId: `REC-${order.order_number || order.id}`,
      date: order.created_at.toISOString().split('T')[0],
      time: order.created_at.toTimeString().split(' ')[0].slice(0, 5),
      channel: 'Kiosk',
      salesChannel: order.dining_location === 'DINE_IN' ? 'หน้าร้าน (Dine-in)' : 'ที่ร้าน',
      itemCount: parseInt(order.addon_count) + (order.soup_name ? 1 : 0),
      total: parseFloat(order.total_price),
      paymentMethod: order.payment_method || 'PromptPay',
      branchName: order.branch_name || 'ไม่ระบุสาขา',
      branchCode: order.branch_code || null,
    }));

    // Get top products (from order_addons and soups)
    const topProductsResult = await pool.query(`
      SELECT 
        'addon' as type,
        a.id::text as id,
        a.name,
        a.price,
        SUM(oa.quantity) as quantity,
        SUM(oa.total_price) as total
      FROM order_addons oa
      JOIN addons a ON oa.addon_id = a.id
      JOIN orders o ON oa.order_id = o.id
      WHERE DATE(o.created_at) >= $1 AND DATE(o.created_at) <= $2
        AND o.order_status != 'cancelled'
      GROUP BY a.id, a.name, a.price
      
      UNION ALL
      
      SELECT 
        'soup' as type,
        s.id,
        s.name,
        0 as price,
        COUNT(o.id) as quantity,
        0 as total
      FROM orders o
      JOIN soups s ON o.soup_id = s.id
      WHERE DATE(o.created_at) >= $1 AND DATE(o.created_at) <= $2
        AND o.order_status != 'cancelled'
      GROUP BY s.id, s.name
      
      ORDER BY quantity DESC
      LIMIT 10
    `, [start, end]);

    const topProducts = topProductsResult.rows.map((product: any, index: number) => ({
      id: product.id,
      name: product.name,
      category: product.type === 'soup' ? 'Soup' : 'Add-on',
      price: parseFloat(product.price) || 0,
      quantity: parseInt(product.quantity),
      total: parseFloat(product.total) || 0,
      rank: index + 1,
    }));

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        revenueGrowth,
        ordersGrowth,
        chartData,
        recentOrders,
        topProducts: topProducts.slice(0, 3), // Top 3 for dashboard
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get product sales report
export const getProductSales = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, branchId } = req.query;
    const user = (req as any).user;

    const start = (typeof startDate === 'string' ? startDate : null) || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const end = (typeof endDate === 'string' ? endDate : null) || new Date().toISOString().split('T')[0];

    // Determine branch filter
    let finalBranchId: number | null = null;
    if (branchId && branchId !== 'all' && branchId !== '') {
      finalBranchId = parseInt(branchId as string);
    } else if (user && user.userType !== 'admin') {
      const userResult = await pool.query('SELECT branch_id FROM users WHERE id = $1', [user.id]);
      if (userResult.rows.length > 0 && userResult.rows[0].branch_id) {
        finalBranchId = userResult.rows[0].branch_id;
      }
    }

    let branchFilter = '';
    const params: any[] = [start, end];
    if (finalBranchId !== null) {
      branchFilter = ' AND o.branch_id = $3';
      params.push(finalBranchId);
    }

    const result = await pool.query(`
      SELECT 
        'addon' as type,
        a.id::text as id,
        a.name,
        'Add-on' as category,
        a.price,
        SUM(oa.quantity) as quantity,
        SUM(oa.total_price) as total
      FROM order_addons oa
      JOIN addons a ON oa.addon_id = a.id
      JOIN orders o ON oa.order_id = o.id
      WHERE DATE(o.created_at) >= $1 AND DATE(o.created_at) <= $2
        AND o.order_status != 'cancelled'
        ${branchFilter}
      GROUP BY a.id, a.name, a.price
      
      UNION ALL
      
      SELECT 
        'soup' as type,
        s.id,
        s.name,
        'Soup' as category,
        0 as price,
        COUNT(o.id) as quantity,
        0 as total
      FROM orders o
      JOIN soups s ON o.soup_id = s.id
      WHERE DATE(o.created_at) >= $1 AND DATE(o.created_at) <= $2
        AND o.order_status != 'cancelled'
        ${branchFilter}
      GROUP BY s.id, s.name
      
      ORDER BY quantity DESC
    `, params);

    const products = result.rows.map((product: any) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      price: parseFloat(product.price) || 0,
      quantity: parseInt(product.quantity),
      total: parseFloat(product.total) || 0,
      trend: 'stable' as const, // Can be calculated based on previous period
    }));

    res.json({
      success: true,
      data: products,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get orders for reports (with formatted data)
export const getOrdersForReports = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, branchId } = req.query;
    const user = (req as any).user;
    
    const start = typeof startDate === 'string' ? startDate : undefined;
    const end = typeof endDate === 'string' ? endDate : undefined;
    const orderStatus = typeof status === 'string' ? status : undefined;

    // Determine branch filter
    let finalBranchId: number | null = null;
    if (branchId && branchId !== 'all' && branchId !== '') {
      finalBranchId = parseInt(branchId as string);
    } else if (user && user.userType !== 'admin') {
      const userResult = await pool.query('SELECT branch_id FROM users WHERE id = $1', [user.id]);
      if (userResult.rows.length > 0 && userResult.rows[0].branch_id) {
        finalBranchId = userResult.rows[0].branch_id;
      }
    }

    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.queue_number,
        o.total_price,
        o.subtotal,
        o.vat_amount,
        o.created_at,
        o.dining_location,
        o.cooking_style,
        o.payment_method,
        o.payment_status,
        o.order_status,
        s.name as soup_name,
        b.name as branch_name,
        b.code as branch_code,
        COUNT(DISTINCT oa.id) as addon_count
      FROM orders o
      LEFT JOIN soups s ON o.soup_id = s.id
      LEFT JOIN order_addons oa ON o.id = oa.order_id
      LEFT JOIN branches b ON o.branch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (start) {
      query += ` AND DATE(o.created_at) >= $${paramCount}`;
      params.push(start);
      paramCount++;
    }

    if (end) {
      query += ` AND DATE(o.created_at) <= $${paramCount}`;
      params.push(end);
      paramCount++;
    }

    if (orderStatus) {
      query += ` AND o.order_status = $${paramCount}`;
      params.push(orderStatus);
      paramCount++;
    } else {
      query += ` AND o.order_status != 'cancelled'`;
    }

    if (finalBranchId !== null) {
      query += ` AND o.branch_id = $${paramCount}`;
      params.push(finalBranchId);
      paramCount++;
    }

    query += ` GROUP BY o.id, o.order_number, o.queue_number, o.total_price, o.subtotal, o.vat_amount, o.created_at, o.dining_location, o.cooking_style, o.payment_method, o.payment_status, o.order_status, s.name, b.name, b.code ORDER BY o.created_at DESC`;

    const result = await pool.query(query, params);

    const orders = result.rows.map((order: any) => {
      const date = new Date(order.created_at);
      const branchName = order.branch_name || 'ไม่ระบุสาขา';
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().split(' ')[0].slice(0, 5);

      return {
        id: order.order_number || `ORD-${order.id}`,
        receiptId: `REC-${order.order_number || order.id}`,
        date: dateStr,
        time: timeStr,
        channel: 'Kiosk',
        salesChannel: order.dining_location === 'DINE_IN' ? 'หน้าร้าน (Dine-in)' : 'ที่ร้าน',
        itemCount: parseInt(order.addon_count || 0) + (order.soup_name ? 1 : 0),
        total: parseFloat(order.total_price),
        paymentMethod: order.payment_method || 'PromptPay',
        serviceCharge: 0,
        discount: 0,
        rounding: 0,
        tip: 0,
        deliveryFee: 0,
        branchName: branchName,
        branchCode: order.branch_code || null,
      };
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

