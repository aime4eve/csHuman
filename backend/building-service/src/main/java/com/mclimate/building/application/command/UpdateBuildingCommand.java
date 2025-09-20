package com.mclimate.building.application.command;

/**
 * 更新建筑物命令
 * 用于封装更新建筑物所需的参数
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class UpdateBuildingCommand {
    
    private String buildingId;
    private String name;
    private String street;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private Double latitude;
    private Double longitude;
    private String updatedBy;
    
    /**
     * 默认构造函数
     */
    public UpdateBuildingCommand() {
    }
    
    /**
     * 完整构造函数
     */
    public UpdateBuildingCommand(String buildingId, String name, String street, String city, 
                               String state, String country, String postalCode, 
                               Double latitude, Double longitude, String updatedBy) {
        this.buildingId = buildingId;
        this.name = name;
        this.street = street;
        this.city = city;
        this.state = state;
        this.country = country;
        this.postalCode = postalCode;
        this.latitude = latitude;
        this.longitude = longitude;
        this.updatedBy = updatedBy;
    }
    
    // Getters and Setters
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
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
    
    public String getUpdatedBy() {
        return updatedBy;
    }
    
    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }
    
    @Override
    public String toString() {
        return "UpdateBuildingCommand{" +
                "buildingId='" + buildingId + '\'' +
                ", name='" + name + '\'' +
                ", street='" + street + '\'' +
                ", city='" + city + '\'' +
                ", state='" + state + '\'' +
                ", country='" + country + '\'' +
                ", postalCode='" + postalCode + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", updatedBy='" + updatedBy + '\'' +
                '}';
    }
}

/**
 * 添加楼层命令
 * 
 * @author 伍志勇
 */
class AddFloorCommand {
    
    private String buildingId;
    private String floorName;
    private Integer floorNumber;
    private String createdBy;
    
    public AddFloorCommand() {
    }
    
    public AddFloorCommand(String buildingId, String floorName, Integer floorNumber, String createdBy) {
        this.buildingId = buildingId;
        this.floorName = floorName;
        this.floorNumber = floorNumber;
        this.createdBy = createdBy;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }
    
    public String getFloorName() {
        return floorName;
    }
    
    public void setFloorName(String floorName) {
        this.floorName = floorName;
    }
    
    public Integer getFloorNumber() {
        return floorNumber;
    }
    
    public void setFloorNumber(Integer floorNumber) {
        this.floorNumber = floorNumber;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}

/**
 * 分配设备命令
 * 
 * @author 伍志勇
 */
class AssignDeviceCommand {
    
    private String buildingId;
    private String deviceId;
    private String roomId;
    private String assignedBy;
    
    public AssignDeviceCommand() {
    }
    
    public AssignDeviceCommand(String buildingId, String deviceId, String roomId, String assignedBy) {
        this.buildingId = buildingId;
        this.deviceId = deviceId;
        this.roomId = roomId;
        this.assignedBy = assignedBy;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }
    
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
    
    public String getAssignedBy() {
        return assignedBy;
    }
    
    public void setAssignedBy(String assignedBy) {
        this.assignedBy = assignedBy;
    }
}

/**
 * 取消设备分配命令
 * 
 * @author 伍志勇
 */
class UnassignDeviceCommand {
    
    private String buildingId;
    private String deviceId;
    private String unassignedBy;
    
    public UnassignDeviceCommand() {
    }
    
    public UnassignDeviceCommand(String buildingId, String deviceId, String unassignedBy) {
        this.buildingId = buildingId;
        this.deviceId = deviceId;
        this.unassignedBy = unassignedBy;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public String getUnassignedBy() {
        return unassignedBy;
    }
    
    public void setUnassignedBy(String unassignedBy) {
        this.unassignedBy = unassignedBy;
    }
}

/**
 * 删除建筑物命令
 * 
 * @author 伍志勇
 */
class DeleteBuildingCommand {
    
    private String buildingId;
    private String deletedBy;
    
    public DeleteBuildingCommand() {
    }
    
    public DeleteBuildingCommand(String buildingId, String deletedBy) {
        this.buildingId = buildingId;
        this.deletedBy = deletedBy;
    }
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }
    
    public String getDeletedBy() {
        return deletedBy;
    }
    
    public void setDeletedBy(String deletedBy) {
        this.deletedBy = deletedBy;
    }
}