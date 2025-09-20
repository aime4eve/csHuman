package com.mclimate.building.domain.valueobject;

import com.mclimate.common.domain.ValueObject;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * 坐标值对象
 * 表示建筑物的地理坐标（经纬度）
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class Coordinates implements ValueObject {
    
    private final BigDecimal latitude;
    private final BigDecimal longitude;
    
    /**
     * 构造函数
     * 
     * @param latitude 纬度（-90 到 90）
     * @param longitude 经度（-180 到 180）
     */
    public Coordinates(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("经纬度不能为空");
        }
        
        validateLatitude(latitude);
        validateLongitude(longitude);
        
        // 保留8位小数精度
        this.latitude = latitude.setScale(8, RoundingMode.HALF_UP);
        this.longitude = longitude.setScale(8, RoundingMode.HALF_UP);
    }
    
    /**
     * 从double值创建坐标
     * 
     * @param latitude 纬度
     * @param longitude 经度
     */
    public Coordinates(double latitude, double longitude) {
        this(BigDecimal.valueOf(latitude), BigDecimal.valueOf(longitude));
    }
    
    /**
     * 从字符串创建坐标
     * 
     * @param latitude 纬度字符串
     * @param longitude 经度字符串
     */
    public Coordinates(String latitude, String longitude) {
        this(new BigDecimal(latitude), new BigDecimal(longitude));
    }
    
    /**
     * 验证纬度范围
     * 
     * @param latitude 纬度
     */
    private void validateLatitude(BigDecimal latitude) {
        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0 || 
            latitude.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new IllegalArgumentException("纬度必须在-90到90之间，当前值: " + latitude);
        }
    }
    
    /**
     * 验证经度范围
     * 
     * @param longitude 经度
     */
    private void validateLongitude(BigDecimal longitude) {
        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0 || 
            longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new IllegalArgumentException("经度必须在-180到180之间，当前值: " + longitude);
        }
    }
    
    /**
     * 计算与另一个坐标点的距离（使用Haversine公式）
     * 
     * @param other 另一个坐标点
     * @return 距离（单位：千米）
     */
    public double distanceTo(Coordinates other) {
        if (other == null) {
            throw new IllegalArgumentException("目标坐标不能为空");
        }
        
        final double R = 6371; // 地球半径（千米）
        
        double lat1Rad = Math.toRadians(this.latitude.doubleValue());
        double lat2Rad = Math.toRadians(other.latitude.doubleValue());
        double deltaLatRad = Math.toRadians(other.latitude.subtract(this.latitude).doubleValue());
        double deltaLonRad = Math.toRadians(other.longitude.subtract(this.longitude).doubleValue());
        
        double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                   Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                   Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c;
    }
    
    /**
     * 检查是否在指定范围内
     * 
     * @param center 中心点坐标
     * @param radiusKm 半径（千米）
     * @return 是否在范围内
     */
    public boolean isWithinRadius(Coordinates center, double radiusKm) {
        return distanceTo(center) <= radiusKm;
    }
    
    /**
     * 获取坐标的字符串表示（用于URL等）
     * 
     * @return 格式化的坐标字符串
     */
    public String toUrlString() {
        return latitude + "," + longitude;
    }
    
    /**
     * 获取Google Maps链接
     * 
     * @return Google Maps URL
     */
    public String getGoogleMapsUrl() {
        return "https://www.google.com/maps?q=" + toUrlString();
    }
    
    /**
     * 检查坐标是否有效
     * 
     * @param latitude 纬度
     * @param longitude 经度
     * @return 是否有效
     */
    public static boolean isValid(double latitude, double longitude) {
        return latitude >= -90 && latitude <= 90 && 
               longitude >= -180 && longitude <= 180;
    }
    
    /**
     * 创建零坐标点
     * 
     * @return 零坐标点
     */
    public static Coordinates zero() {
        return new Coordinates(0.0, 0.0);
    }
    
    // Getters
    public BigDecimal getLatitude() {
        return latitude;
    }
    
    public BigDecimal getLongitude() {
        return longitude;
    }
    
    public double getLatitudeAsDouble() {
        return latitude.doubleValue();
    }
    
    public double getLongitudeAsDouble() {
        return longitude.doubleValue();
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Coordinates that = (Coordinates) obj;
        return Objects.equals(latitude, that.latitude) &&
               Objects.equals(longitude, that.longitude);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(latitude, longitude);
    }
    
    @Override
    public String toString() {
        return "(" + latitude + ", " + longitude + ")";
    }
}

/**
 * 建筑物类型枚举
 * 
 * @author 伍志勇
 */
enum BuildingType {
    RESIDENTIAL("住宅"),
    COMMERCIAL("商业"),
    INDUSTRIAL("工业"),
    OFFICE("办公"),
    MIXED_USE("混合用途"),
    EDUCATIONAL("教育"),
    HEALTHCARE("医疗"),
    GOVERNMENT("政府"),
    RELIGIOUS("宗教"),
    RECREATIONAL("娱乐"),
    OTHER("其他");
    
    private final String displayName;
    
    BuildingType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * 从显示名称获取枚举值
     * 
     * @param displayName 显示名称
     * @return 建筑物类型
     */
    public static BuildingType fromDisplayName(String displayName) {
        for (BuildingType type : values()) {
            if (type.displayName.equals(displayName)) {
                return type;
            }
        }
        return OTHER;
    }
}

/**
 * 建筑物状态枚举
 * 
 * @author 伍志勇
 */
enum BuildingStatus {
    ACTIVE("活跃"),
    INACTIVE("非活跃"),
    UNDER_CONSTRUCTION("建设中"),
    MAINTENANCE("维护中"),
    DEMOLISHED("已拆除");
    
    private final String displayName;
    
    BuildingStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * 检查状态是否可操作
     * 
     * @return 是否可操作
     */
    public boolean isOperational() {
        return this == ACTIVE || this == MAINTENANCE;
    }
}

/**
 * 分配状态枚举
 * 
 * @author 伍志勇
 */
enum AssignmentStatus {
    ACTIVE("活跃"),
    INACTIVE("非活跃"),
    PENDING("待处理"),
    CANCELLED("已取消");
    
    private final String displayName;
    
    AssignmentStatus(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}