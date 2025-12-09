-- ============================================
-- สร้างตารางสำหรับ LINE Notifications
-- ============================================

-- ตารางสำหรับเก็บการเชื่อมต่อ LINE กับออเดอร์
CREATE TABLE IF NOT EXISTS line_notifications (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) NOT NULL, -- LINE User ID
    line_display_name VARCHAR(255), -- ชื่อที่แสดงใน LINE
    notification_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(order_id, line_user_id)
);

-- Index สำหรับค้นหาเร็ว
CREATE INDEX IF NOT EXISTS idx_line_notifications_order_id ON line_notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_line_notifications_line_user_id ON line_notifications(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_notifications_enabled ON line_notifications(notification_enabled) WHERE notification_enabled = true;

-- Function สำหรับอัพเดท updated_at อัตโนมัติ
CREATE OR REPLACE FUNCTION update_line_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger สำหรับอัพเดท updated_at
DROP TRIGGER IF EXISTS trigger_update_line_notifications_updated_at ON line_notifications;
CREATE TRIGGER trigger_update_line_notifications_updated_at
    BEFORE UPDATE ON line_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_line_notifications_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON line_notifications TO hotpot_user;
GRANT USAGE, SELECT ON SEQUENCE line_notifications_id_seq TO hotpot_user;

-- ตรวจสอบว่าสร้างสำเร็จ
SELECT 
    'line_notifications table created successfully' as status,
    COUNT(*) as existing_records
FROM line_notifications;

