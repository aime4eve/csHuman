package com.mclimate.building.interfaces.rest;

import com.mclimate.building.application.BuildingApplicationService;
import com.mclimate.building.application.command.*;
import com.mclimate.building.application.dto.*;
import com.mclimate.building.application.query.BuildingQuery;
import com.mclimate.building.domain.model.BuildingType;
import com.mclimate.building.domain.model.BuildingStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.util.List;

/**
 * 建筑管理REST控制器
 * 提供建筑管理相关的API接口
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@RestController
@RequestMapping("/api/v1/buildings")
@Validated
@CrossOrigin(origins = "*")
public class BuildingController {
    
    private final BuildingApplicationService buildingApplicationService;
    
    @Autowired
    public BuildingController(BuildingApplicationService buildingApplicationService) {
        this.buildingApplicationService = buildingApplicationService;
    }
    
    /**
     * 创建建筑物
     * 
     * @param command 创建建筑物命令
     * @return 创建的建筑物信息
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BuildingDto>> createBuilding(
            @Valid @RequestBody CreateBuildingCommand command) {
        try {
            BuildingDto building = buildingApplicationService.createBuilding(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(building, "建筑物创建成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("建筑物创建失败: " + e.getMessage()));
        }
    }
    
    /**
     * 更新建筑物
     * 
     * @param buildingId 建筑物ID
     * @param command 更新建筑物命令
     * @return 更新后的建筑物信息
     */
    @PutMapping("/{buildingId}")
    public ResponseEntity<ApiResponse<BuildingDto>> updateBuilding(
            @PathVariable @NotBlank String buildingId,
            @Valid @RequestBody UpdateBuildingCommand command) {
        try {
            command.setBuildingId(buildingId);
            BuildingDto building = buildingApplicationService.updateBuilding(command);
            return ResponseEntity.ok(ApiResponse.success(building, "建筑物更新成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("建筑物更新失败: " + e.getMessage()));
        }
    }
    
    /**
     * 删除建筑物
     * 
     * @param buildingId 建筑物ID
     * @return 删除结果
     */
    @DeleteMapping("/{buildingId}")
    public ResponseEntity<ApiResponse<Void>> deleteBuilding(
            @PathVariable @NotBlank String buildingId) {
        try {
            DeleteBuildingCommand command = new DeleteBuildingCommand(buildingId);
            buildingApplicationService.deleteBuilding(command);
            return ResponseEntity.ok(ApiResponse.success(null, "建筑物删除成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("建筑物删除失败: " + e.getMessage()));
        }
    }
    
    /**
     * 根据ID获取建筑物
     * 
     * @param buildingId 建筑物ID
     * @return 建筑物信息
     */
    @GetMapping("/{buildingId}")
    public ResponseEntity<ApiResponse<BuildingDto>> getBuildingById(
            @PathVariable @NotBlank String buildingId) {
        try {
            BuildingDto building = buildingApplicationService.getBuildingById(buildingId);
            if (building != null) {
                return ResponseEntity.ok(ApiResponse.success(building, "获取建筑物信息成功"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("建筑物不存在"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取建筑物信息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 分页查询建筑物
     * 
     * @param name 建筑物名称（可选）
     * @param type 建筑物类型（可选）
     * @param status 建筑物状态（可选）
     * @param city 城市（可选）
     * @param pageable 分页参数
     * @return 建筑物分页列表
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<BuildingDto>>> getBuildings(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) BuildingType type,
            @RequestParam(required = false) BuildingStatus status,
            @RequestParam(required = false) String city,
            Pageable pageable) {
        try {
            BuildingQuery query = new BuildingQuery();
            query.setName(name);
            query.setType(type);
            query.setStatus(status);
            query.setCity(city);
            
            Page<BuildingDto> buildings = buildingApplicationService.getBuildings(query, pageable);
            return ResponseEntity.ok(ApiResponse.success(buildings, "获取建筑物列表成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取建筑物列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 添加楼层
     * 
     * @param buildingId 建筑物ID
     * @param command 添加楼层命令
     * @return 操作结果
     */
    @PostMapping("/{buildingId}/floors")
    public ResponseEntity<ApiResponse<Void>> addFloor(
            @PathVariable @NotBlank String buildingId,
            @Valid @RequestBody AddFloorCommand command) {
        try {
            command.setBuildingId(buildingId);
            buildingApplicationService.addFloor(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(null, "楼层添加成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("楼层添加失败: " + e.getMessage()));
        }
    }
    
    /**
     * 分配设备
     * 
     * @param buildingId 建筑物ID
     * @param command 分配设备命令
     * @return 操作结果
     */
    @PostMapping("/{buildingId}/devices")
    public ResponseEntity<ApiResponse<Void>> assignDevice(
            @PathVariable @NotBlank String buildingId,
            @Valid @RequestBody AssignDeviceCommand command) {
        try {
            command.setBuildingId(buildingId);
            buildingApplicationService.assignDevice(command);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(null, "设备分配成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("设备分配失败: " + e.getMessage()));
        }
    }
    
    /**
     * 取消设备分配
     * 
     * @param buildingId 建筑物ID
     * @param deviceId 设备ID
     * @return 操作结果
     */
    @DeleteMapping("/{buildingId}/devices/{deviceId}")
    public ResponseEntity<ApiResponse<Void>> unassignDevice(
            @PathVariable @NotBlank String buildingId,
            @PathVariable @NotBlank String deviceId) {
        try {
            UnassignDeviceCommand command = new UnassignDeviceCommand(buildingId, deviceId);
            buildingApplicationService.unassignDevice(command);
            return ResponseEntity.ok(ApiResponse.success(null, "设备取消分配成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("设备取消分配失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取建筑物的设备分配列表
     * 
     * @param buildingId 建筑物ID
     * @return 设备分配列表
     */
    @GetMapping("/{buildingId}/devices")
    public ResponseEntity<ApiResponse<List<DeviceAssignmentDto>>> getBuildingDevices(
            @PathVariable @NotBlank String buildingId) {
        try {
            List<DeviceAssignmentDto> devices = buildingApplicationService.getBuildingDevices(buildingId);
            return ResponseEntity.ok(ApiResponse.success(devices, "获取建筑物设备列表成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取建筑物设备列表失败: " + e.getMessage()));
        }
    }
    
    /**
     * 获取建筑物统计信息
     * 
     * @return 统计信息
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<BuildingStatisticsDto>> getBuildingStatistics() {
        try {
            BuildingStatisticsDto statistics = buildingApplicationService.getBuildingStatistics();
            return ResponseEntity.ok(ApiResponse.success(statistics, "获取建筑物统计信息成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取建筑物统计信息失败: " + e.getMessage()));
        }
    }
    
    /**
     * 搜索附近的建筑物
     * 
     * @param latitude 纬度
     * @param longitude 经度
     * @param radiusKm 搜索半径（公里）
     * @return 附近的建筑物列表
     */
    @GetMapping("/nearby")
    public ResponseEntity<ApiResponse<List<BuildingDto>>> getNearbyBuildings(
            @RequestParam @NotNull Double latitude,
            @RequestParam @NotNull Double longitude,
            @RequestParam(defaultValue = "5.0") Double radiusKm) {
        try {
            List<BuildingDto> buildings = buildingApplicationService.getNearbyBuildings(
                    latitude, longitude, radiusKm);
            return ResponseEntity.ok(ApiResponse.success(buildings, "获取附近建筑物成功"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("获取附近建筑物失败: " + e.getMessage()));
        }
    }
}

/**
 * API响应包装类
 * 
 * @author 伍志勇
 */
class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private long timestamp;
    
    public ApiResponse() {
        this.timestamp = System.currentTimeMillis();
    }
    
    public ApiResponse(boolean success, String message, T data) {
        this();
        this.success = success;
        this.message = message;
        this.data = data;
    }
    
    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
    
    // Getters and Setters
    
    public boolean isSuccess() {
        return success;
    }
    
    public void setSuccess(boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public T getData() {
        return data;
    }
    
    public void setData(T data) {
        this.data = data;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
}