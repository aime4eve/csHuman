package com.mclimate.building.infrastructure.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 建筑物JPA实体
 * 用于数据库持久化映射
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@Entity
@Table(name = "buildings", indexes = {
    @Index(name = "idx_building_name", columnList = "name"),
    @Index(name = "idx_building_city", columnList = "city"),
    @Index(name = "idx_building_type", columnList = "type"),
    @Index(name = "idx_building_status", columnList = "status"),
    @Index(name = "idx_building_coordinates", columnList = "latitude, longitude")
})
public class BuildingEntity {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "name", nullable = false, length = 100)
    private String name;
    
    // 地址信息
    @Column(name = "street", nullable = false, length = 200)
    private String street;
    
    @Column(name = "city", nullable = false, length = 50)
    private String city;
    
    @Column(name = "state", length = 50)
    private String state;
    
    @Column(name = "country", nullable = false, length = 50)
    private String country;
    
    @Column(name = "postal_code", length = 20)
    private String postalCode;
    
    // 坐标信息
    @Column(name = "latitude", precision = 10, scale = 8)
    private Double latitude;
    
    @Column(name = "longitude", precision = 11, scale = 8)
    private Double longitude;
    
    // 建筑物属性
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private BuildingTypeEnum type;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BuildingStatusEnum status;
    
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
    @OneToMany(mappedBy = "building", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FloorEntity> floors = new ArrayList<>();
    
    @OneToMany(mappedBy = "building", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DeviceAssignmentEntity> deviceAssignments = new ArrayList<>();
    
    /**
     * 默认构造函数
     */
    public BuildingEntity() {
    }
    
    /**
     * JPA生命周期回调
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = BuildingStatusEnum.ACTIVE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getStreet() {
        return street;
    }
    
    public void setStreet(String street) {
        this.street = street;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getState() {
        return state;
    }
    
    public void setState(String state) {
        this.state = state;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public String getPostalCode() {
        return postalCode;
    }
    
    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }
    
    public Double getLatitude() {
        return latitude;
    }
    
    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }
    
    public Double getLongitude() {
        return longitude;
    }
    
    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }
    
    public BuildingTypeEnum getType() {
        return type;
    }
    
    public void setType(BuildingTypeEnum type) {
        this.type = type;
    }
    
    public BuildingStatusEnum getStatus() {
        return status;
    }
    
    public void setStatus(BuildingStatusEnum status) {
        this.status = status;
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
    
    public List<FloorEntity> getFloors() {
        return floors;
    }
    
    public void setFloors(List<FloorEntity> floors) {
        this.floors = floors;
    }
    
    public List<DeviceAssignmentEntity> getDeviceAssignments() {
        return deviceAssignments;
    }
    
    public void setDeviceAssignments(List<DeviceAssignmentEntity> deviceAssignments) {
        this.deviceAssignments = deviceAssignments;
    }
    
    /**
     * 添加楼层
     */
    public void addFloor(FloorEntity floor) {
        floors.add(floor);
        floor.setBuilding(this);
    }
    
    /**
     * 移除楼层
     */
    public void removeFloor(FloorEntity floor) {
        floors.remove(floor);
        floor.setBuilding(null);
    }
    
    /**
     * 添加设备分配
     */
    public void addDeviceAssignment(DeviceAssignmentEntity assignment) {
        deviceAssignments.add(assignment);
        assignment.setBuilding(this);
    }
    
    /**
     * 移除设备分配
     */
    public void removeDeviceAssignment(DeviceAssignmentEntity assignment) {
        deviceAssignments.remove(assignment);
        assignment.setBuilding(null);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof BuildingEntity)) return false;
        BuildingEntity that = (BuildingEntity) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "BuildingEntity{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", city='" + city + '\'' +
                ", type=" + type +
                ", status=" + status +
                '}';
    }
}

/**
 * 建筑物类型枚举（JPA用）
 * 
 * @author 伍志勇
 */
enum BuildingTypeEnum {
    RESIDENTIAL,
    COMMERCIAL,
    INDUSTRIAL,
    MIXED_USE,
    INSTITUTIONAL,
    OTHER
}

/**
 * 建筑物状态枚举（JPA用）
 * 
 * @author 伍志勇
 */
enum BuildingStatusEnum {
    ACTIVE,
    INACTIVE,
    UNDER_CONSTRUCTION,
    MAINTENANCE,
    DEMOLISHED
}