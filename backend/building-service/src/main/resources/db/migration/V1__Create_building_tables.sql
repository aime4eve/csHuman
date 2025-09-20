-- 建筑管理服务数据库初始化脚本
-- @author 伍志勇
-- @version 1.0
-- @since 2025-09-09

-- 创建建筑物表
CREATE TABLE IF NOT EXISTS buildings (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('OFFICE', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED_USE', 'OTHER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'UNDER_CONSTRUCTION', 'MAINTENANCE', 'DEMOLISHED')),
    
    -- 地址信息
    address_street VARCHAR(200),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(100),
    address_postal_code VARCHAR(20),
    
    -- 坐标信息
    coordinates_latitude DECIMAL(10, 8),
    coordinates_longitude DECIMAL(11, 8),
    
    -- 建筑物属性
    total_floors INTEGER DEFAULT 0,
    total_area DECIMAL(12, 2),
    construction_year INTEGER,
    
    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    
    -- 索引
    CONSTRAINT uk_building_name UNIQUE (name),
    CONSTRAINT chk_coordinates CHECK (
        (coordinates_latitude IS NULL AND coordinates_longitude IS NULL) OR
        (coordinates_latitude IS NOT NULL AND coordinates_longitude IS NOT NULL AND
         coordinates_latitude BETWEEN -90 AND 90 AND
         coordinates_longitude BETWEEN -180 AND 180)
    )
);

-- 创建楼层表
CREATE TABLE IF NOT EXISTS floors (
    id VARCHAR(36) PRIMARY KEY,
    building_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    floor_number INTEGER NOT NULL,
    description TEXT,
    
    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    
    -- 外键约束
    CONSTRAINT fk_floor_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_floor_building_number UNIQUE (building_id, floor_number)
);

-- 创建房间表
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(36) PRIMARY KEY,
    floor_id VARCHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN (
        'OFFICE', 'MEETING_ROOM', 'CONFERENCE_ROOM', 'STORAGE', 'UTILITY', 
        'RESTROOM', 'KITCHEN', 'LOBBY', 'CORRIDOR', 'APARTMENT', 
        'BEDROOM', 'LIVING_ROOM', 'BATHROOM', 'OTHER'
    )),
    area DECIMAL(8, 2),
    capacity INTEGER,
    description TEXT,
    
    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    
    -- 外键约束
    CONSTRAINT fk_room_floor FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_room_floor_number UNIQUE (floor_id, room_number)
);

-- 创建设备分配表
CREATE TABLE IF NOT EXISTS device_assignments (
    id VARCHAR(36) PRIMARY KEY,
    building_id VARCHAR(36) NOT NULL,
    device_id VARCHAR(36) NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(30) NOT NULL CHECK (device_type IN (
        'HVAC_CONTROLLER', 'TEMPERATURE_SENSOR', 'HUMIDITY_SENSOR', 'AIR_QUALITY_SENSOR',
        'OCCUPANCY_SENSOR', 'LIGHT_CONTROLLER', 'ENERGY_METER', 'WATER_METER',
        'SECURITY_CAMERA', 'ACCESS_CONTROL', 'FIRE_DETECTOR', 'SMOKE_DETECTOR',
        'GATEWAY', 'REPEATER', 'OTHER'
    )),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'FAULTY')),
    location VARCHAR(200),
    description TEXT,
    
    -- 分配时间信息
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    unassigned_at TIMESTAMP,
    assigned_by VARCHAR(36),
    unassigned_by VARCHAR(36),
    
    -- 审计字段
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(36),
    updated_by VARCHAR(36),
    
    -- 外键约束
    CONSTRAINT fk_device_assignment_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- 唯一约束
    CONSTRAINT uk_device_assignment_building_device UNIQUE (building_id, device_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_building_type ON buildings(type);
CREATE INDEX IF NOT EXISTS idx_building_status ON buildings(status);
CREATE INDEX IF NOT EXISTS idx_building_city ON buildings(address_city);
CREATE INDEX IF NOT EXISTS idx_building_coordinates ON buildings(coordinates_latitude, coordinates_longitude);
CREATE INDEX IF NOT EXISTS idx_building_created_at ON buildings(created_at);

CREATE INDEX IF NOT EXISTS idx_floor_building ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floor_number ON floors(building_id, floor_number);

CREATE INDEX IF NOT EXISTS idx_room_floor ON rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_room_type ON rooms(type);

CREATE INDEX IF NOT EXISTS idx_device_assignment_building ON device_assignments(building_id);
CREATE INDEX IF NOT EXISTS idx_device_assignment_device ON device_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_assignment_status ON device_assignments(status);
CREATE INDEX IF NOT EXISTS idx_device_assignment_type ON device_assignments(device_type);

-- 插入示例数据
INSERT INTO buildings (id, name, description, type, status, address_street, address_city, address_state, address_country, address_postal_code, coordinates_latitude, coordinates_longitude, total_floors, total_area, construction_year, created_by) VALUES
('building-001', 'Royal Building', '皇家大厦，现代化办公楼', 'OFFICE', 'ACTIVE', '123 Main Street', 'Hong Kong', 'Hong Kong', 'China', '00000', 22.3193, 114.1694, 25, 15000.00, 2020, 'system'),
('building-002', 'Tower Building', '塔楼，高端商业综合体', 'COMMERCIAL', 'ACTIVE', '456 Business Avenue', 'Hong Kong', 'Hong Kong', 'China', '00001', 22.3083, 114.1747, 30, 20000.00, 2018, 'system');

-- 插入楼层数据
INSERT INTO floors (id, building_id, name, floor_number, description, created_by) VALUES
('floor-001', 'building-001', '1st Floor', 1, '一楼大堂和接待区', 'system'),
('floor-002', 'building-001', '2nd Floor', 2, '二楼办公区域', 'system'),
('floor-003', 'building-001', '3rd Floor', 3, '三楼会议室区域', 'system'),
('floor-004', 'building-002', '1st Floor', 1, '一楼商业区', 'system'),
('floor-005', 'building-002', '2nd Floor', 2, '二楼餐饮区', 'system');

-- 插入房间数据
INSERT INTO rooms (id, floor_id, name, room_number, type, area, capacity, description, created_by) VALUES
('room-001', 'floor-001', 'Main Lobby', '101', 'LOBBY', 200.00, 100, '主大堂', 'system'),
('room-002', 'floor-001', 'Reception', '102', 'OFFICE', 50.00, 5, '前台接待', 'system'),
('room-003', 'floor-002', 'Office A', '201', 'OFFICE', 80.00, 8, '办公室A', 'system'),
('room-004', 'floor-002', 'Office B', '202', 'OFFICE', 80.00, 8, '办公室B', 'system'),
('room-005', 'floor-003', 'Conference Room', '301', 'CONFERENCE_ROOM', 120.00, 20, '大会议室', 'system');

-- 插入设备分配数据
INSERT INTO device_assignments (id, building_id, device_id, device_name, device_type, status, location, description, assigned_by, created_by) VALUES
('assignment-001', 'building-001', 'device-001', 'HVAC Controller 1', 'HVAC_CONTROLLER', 'ACTIVE', '1st Floor - Main Lobby', '主大堂空调控制器', 'system', 'system'),
('assignment-002', 'building-001', 'device-002', 'Temperature Sensor 1', 'TEMPERATURE_SENSOR', 'ACTIVE', '2nd Floor - Office A', '办公室A温度传感器', 'system', 'system'),
('assignment-003', 'building-001', 'device-003', 'Security Camera 1', 'SECURITY_CAMERA', 'ACTIVE', '1st Floor - Main Entrance', '主入口安防摄像头', 'system', 'system'),
('assignment-004', 'building-002', 'device-004', 'HVAC Controller 2', 'HVAC_CONTROLLER', 'ACTIVE', '1st Floor - Commercial Area', '商业区空调控制器', 'system', 'system'),
('assignment-005', 'building-002', 'device-005', 'Energy Meter 1', 'ENERGY_METER', 'ACTIVE', 'Utility Room', '电表', 'system', 'system');

-- 创建触发器更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON buildings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_device_assignments_updated_at BEFORE UPDATE ON device_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建视图：建筑物统计信息
CREATE OR REPLACE VIEW building_statistics AS
SELECT 
    COUNT(*) as total_buildings,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_buildings,
    COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_buildings,
    COUNT(CASE WHEN status = 'UNDER_CONSTRUCTION' THEN 1 END) as under_construction_buildings,
    COUNT(CASE WHEN type = 'OFFICE' THEN 1 END) as office_buildings,
    COUNT(CASE WHEN type = 'RESIDENTIAL' THEN 1 END) as residential_buildings,
    COUNT(CASE WHEN type = 'COMMERCIAL' THEN 1 END) as commercial_buildings,
    COUNT(CASE WHEN type = 'INDUSTRIAL' THEN 1 END) as industrial_buildings,
    SUM(total_floors) as total_floors,
    SUM(total_area) as total_area,
    AVG(total_floors) as avg_floors_per_building,
    AVG(total_area) as avg_area_per_building
FROM buildings;

-- 创建视图：设备分配统计
CREATE OR REPLACE VIEW device_assignment_statistics AS
SELECT 
    building_id,
    b.name as building_name,
    COUNT(*) as total_devices,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_devices,
    COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as inactive_devices,
    COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as maintenance_devices,
    COUNT(CASE WHEN status = 'FAULTY' THEN 1 END) as faulty_devices
FROM device_assignments da
JOIN buildings b ON da.building_id = b.id
GROUP BY building_id, b.name;

COMMIT;