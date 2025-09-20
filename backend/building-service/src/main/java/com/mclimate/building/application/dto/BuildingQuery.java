package com.mclimate.building.application.dto;

import com.mclimate.building.domain.valueobject.BuildingType;
import com.mclimate.building.domain.valueobject.BuildingStatus;

/**
 * 建筑物查询对象
 * 用于封装建筑物查询条件
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class BuildingQuery {
    
    private String name;
    private String city;
    private String country;
    private BuildingType type;
    private BuildingStatus status;
    private Double latitude;
    private Double longitude;
    private Double radiusKm;
    private Integer page;
    private Integer size;
    private String sortBy;
    private String sortDirection;
    
    /**
     * 默认构造函数
     */
    public BuildingQuery() {
        this.page = 0;
        this.size = 20;
        this.sortBy = "createdAt";
        this.sortDirection = "DESC";
    }
    
    // Getters and Setters
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getCity() {
        return city;
    }
    
    public void setCity(String city) {
        this.city = city;
    }
    
    public String getCountry() {
        return country;
    }
    
    public void setCountry(String country) {
        this.country = country;
    }
    
    public BuildingType getType() {
        return type;
    }
    
    public void setType(BuildingType type) {
        this.type = type;
    }
    
    public BuildingStatus getStatus() {
        return status;
    }
    
    public void setStatus(BuildingStatus status) {
        this.status = status;
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
    
    public Double getRadiusKm() {
        return radiusKm;
    }
    
    public void setRadiusKm(Double radiusKm) {
        this.radiusKm = radiusKm;
    }
    
    public Integer getPage() {
        return page;
    }
    
    public void setPage(Integer page) {
        this.page = page;
    }
    
    public Integer getSize() {
        return size;
    }
    
    public void setSize(Integer size) {
        this.size = size;
    }
    
    public String getSortBy() {
        return sortBy;
    }
    
    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }
    
    public String getSortDirection() {
        return sortDirection;
    }
    
    public void setSortDirection(String sortDirection) {
        this.sortDirection = sortDirection;
    }
    
    /**
     * 检查是否有地理位置查询条件
     * 
     * @return 是否有地理位置查询
     */
    public boolean hasLocationQuery() {
        return latitude != null && longitude != null && radiusKm != null;
    }
    
    /**
     * 检查是否有名称模糊查询
     * 
     * @return 是否有名称查询
     */
    public boolean hasNameQuery() {
        return name != null && !name.trim().isEmpty();
    }
    
    /**
     * 检查是否有地址查询条件
     * 
     * @return 是否有地址查询
     */
    public boolean hasAddressQuery() {
        return (city != null && !city.trim().isEmpty()) || 
               (country != null && !country.trim().isEmpty());
    }
    
    @Override
    public String toString() {
        return "BuildingQuery{" +
                "name='" + name + '\'' +
                ", city='" + city + '\'' +
                ", country='" + country + '\'' +
                ", type=" + type +
                ", status=" + status +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", radiusKm=" + radiusKm +
                ", page=" + page +
                ", size=" + size +
                ", sortBy='" + sortBy + '\'' +
                ", sortDirection='" + sortDirection + '\'' +
                '}';
    }
}

/**
 * 建筑物统计信息
 * 
 * @author 伍志勇
 */
class BuildingStatistics {
    
    private int totalFloors;
    private int totalRooms;
    private int totalDevices;
    private int activeDevices;
    private int inactiveDevices;
    private double occupancyRate;
    
    public BuildingStatistics() {
    }
    
    public BuildingStatistics(int totalFloors, int totalRooms, int totalDevices, 
                            int activeDevices, int inactiveDevices, double occupancyRate) {
        this.totalFloors = totalFloors;
        this.totalRooms = totalRooms;
        this.totalDevices = totalDevices;
        this.activeDevices = activeDevices;
        this.inactiveDevices = inactiveDevices;
        this.occupancyRate = occupancyRate;
    }
    
    // Getters and Setters
    
    public int getTotalFloors() {
        return totalFloors;
    }
    
    public void setTotalFloors(int totalFloors) {
        this.totalFloors = totalFloors;
    }
    
    public int getTotalRooms() {
        return totalRooms;
    }
    
    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }
    
    public int getTotalDevices() {
        return totalDevices;
    }
    
    public void setTotalDevices(int totalDevices) {
        this.totalDevices = totalDevices;
    }
    
    public int getActiveDevices() {
        return activeDevices;
    }
    
    public void setActiveDevices(int activeDevices) {
        this.activeDevices = activeDevices;
    }
    
    public int getInactiveDevices() {
        return inactiveDevices;
    }
    
    public void setInactiveDevices(int inactiveDevices) {
        this.inactiveDevices = inactiveDevices;
    }
    
    public double getOccupancyRate() {
        return occupancyRate;
    }
    
    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
    }
}

/**
 * 建筑物统计DTO
 * 
 * @author 伍志勇
 */
class BuildingStatisticsDto {
    
    private String buildingId;
    private String buildingName;
    private int totalFloors;
    private int totalRooms;
    private int totalDevices;
    private int activeDevices;
    private int inactiveDevices;
    private double occupancyRate;
    private java.time.LocalDateTime calculatedAt;
    
    /**
     * 从统计对象创建DTO
     * 
     * @param statistics 统计对象
     * @return 统计DTO
     */
    public static BuildingStatisticsDto from(BuildingStatistics statistics) {
        BuildingStatisticsDto dto = new BuildingStatisticsDto();
        dto.setTotalFloors(statistics.getTotalFloors());
        dto.setTotalRooms(statistics.getTotalRooms());
        dto.setTotalDevices(statistics.getTotalDevices());
        dto.setActiveDevices(statistics.getActiveDevices());
        dto.setInactiveDevices(statistics.getInactiveDevices());
        dto.setOccupancyRate(statistics.getOccupancyRate());
        dto.setCalculatedAt(java.time.LocalDateTime.now());
        return dto;
    }
    
    // Getters and Setters
    
    public String getBuildingId() {
        return buildingId;
    }
    
    public void setBuildingId(String buildingId) {
        this.buildingId = buildingId;
    }
    
    public String getBuildingName() {
        return buildingName;
    }
    
    public void setBuildingName(String buildingName) {
        this.buildingName = buildingName;
    }
    
    public int getTotalFloors() {
        return totalFloors;
    }
    
    public void setTotalFloors(int totalFloors) {
        this.totalFloors = totalFloors;
    }
    
    public int getTotalRooms() {
        return totalRooms;
    }
    
    public void setTotalRooms(int totalRooms) {
        this.totalRooms = totalRooms;
    }
    
    public int getTotalDevices() {
        return totalDevices;
    }
    
    public void setTotalDevices(int totalDevices) {
        this.totalDevices = totalDevices;
    }
    
    public int getActiveDevices() {
        return activeDevices;
    }
    
    public void setActiveDevices(int activeDevices) {
        this.activeDevices = activeDevices;
    }
    
    public int getInactiveDevices() {
        return inactiveDevices;
    }
    
    public void setInactiveDevices(int inactiveDevices) {
        this.inactiveDevices = inactiveDevices;
    }
    
    public double getOccupancyRate() {
        return occupancyRate;
    }
    
    public void setOccupancyRate(double occupancyRate) {
        this.occupancyRate = occupancyRate;
    }
    
    public java.time.LocalDateTime getCalculatedAt() {
        return calculatedAt;
    }
    
    public void setCalculatedAt(java.time.LocalDateTime calculatedAt) {
        this.calculatedAt = calculatedAt;
    }
}