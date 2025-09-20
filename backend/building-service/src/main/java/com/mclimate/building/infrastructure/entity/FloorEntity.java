package com.mclimate.building.infrastructure.entity;

import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 楼层JPA实体
 * 用于数据库持久化映射
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@Entity
@Table(name = "floors", indexes = {
    @Index(name = "idx_floor_building", columnList = "building_id"),
    @Index(name = "idx_floor_number", columnList = "building_id, floor_number", unique = true)
})
public class FloorEntity {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "name", nullable = false, length = 50)
    private String name;
    
    @Column(name = "floor_number", nullable = false)
    private Integer floorNumber;
    
    @Column(name = "description", length = 500)
    private String description;
    
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
    
    @OneToMany(mappedBy = "floor", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RoomEntity> rooms = new ArrayList<>();
    
    /**
     * 默认构造函数
     */
    public FloorEntity() {
    }
    
    /**
     * JPA生命周期回调
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
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
    
    public Integer getFloorNumber() {
        return floorNumber;
    }
    
    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    
    public List<RoomEntity> getRooms() {
        return rooms;
    }
    
    public void setRooms(List<RoomEntity> rooms) {
        this.rooms = rooms;
    }
    
    /**
     * 添加房间
     */
    public void addRoom(RoomEntity room) {
        rooms.add(room);
        room.setFloor(this);
    }
    
    /**
     * 移除房间
     */
    public void removeRoom(RoomEntity room) {
        rooms.remove(room);
        room.setFloor(null);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FloorEntity)) return false;
        FloorEntity that = (FloorEntity) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "FloorEntity{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", floorNumber=" + floorNumber +
                '}';
    }
}

/**
 * 房间JPA实体
 * 
 * @author 伍志勇
 */
@Entity
@Table(name = "rooms", indexes = {
    @Index(name = "idx_room_floor", columnList = "floor_id"),
    @Index(name = "idx_room_number", columnList = "floor_id, room_number", unique = true)
})
class RoomEntity {
    
    @Id
    @Column(name = "id", length = 36)
    private String id;
    
    @Column(name = "name", nullable = false, length = 50)
    private String name;
    
    @Column(name = "room_number", nullable = false, length = 20)
    private String roomNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private RoomTypeEnum type;
    
    @Column(name = "area", precision = 8, scale = 2)
    private Double area;
    
    @Column(name = "capacity")
    private Integer capacity;
    
    @Column(name = "description", length = 500)
    private String description;
    
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
    @JoinColumn(name = "floor_id", nullable = false)
    private FloorEntity floor;
    
    /**
     * 默认构造函数
     */
    public RoomEntity() {
    }
    
    /**
     * JPA生命周期回调
     */
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
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
    
    public String getRoomNumber() {
        return roomNumber;
    }
    
    public void setRoomNumber(String roomNumber) {
        this.roomNumber = roomNumber;
    }
    
    public RoomTypeEnum getType() {
        return type;
    }
    
    public void setType(RoomTypeEnum type) {
        this.type = type;
    }
    
    public Double getArea() {
        return area;
    }
    
    public void setArea(Double area) {
        this.area = area;
    }
    
    public Integer getCapacity() {
        return capacity;
    }
    
    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
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
    
    public FloorEntity getFloor() {
        return floor;
    }
    
    public void setFloor(FloorEntity floor) {
        this.floor = floor;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RoomEntity)) return false;
        RoomEntity that = (RoomEntity) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
    
    @Override
    public String toString() {
        return "RoomEntity{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", roomNumber='" + roomNumber + '\'' +
                ", type=" + type +
                '}';
    }
}

/**
 * 房间类型枚举
 * 
 * @author 伍志勇
 */
enum RoomTypeEnum {
    OFFICE,
    MEETING_ROOM,
    CONFERENCE_ROOM,
    STORAGE,
    UTILITY,
    RESTROOM,
    KITCHEN,
    LOBBY,
    CORRIDOR,
    APARTMENT,
    BEDROOM,
    LIVING_ROOM,
    BATHROOM,
    OTHER
}