package com.mclimate.building.domain.valueobject;

import com.mclimate.common.domain.ValueObject;

import java.util.Objects;

/**
 * 地址值对象
 * 表示建筑物的完整地址信息
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
public class Address implements ValueObject {
    
    private final String street;
    private final String city;
    private final String state;
    private final String country;
    private final String postalCode;
    private final String fullAddress;
    
    /**
     * 构造函数
     * 
     * @param street 街道地址
     * @param city 城市
     * @param state 州/省
     * @param country 国家
     * @param postalCode 邮政编码
     */
    public Address(String street, String city, String state, String country, String postalCode) {
        if (street == null || street.trim().isEmpty()) {
            throw new IllegalArgumentException("街道地址不能为空");
        }
        if (city == null || city.trim().isEmpty()) {
            throw new IllegalArgumentException("城市不能为空");
        }
        if (country == null || country.trim().isEmpty()) {
            throw new IllegalArgumentException("国家不能为空");
        }
        
        this.street = street.trim();
        this.city = city.trim();
        this.state = state != null ? state.trim() : "";
        this.country = country.trim();
        this.postalCode = postalCode != null ? postalCode.trim() : "";
        this.fullAddress = buildFullAddress();
    }
    
    /**
     * 简化构造函数，只需要街道和城市
     * 
     * @param street 街道地址
     * @param city 城市
     * @param country 国家
     */
    public Address(String street, String city, String country) {
        this(street, city, null, country, null);
    }
    
    /**
     * 从完整地址字符串创建地址对象
     * 
     * @param fullAddress 完整地址字符串
     * @return 地址对象
     */
    public static Address fromFullAddress(String fullAddress) {
        if (fullAddress == null || fullAddress.trim().isEmpty()) {
            throw new IllegalArgumentException("完整地址不能为空");
        }
        
        // 简单解析，实际项目中可能需要更复杂的地址解析逻辑
        String[] parts = fullAddress.split(",");
        if (parts.length < 2) {
            throw new IllegalArgumentException("地址格式不正确，至少需要街道和城市");
        }
        
        String street = parts[0].trim();
        String city = parts[1].trim();
        String country = parts.length > 2 ? parts[parts.length - 1].trim() : "Unknown";
        
        return new Address(street, city, country);
    }
    
    /**
     * 构建完整地址字符串
     * 
     * @return 完整地址
     */
    private String buildFullAddress() {
        StringBuilder sb = new StringBuilder();
        sb.append(street);
        
        if (!city.isEmpty()) {
            sb.append(", ").append(city);
        }
        
        if (!state.isEmpty()) {
            sb.append(", ").append(state);
        }
        
        if (!postalCode.isEmpty()) {
            sb.append(" ").append(postalCode);
        }
        
        if (!country.isEmpty()) {
            sb.append(", ").append(country);
        }
        
        return sb.toString();
    }
    
    /**
     * 检查地址是否在指定城市
     * 
     * @param cityName 城市名称
     * @return 是否在指定城市
     */
    public boolean isInCity(String cityName) {
        return city.equalsIgnoreCase(cityName);
    }
    
    /**
     * 检查地址是否在指定国家
     * 
     * @param countryName 国家名称
     * @return 是否在指定国家
     */
    public boolean isInCountry(String countryName) {
        return country.equalsIgnoreCase(countryName);
    }
    
    /**
     * 获取地址的简短描述（街道 + 城市）
     * 
     * @return 简短地址描述
     */
    public String getShortDescription() {
        return street + ", " + city;
    }
    
    // Getters
    public String getStreet() {
        return street;
    }
    
    public String getCity() {
        return city;
    }
    
    public String getState() {
        return state;
    }
    
    public String getCountry() {
        return country;
    }
    
    public String getPostalCode() {
        return postalCode;
    }
    
    public String getFullAddress() {
        return fullAddress;
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Address address = (Address) obj;
        return Objects.equals(street, address.street) &&
               Objects.equals(city, address.city) &&
               Objects.equals(state, address.state) &&
               Objects.equals(country, address.country) &&
               Objects.equals(postalCode, address.postalCode);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(street, city, state, country, postalCode);
    }
    
    @Override
    public String toString() {
        return fullAddress;
    }
}