package com.mclimate.building.domain.valueobject;

import com.mclimate.common.domain.ValueObject;

import java.util.Objects;
import java.util.UUID;

/**
 * 建筑物ID值对象
 * 作为建筑物聚合根的唯一标识符
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class BuildingId implements ValueObject {
    
    private final String value;
    
    /**
     * 私有构造函数
     * 
     * @param value ID值
     */
    private BuildingId(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("建筑物ID不能为空");
        }
        this.value = value.trim();
    }
    
    /**
     * 生成新的建筑物ID
     * 
     * @return 新的建筑物ID
     */
    public static BuildingId generate() {
        return new BuildingId("BLD-" + UUID.randomUUID().toString());
    }
    
    /**
     * 从字符串创建建筑物ID
     * 
     * @param value ID字符串
     * @return 建筑物ID对象
     */
    public static BuildingId of(String value) {
        return new BuildingId(value);
    }
    
    /**
     * 从Long类型ID创建建筑物ID
     * 
     * @param id Long类型ID
     * @return 建筑物ID对象
     */
    public static BuildingId of(Long id) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("建筑物ID必须为正数");
        }
        return new BuildingId("BLD-" + id);
    }
    
    /**
     * 获取ID值
     * 
     * @return ID字符串
     */
    public String getValue() {
        return value;
    }
    
    /**
     * 获取数字ID（如果是数字格式）
     * 
     * @return 数字ID
     */
    public Long getNumericId() {
        if (value.startsWith("BLD-")) {
            String numericPart = value.substring(4);
            try {
                return Long.parseLong(numericPart);
            } catch (NumberFormatException e) {
                // 如果不是数字格式，返回null
                return null;
            }
        }
        return null;
    }
    
    /**
     * 检查是否为有效的建筑物ID格式
     * 
     * @param value 待检查的字符串
     * @return 是否有效
     */
    public static boolean isValid(String value) {
        if (value == null || value.trim().isEmpty()) {
            return false;
        }
        
        String trimmed = value.trim();
        return trimmed.startsWith("BLD-") && trimmed.length() > 4;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        BuildingId that = (BuildingId) obj;
        return Objects.equals(value, that.value);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(value);
    }
    
    @Override
    public String toString() {
        return value;
    }
}