package com.mclimate.building.application.dto;

import com.mclimate.building.domain.model.Building;
import com.mclimate.building.domain.model.Floor;
import com.mclimate.building.domain.model.DeviceAssignment;
import com.mclimate.building.domain.valueobject.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 建筑物数据传输对象
 * 用于在应用层和表现层之间传输建筑物数据
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class BuildingDto {
    
    private String id;
    private String name;
    private AddressDto address;
    private CoordinatesDto coordinates;
    private String type;
    private String status;
    private List<FloorDto> floors;
    private List<DeviceAssignmentDto> deviceAssignments;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    
    /**
     * 默认构造函数
     */
    public BuildingDto() {
    }
    
    /**
     * 从领域对象创建DTO
     * 
     * @param building 建筑物领域对象
     * @return 建筑物DTO
     */
    public static BuildingDto from(Building building) {
        BuildingDto dto = new BuildingDto();
        dto.setId(building.getId().getValue());
        dto.setName(building.getName());
        dto.setAddress(AddressDto.from(building.getAddress()));
        
        if (building.getCoordinates() != null) {
            dto.setCoordinates(CoordinatesDto.from(building.getCoordinates()));
        }
        
        dto.setType(building.getType().name());
        dto.setStatus(building.getStatus().name());
        dto.setCreatedAt(building.getCreatedAt());
        dto.setUpdatedAt(building.getUpdatedAt());
        
        // 转换楼层列表
        if (building.getFloors() != null) {
            dto.setFloors(building.getFloors().stream()
                .map(FloorDto::from)
                .collect(Collectors.toList()));
        }
        
        // 转换设备分配列表
        if (building.getDeviceAssignments() != null) {
            dto.setDeviceAssignments(building.getDeviceAssignments().stream()
                .map(DeviceAssignmentDto::from)
                .collect(Collectors.toList()));
        }
        
        return dto;
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
    
    public AddressDto getAddress() {
        return address;
    }
    
    public void setAddress(AddressDto address) {
        this.address = address;
    }
    
    public CoordinatesDto getCoordinates() {
        return coordinates;
    }
    
    public void setCoordinates(CoordinatesDto coordinates) {
        this.coordinates = coordinates;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public List<FloorDto> getFloors() {
        return floors;
    }
    
    public void setFloors(List<FloorDto> floors) {
        this.floors = floors;
    }
    
    public List<DeviceAssignmentDto> getDeviceAssignments() {
        return deviceAssignments;
    }
    
    public void setDeviceAssignments(List<DeviceAssignmentDto> deviceAssignments) {
        this.deviceAssignments = deviceAssignments;
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
}

/**
 * 地址DTO
 * 
 * @author 伍志勇
 */
class AddressDto {
    
    private String street;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    
    public static AddressDto from(Address address) {
        AddressDto dto = new AddressDto();
        dto.setStreet(address.getStreet());
        dto.setCity(address.getCity());
        dto.setState(address.getState());
        dto.setCountry(address.getCountry());
        dto.setPostalCode(address.getPostalCode());
        return dto;
    }
    
    // Getters and Setters
    
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
}

/**
 * 坐标DTO
 * 
 * @author 伍志勇
 */
class CoordinatesDto {
    
    private Double latitude;
    private Double longitude;
    
    public static CoordinatesDto from(Coordinates coordinates) {
        CoordinatesDto dto = new CoordinatesDto();
        dto.setLatitude(coordinates.getLatitude());
        dto.setLongitude(coordinates.getLongitude());
        return dto;
    }
    
    // Getters and Setters
    
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
}

/**
 * 楼层DTO
 * 
 * @author 伍志勇
 */
class FloorDto {
    
    private String id;
    private String name;
    private Integer floorNumber;
    private LocalDateTime createdAt;
    
    public static FloorDto from(Floor floor) {
        FloorDto dto = new FloorDto();
        dto.setId(floor.getId().getValue());
        dto.setName(floor.getName());
        dto.setFloorNumber(floor.getFloorNumber());
        dto.setCreatedAt(floor.getCreatedAt());
        return dto;
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
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

/**
 * 设备分配DTO
 * 
 * @author 伍志勇
 */
class DeviceAssignmentDto {
    
    private String deviceId;
    private String roomId;
    private String status;
    private LocalDateTime assignedAt;
    private String assignedBy;
    
    public static DeviceAssignmentDto from(DeviceAssignment assignment) {
        DeviceAssignmentDto dto = new DeviceAssignmentDto();
        dto.setDeviceId(assignment.getDeviceId().getValue());
        
        if (assignment.getRoomId() != null) {
            dto.setRoomId(assignment.getRoomId().getValue());
        }
        
        dto.setStatus(assignment.getStatus().name());
        dto.setAssignedAt(assignment.getAssignedAt());
        dto.setAssignedBy(assignment.getAssignedBy().getValue());
        return dto;
    }
    
    // Getters and Setters
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public String getRoomId() {
        return roomId;
    }
    
    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getAssignedAt() {
        return assignedAt;
    }
    
    public void setAssignedAt(LocalDateTime assignedAt) {
        this.assignedAt = assignedAt;
    }
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
}