package com.mclimate.building.domain.model;

import com.mclimate.building.domain.valueobject.*;
import com.mclimate.common.domain.AggregateRoot;
import com.mclimate.common.domain.DomainEvent;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 建筑物聚合根
 * 负责管理建筑物的基本信息、楼层结构和设备分配
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class Building extends AggregateRoot<BuildingId> {
    
    private BuildingId id;
    private String name;
    private Address address;
    private Coordinates coordinates;
    private BuildingType type;
    private BuildingStatus status;
    private List<Floor> floors;
    private List<DeviceAssignment> deviceAssignments;
    private BuildingStatistics statistics;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    /**
     * 私有构造函数，防止外部直接实例化
     */
    private Building() {
        this.floors = new ArrayList<>();
        this.deviceAssignments = new ArrayList<>();
        this.status = BuildingStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * 创建新建筑物的工厂方法
     * 
     * @param name 建筑物名称
     * @param address 建筑物地址
     * @param coordinates 建筑物坐标
     * @param type 建筑物类型
     * @return 新建筑物实例
     */
    public static Building create(String name, Address address, 
                                 Coordinates coordinates, BuildingType type) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("建筑物名称不能为空");
        }
        if (address == null) {
            throw new IllegalArgumentException("建筑物地址不能为空");
        }
        
        Building building = new Building();
        building.id = BuildingId.generate();
        building.name = name.trim();
        building.address = address;
        building.coordinates = coordinates;
        building.type = type != null ? type : BuildingType.COMMERCIAL;
        
        // 发布建筑物创建事件
        building.addDomainEvent(new BuildingCreatedEvent(building.id, building.name));
        
        return building;
    }
    
    /**
     * 添加楼层
     * 
     * @param floorName 楼层名称
     * @param floorNumber 楼层编号
     * @return 新创建的楼层
     */
    public Floor addFloor(String floorName, int floorNumber) {
        if (floorName == null || floorName.trim().isEmpty()) {
            throw new IllegalArgumentException("楼层名称不能为空");
        }
        
        // 检查楼层编号是否已存在
        boolean floorExists = floors.stream()
            .anyMatch(floor -> floor.getFloorNumber() == floorNumber);
        if (floorExists) {
            throw new IllegalArgumentException("楼层编号 " + floorNumber + " 已存在");
        }
        
        Floor floor = Floor.create(floorName, floorNumber, this.id);
        floors.add(floor);
        this.updatedAt = LocalDateTime.now();
        
        // 发布楼层添加事件
        addDomainEvent(new FloorAddedEvent(this.id, floor.getId(), floorName));
        
        return floor;
    }
    
    /**
     * 分配设备到建筑物
     * 
     * @param deviceId 设备ID
     * @param roomId 房间ID（可选）
     * @param assignedBy 分配人
     */
    public void assignDevice(DeviceId deviceId, Optional<RoomId> roomId, UserId assignedBy) {
        if (deviceId == null) {
            throw new IllegalArgumentException("设备ID不能为空");
        }
        if (assignedBy == null) {
            throw new IllegalArgumentException("分配人不能为空");
        }
        
        // 检查设备是否已分配
        boolean deviceAlreadyAssigned = deviceAssignments.stream()
            .anyMatch(assignment -> assignment.getDeviceId().equals(deviceId) 
                     && assignment.getStatus() == AssignmentStatus.ACTIVE);
        if (deviceAlreadyAssigned) {
            throw new IllegalArgumentException("设备已分配到此建筑物");
        }
        
        DeviceAssignment assignment = DeviceAssignment.create(
            deviceId, this.id, roomId, assignedBy
        );
        deviceAssignments.add(assignment);
        this.updatedAt = LocalDateTime.now();
        
        // 发布设备分配事件
        addDomainEvent(new DeviceAssignedEvent(this.id, deviceId, roomId));
    }
    
    /**
     * 取消设备分配
     * 
     * @param deviceId 设备ID
     * @param unassignedBy 取消分配人
     */
    public void unassignDevice(DeviceId deviceId, UserId unassignedBy) {
        if (deviceId == null) {
            throw new IllegalArgumentException("设备ID不能为空");
        }
        
        DeviceAssignment assignment = deviceAssignments.stream()
            .filter(a -> a.getDeviceId().equals(deviceId) 
                        && a.getStatus() == AssignmentStatus.ACTIVE)
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("设备未分配到此建筑物"));
        
        assignment.unassign(unassignedBy);
        this.updatedAt = LocalDateTime.now();
        
        // 发布设备取消分配事件
        addDomainEvent(new DeviceUnassignedEvent(this.id, deviceId));
    }
    
    /**
     * 计算建筑物统计信息
     * 
     * @return 建筑物统计信息
     */
    public BuildingStatistics calculateStatistics() {
        int totalFloors = floors.size();
        int totalRooms = floors.stream()
            .mapToInt(floor -> floor.getRooms().size())
            .sum();
        int totalDevices = (int) deviceAssignments.stream()
            .filter(assignment -> assignment.getStatus() == AssignmentStatus.ACTIVE)
            .count();
        
        this.statistics = new BuildingStatistics(totalFloors, totalRooms, totalDevices);
        return this.statistics;
    }
    
    /**
     * 更新建筑物基本信息
     * 
     * @param name 新名称
     * @param address 新地址
     * @param coordinates 新坐标
     */
    public void updateBasicInfo(String name, Address address, Coordinates coordinates) {
        if (name != null && !name.trim().isEmpty()) {
            this.name = name.trim();
        }
        if (address != null) {
            this.address = address;
        }
        if (coordinates != null) {
            this.coordinates = coordinates;
        }
        this.updatedAt = LocalDateTime.now();
        
        // 发布建筑物更新事件
        addDomainEvent(new BuildingUpdatedEvent(this.id, this.name));
    }
    
    /**
     * 获取指定楼层
     * 
     * @param floorNumber 楼层编号
     * @return 楼层对象
     */
    public Optional<Floor> getFloor(int floorNumber) {
        return floors.stream()
            .filter(floor -> floor.getFloorNumber() == floorNumber)
            .findFirst();
    }
    
    /**
     * 获取活跃的设备分配列表
     * 
     * @return 活跃设备分配列表
     */
    public List<DeviceAssignment> getActiveDeviceAssignments() {
        return deviceAssignments.stream()
            .filter(assignment -> assignment.getStatus() == AssignmentStatus.ACTIVE)
            .toList();
    }
    
    /**
     * 检查建筑物是否可以删除
     * 
     * @return 是否可以删除
     */
    public boolean canBeDeleted() {
        return getActiveDeviceAssignments().isEmpty() && 
               floors.stream().allMatch(Floor::canBeDeleted);
    }
    
    // Getters
    @Override
    public BuildingId getId() {
        return id;
    }
    
    public String getName() {
        return name;
    }
    
    public Address getAddress() {
        return address;
    }
    
    public Coordinates getCoordinates() {
        return coordinates;
    }
    
    public BuildingType getType() {
        return type;
    }
    
    public BuildingStatus getStatus() {
        return status;
    }
    
    public List<Floor> getFloors() {
        return new ArrayList<>(floors);
    }
    
    public List<DeviceAssignment> getDeviceAssignments() {
        return new ArrayList<>(deviceAssignments);
    }
    
    public BuildingStatistics getStatistics() {
        return statistics;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Building building = (Building) obj;
        return id != null && id.equals(building.id);
    }
    
    @Override
    public int hashCode() {
        return id != null ? id.hashCode() : 0;
    }
    
    @Override
    public String toString() {
        return "Building{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", address=" + address +
                ", type=" + type +
                ", status=" + status +
                '}';
    }
}

/**
 * 建筑物创建事件
 * @author 伍志勇
 */
class BuildingCreatedEvent implements DomainEvent {
    private final BuildingId buildingId;
    private final String buildingName;
    private final LocalDateTime occurredOn;
    
    public BuildingCreatedEvent(BuildingId buildingId, String buildingName) {
        this.buildingId = buildingId;
        this.buildingName = buildingName;
        this.occurredOn = LocalDateTime.now();
    }
    
    @Override
    public LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public String getBuildingName() {
        return buildingName;
    }
}

/**
 * 楼层添加事件
 * @author 伍志勇
 */
class FloorAddedEvent implements DomainEvent {
    private final BuildingId buildingId;
    private final FloorId floorId;
    private final String floorName;
    private final LocalDateTime occurredOn;
    
    public FloorAddedEvent(BuildingId buildingId, FloorId floorId, String floorName) {
        this.buildingId = buildingId;
        this.floorId = floorId;
        this.floorName = floorName;
        this.occurredOn = LocalDateTime.now();
    }
    
    @Override
    public LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public FloorId getFloorId() {
        return floorId;
    }
    
    public String getFloorName() {
        return floorName;
    }
}

/**
 * 设备分配事件
 * @author 伍志勇
 */
class DeviceAssignedEvent implements DomainEvent {
    private final BuildingId buildingId;
    private final DeviceId deviceId;
    private final Optional<RoomId> roomId;
    private final LocalDateTime occurredOn;
    
    public DeviceAssignedEvent(BuildingId buildingId, DeviceId deviceId, Optional<RoomId> roomId) {
        this.buildingId = buildingId;
        this.deviceId = deviceId;
        this.roomId = roomId;
        this.occurredOn = LocalDateTime.now();
    }
    
    @Override
    public LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public DeviceId getDeviceId() {
        return deviceId;
    }
    
    public Optional<RoomId> getRoomId() {
        return roomId;
    }
}

/**
 * 设备取消分配事件
 * @author 伍志勇
 */
class DeviceUnassignedEvent implements DomainEvent {
    private final BuildingId buildingId;
    private final DeviceId deviceId;
    private final LocalDateTime occurredOn;
    
    public DeviceUnassignedEvent(BuildingId buildingId, DeviceId deviceId) {
        this.buildingId = buildingId;
        this.deviceId = deviceId;
        this.occurredOn = LocalDateTime.now();
    }
    
    @Override
    public LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public DeviceId getDeviceId() {
        return deviceId;
    }
}

/**
 * 建筑物更新事件
 * @author 伍志勇
 */
class BuildingUpdatedEvent implements DomainEvent {
    private final BuildingId buildingId;
    private final String buildingName;
    private final LocalDateTime occurredOn;
    
    public BuildingUpdatedEvent(BuildingId buildingId, String buildingName) {
        this.buildingId = buildingId;
        this.buildingName = buildingName;
        this.occurredOn = LocalDateTime.now();
    }
    
    @Override
    public LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public String getBuildingName() {
        return buildingName;
    }
}