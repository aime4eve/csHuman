package com.mclimate.building.infrastructure.entity;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * 设备分配JPA实体
 * 用于数据库持久化映射
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@Entity
@Table(name = "device_assignments", indexes = {
    @Index(name = "idx_device_assignment_building", columnList = "building_id"),
    @Index(name = "idx_device_assignment_device", columnList = "device_id"),
    @Index(name = "idx_device_assignment_status", columnList = "status"),
    @Index(name = "idx_device_assignment_unique", columnList = "building_id, device_id", unique = true)
})
public class DeviceAssignmentEntity {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "device_id", nullable = false, length = 36)
    private String deviceId;
    
    @Column(name = "device_name", nullable = false, length = 100)
    private String deviceName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", nullable = false, length = 30)
    private DeviceTypeEnum deviceType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AssignmentStatusEnum status;
    
    @Column(name = "location", length = 200)
    private String location;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "assigned_at", nullable = false)
    private LocalDateTime assignedAt;
    
    @Column(name = "unassigned_at")
    private LocalDateTime unassignedAt;
    
    @Column(name = "assigned_by", length = 36)
    private String assignedBy;
    
    @Column(name = "unassigned_by", length = 36)
    private String unassignedBy;
    
    // 审计字段
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "created_by", length = 36)
    private String createdBy;
    
    @Column(name = "updated_by", length = 36)
    private String updatedBy;
    
    // 关联关系
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id", nullable = false)
    private BuildingEntity building;
    
    /**
     * 默认构造函数
     */
    public DeviceAssignmentEntity() {
    }
    
    /**
     * 构造函数
     */
    public DeviceAssignmentEntity(String id, String deviceId, String deviceName, 
                                DeviceTypeEnum deviceType, String location) {
        this.id = id;
        this.deviceId = deviceId;
        this.deviceName = deviceName;
        this.deviceType = deviceType;
        this.location = location;
        this.status = AssignmentStatusEnum.ACTIVE;
        this.assignedAt = LocalDateTime.now();
    }
    
    /**
     * JPA生命周期回调
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (assignedAt == null) {
            assignedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * 取消分配
     */
    public void unassign(String unassignedBy) {
        this.status = AssignmentStatusEnum.INACTIVE;
        this.unassignedAt = LocalDateTime.now();
        this.unassignedBy = unassignedBy;
    }
    
    /**
     * 重新分配
     */
    public void reassign(String assignedBy) {
        this.status = AssignmentStatusEnum.ACTIVE;
        this.assignedAt = LocalDateTime.now();
        this.assignedBy = assignedBy;
        this.unassignedAt = null;
        this.unassignedBy = null;
    }
    
    /**
     * 检查是否为活跃状态
     */
    public boolean isActive() {
        return AssignmentStatusEnum.ACTIVE.equals(status);
    }
    
    // Getters and Setters
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public String getDeviceName() {
        return deviceName;
    }
    
    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }
    
    public DeviceTypeEnum getDeviceType() {
        return deviceType;
    }
    
    public void setDeviceType(DeviceTypeEnum deviceType) {
        this.deviceType = deviceType;
    }
    
    public AssignmentStatusEnum getStatus() {
        return status;
    }
    
    public void setStatus(AssignmentStatusEnum status) {
        this.status = status;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    public LocalDateTime getUnassignedAt() {
        return unassignedAt;
    }
    
    public void setUnassignedAt(LocalDateTime unassignedAt) {
        this.unassignedAt = unassignedAt;
    }
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
    
    public String getUnassignedBy() {
        return unassignedBy;
    }
    
    public void setUnassignedBy(String unassignedBy) {
        this.unassignedBy = unassignedBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    public BuildingEntity getBuilding() {
        return building;
    }
    
    public void setBuilding(BuildingEntity building) {
        this.building = building;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DeviceAssignmentEntity)) return false;
        DeviceAssignmentEntity that = (DeviceAssignmentEntity) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "DeviceAssignmentEntity{" +
                "id='" + id + '\'' +
                ", deviceId='" + deviceId + '\'' +
                ", deviceName='" + deviceName + '\'' +
                ", deviceType=" + deviceType +
                ", status=" + status +
                '}';
    }
}

/**
 * 设备类型枚举
 * 
 * @author 伍志勇
 */
enum DeviceTypeEnum {
    HVAC_CONTROLLER,
    TEMPERATURE_SENSOR,
    HUMIDITY_SENSOR,
    AIR_QUALITY_SENSOR,
    OCCUPANCY_SENSOR,
    LIGHT_CONTROLLER,
    ENERGY_METER,
    WATER_METER,
    SECURITY_CAMERA,
    ACCESS_CONTROL,
    FIRE_DETECTOR,
    SMOKE_DETECTOR,
    GATEWAY,
    REPEATER,
    OTHER
}

/**
 * 分配状态枚举
 * 
 * @author 伍志勇
 */
enum AssignmentStatusEnum {
    ACTIVE,
    INACTIVE,
    MAINTENANCE,
    FAULTY
}