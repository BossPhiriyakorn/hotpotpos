import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

// ใช้ postgres superuser สำหรับ migration (ALTER TABLE ต้องการ owner permission)
// ถ้าต้องการใช้ hotpot_user แทน ให้ grant ก่อน:
//   GRANT ALL ON TABLE orders TO hotpot_user;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.MIGRATE_DB_USER || process.env.DB_USER,
  password: process.env.MIGRATE_DB_PASSWORD || process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🔄 Running KBank payment migration...');

    // 1. Add kbank columns to orders table
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS kbank_charge_id VARCHAR(100)`);
    await client.query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS kbank_payment_id VARCHAR(100)`);
    console.log('✅ Added kbank columns to orders table');

    // 2. Create kbank_charges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS kbank_charges (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        charge_id VARCHAR(100) UNIQUE NOT NULL,
        partner_tx_id VARCHAR(100) UNIQUE NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'THB',
        status VARCHAR(50) DEFAULT 'pending',
        qr_code_data TEXT,
        qr_image_url TEXT,
        payment_method VARCHAR(50),
        kbank_payment_id VARCHAR(100),
        paid_at TIMESTAMP,
        expires_at TIMESTAMP,
        raw_request JSONB,
        raw_response JSONB,
        raw_webhook JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created kbank_charges table');

    // 3. Grant permissions to hotpot_user
    const appUser = process.env.DB_USER;
    if (appUser && appUser !== 'postgres') {
      await client.query(`GRANT SELECT, INSERT, UPDATE ON kbank_charges TO ${appUser}`);
      await client.query(`GRANT USAGE, SELECT ON SEQUENCE kbank_charges_id_seq TO ${appUser}`);
      console.log(`✅ Granted permissions on kbank_charges to ${appUser}`);
    }

    // 4. Add payment_mode setting
    await client.query(`
      INSERT INTO settings (key, value, description, category, data_type)
      VALUES (
        'payment_mode',
        'static_qr',
        'โหมดการชำระเงิน: static_qr = QR รูปนิ่ง (PromptPay), kbank_gateway = K Payment Gateway API',
        'payment',
        'text'
      )
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('✅ Added payment_mode setting (default: static_qr)');

    // 5. Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kbank_charges_order_id ON kbank_charges(order_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kbank_charges_charge_id ON kbank_charges(charge_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kbank_charges_status ON kbank_charges(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_orders_kbank_charge_id ON orders(kbank_charge_id)`);
    console.log('✅ Created indexes');

    await client.query('COMMIT');
    console.log('\n🎉 KBank migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Changes:');
    console.log('   - orders.kbank_charge_id (VARCHAR)');
    console.log('   - orders.kbank_payment_id (VARCHAR)');
    console.log('   - Table: kbank_charges');
    console.log('   - Setting: payment_mode = static_qr (default)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
