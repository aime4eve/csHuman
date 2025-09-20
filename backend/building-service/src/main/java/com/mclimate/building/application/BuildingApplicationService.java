package com.mclimate.building.application;

import com.mclimate.building.application.command.*;
import com.mclimate.building.application.dto.*;
import com.mclimate.building.domain.model.*;
import com.mclimate.building.domain.repository.*;
import com.mclimate.building.domain.service.*;
import com.mclimate.building.domain.valueobject.*;
import com.mclimate.common.application.ApplicationService;
import com.mclimate.common.domain.DomainEventPublisher;
import com.mclimate.common.exception.*;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 建筑管理应用服务
 * 负责协调建筑管理相关的业务流程和领域对象交互
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@Service
@Transactional
public class BuildingApplicationService implements ApplicationService {
    
    private final BuildingRepository buildingRepository;
    private final FloorRepository floorRepository;
    private final RoomRepository roomRepository;
    private final DeviceAssignmentRepository deviceAssignmentRepository;
    private final BuildingDomainService buildingDomainService;
    private final DomainEventPublisher eventPublisher;
    
    /**
     * 构造函数
     */
    public BuildingApplicationService(
            BuildingRepository buildingRepository,
            FloorRepository floorRepository,
            RoomRepository roomRepository,
            DeviceAssignmentRepository deviceAssignmentRepository,
            BuildingDomainService buildingDomainService,
            DomainEventPublisher eventPublisher) {
        this.buildingRepository = buildingRepository;
        this.floorRepository = floorRepository;
        this.roomRepository = roomRepository;
        this.deviceAssignmentRepository = deviceAssignmentRepository;
        this.buildingDomainService = buildingDomainService;
        this.eventPublisher = eventPublisher;
    }
    
    /**
     * 创建建筑物
     * 
     * @param command 创建建筑物命令
     * @return 建筑物DTO
     */
    public BuildingDto createBuilding(CreateBuildingCommand command) {
        // 验证命令
        validateCreateBuildingCommand(command);
        
        // 检查建筑物名称是否已存在
        if (buildingRepository.existsByName(command.getName())) {
            throw new BusinessException("建筑物名称已存在: " + command.getName());
        }
        
        // 创建地址和坐标值对象
        Address address = new Address(
            command.getStreet(),
            command.getCity(),
            command.getState(),
            command.getCountry(),
            command.getPostalCode()
        );
        
        Coordinates coordinates = null;
        if (command.getLatitude() != null && command.getLongitude() != null) {
            coordinates = new Coordinates(
                command.getLatitude(),
                command.getLongitude()
            );
        }
        
        BuildingType buildingType = BuildingType.valueOf(command.getType().toUpperCase());
        
        // 创建建筑物聚合根
        Building building = Building.create(
            command.getName(),
            address,
            coordinates,
            buildingType
        );
        
        // 保存建筑物
        Building savedBuilding = buildingRepository.save(building);
        
        // 发布领域事件
        eventPublisher.publishEvents(savedBuilding.getDomainEvents());
        savedBuilding.clearDomainEvents();
        
        return BuildingDto.from(savedBuilding);
    }
    
    /**
     * 更新建筑物信息
     * 
     * @param command 更新建筑物命令
     * @return 更新后的建筑物DTO
     */
    public BuildingDto updateBuilding(UpdateBuildingCommand command) {
        // 查找建筑物
        Building building = buildingRepository.findById(BuildingId.of(command.getBuildingId()))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + command.getBuildingId()));
        
        // 更新基本信息
        Address newAddress = null;
        if (command.getStreet() != null || command.getCity() != null) {
            newAddress = new Address(
                command.getStreet() != null ? command.getStreet() : building.getAddress().getStreet(),
                command.getCity() != null ? command.getCity() : building.getAddress().getCity(),
                command.getState() != null ? command.getState() : building.getAddress().getState(),
                command.getCountry() != null ? command.getCountry() : building.getAddress().getCountry(),
                command.getPostalCode() != null ? command.getPostalCode() : building.getAddress().getPostalCode()
            );
        }
        
        Coordinates newCoordinates = null;
        if (command.getLatitude() != null && command.getLongitude() != null) {
            newCoordinates = new Coordinates(command.getLatitude(), command.getLongitude());
        }
        
        building.updateBasicInfo(
            command.getName(),
            newAddress,
            newCoordinates
        );
        
        // 保存更新
        Building updatedBuilding = buildingRepository.save(building);
        
        // 发布领域事件
        eventPublisher.publishEvents(updatedBuilding.getDomainEvents());
        updatedBuilding.clearDomainEvents();
        
        return BuildingDto.from(updatedBuilding);
    }
    
    /**
     * 添加楼层
     * 
     * @param command 添加楼层命令
     * @return 楼层DTO
     */
    public FloorDto addFloor(AddFloorCommand command) {
        // 查找建筑物
        Building building = buildingRepository.findById(BuildingId.of(command.getBuildingId()))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + command.getBuildingId()));
        
        // 添加楼层
        Floor floor = building.addFloor(command.getFloorName(), command.getFloorNumber());
        
        // 保存建筑物（级联保存楼层）
        Building savedBuilding = buildingRepository.save(building);
        
        // 发布领域事件
        eventPublisher.publishEvents(savedBuilding.getDomainEvents());
        savedBuilding.clearDomainEvents();
        
        return FloorDto.from(floor);
    }
    
    /**
     * 分配设备到建筑物
     * 
     * @param command 分配设备命令
     */
    public void assignDevice(AssignDeviceCommand command) {
        // 查找建筑物
        Building building = buildingRepository.findById(BuildingId.of(command.getBuildingId()))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + command.getBuildingId()));
        
        // 验证设备是否存在（通过领域服务）
        if (!buildingDomainService.deviceExists(DeviceId.of(command.getDeviceId()))) {
            throw new EntityNotFoundException("设备不存在: " + command.getDeviceId());
        }
        
        // 验证房间是否存在（如果指定了房间）
        Optional<RoomId> roomId = Optional.empty();
        if (command.getRoomId() != null) {
            if (!roomRepository.existsById(RoomId.of(command.getRoomId()))) {
                throw new EntityNotFoundException("房间不存在: " + command.getRoomId());
            }
            roomId = Optional.of(RoomId.of(command.getRoomId()));
        }
        
        // 分配设备
        building.assignDevice(
            DeviceId.of(command.getDeviceId()),
            roomId,
            UserId.of(command.getAssignedBy())
        );
        
        // 保存建筑物
        Building savedBuilding = buildingRepository.save(building);
        
        // 发布领域事件
        eventPublisher.publishEvents(savedBuilding.getDomainEvents());
        savedBuilding.clearDomainEvents();
    }
    
    /**
     * 取消设备分配
     * 
     * @param command 取消设备分配命令
     */
    public void unassignDevice(UnassignDeviceCommand command) {
        // 查找建筑物
        Building building = buildingRepository.findById(BuildingId.of(command.getBuildingId()))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + command.getBuildingId()));
        
        // 取消设备分配
        building.unassignDevice(
            DeviceId.of(command.getDeviceId()),
            UserId.of(command.getUnassignedBy())
        );
        
        // 保存建筑物
        Building savedBuilding = buildingRepository.save(building);
        
        // 发布领域事件
        eventPublisher.publishEvents(savedBuilding.getDomainEvents());
        savedBuilding.clearDomainEvents();
    }
    
    /**
     * 获取建筑物详情
     * 
     * @param buildingId 建筑物ID
     * @return 建筑物DTO
     */
    @Transactional(readOnly = true)
    public BuildingDto getBuildingById(String buildingId) {
        Building building = buildingRepository.findById(BuildingId.of(buildingId))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + buildingId));
        
        return BuildingDto.from(building);
    }
    
    /**
     * 获取建筑物列表
     * 
     * @param query 查询条件
     * @return 建筑物DTO列表
     */
    @Transactional(readOnly = true)
    public List<BuildingDto> getBuildings(BuildingQuery query) {
        List<Building> buildings = buildingRepository.findByQuery(query);
        return buildings.stream()
            .map(BuildingDto::from)
            .collect(Collectors.toList());
    }
    
    /**
     * 获取建筑物统计信息
     * 
     * @param buildingId 建筑物ID
     * @return 建筑物统计DTO
     */
    @Transactional(readOnly = true)
    public BuildingStatisticsDto getBuildingStatistics(String buildingId) {
        Building building = buildingRepository.findById(BuildingId.of(buildingId))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + buildingId));
        
        BuildingStatistics statistics = building.calculateStatistics();
        return BuildingStatisticsDto.from(statistics);
    }
    
    /**
     * 删除建筑物
     * 
     * @param command 删除建筑物命令
     */
    public void deleteBuilding(DeleteBuildingCommand command) {
        // 查找建筑物
        Building building = buildingRepository.findById(BuildingId.of(command.getBuildingId()))
            .orElseThrow(() -> new EntityNotFoundException("建筑物不存在: " + command.getBuildingId()));
        
        // 检查是否可以删除
        if (!building.canBeDeleted()) {
            throw new BusinessException("建筑物不能删除，存在关联的设备或房间");
        }
        
        // 删除建筑物
        buildingRepository.delete(building);
        
        // 发布建筑物删除事件
        eventPublisher.publish(new BuildingDeletedEvent(building.getId(), command.getDeletedBy()));
    }
    
    /**
     * 搜索附近的建筑物
     * 
     * @param latitude 纬度
     * @param longitude 经度
     * @param radiusKm 搜索半径（千米）
     * @return 附近的建筑物列表
     */
    @Transactional(readOnly = true)
    public List<BuildingDto> findNearbyBuildings(double latitude, double longitude, double radiusKm) {
        Coordinates center = new Coordinates(latitude, longitude);
        List<Building> buildings = buildingRepository.findNearby(center, radiusKm);
        
        return buildings.stream()
            .map(BuildingDto::from)
            .collect(Collectors.toList());
    }
    
    /**
     * 验证创建建筑物命令
     * 
     * @param command 创建建筑物命令
     */
    private void validateCreateBuildingCommand(CreateBuildingCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("创建建筑物命令不能为空");
        }
        if (command.getName() == null || command.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("建筑物名称不能为空");
        }
        if (command.getStreet() == null || command.getStreet().trim().isEmpty()) {
            throw new IllegalArgumentException("街道地址不能为空");
        }
        if (command.getCity() == null || command.getCity().trim().isEmpty()) {
            throw new IllegalArgumentException("城市不能为空");
        }
        if (command.getCountry() == null || command.getCountry().trim().isEmpty()) {
            throw new IllegalArgumentException("国家不能为空");
        }
        if (command.getType() == null || command.getType().trim().isEmpty()) {
            throw new IllegalArgumentException("建筑物类型不能为空");
        }
        
        // 验证坐标
        if (command.getLatitude() != null && command.getLongitude() != null) {
            if (!Coordinates.isValid(command.getLatitude(), command.getLongitude())) {
                throw new IllegalArgumentException("坐标格式不正确");
            }
        }
        
        // 验证建筑物类型
        try {
            BuildingType.valueOf(command.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("不支持的建筑物类型: " + command.getType());
        }
    }
}

/**
 * 建筑物删除事件
 * 
 * @author 伍志勇
 */
class BuildingDeletedEvent implements com.mclimate.common.domain.DomainEvent {
    private final BuildingId buildingId;
    private final UserId deletedBy;
    private final java.time.LocalDateTime occurredOn;
    
    public BuildingDeletedEvent(BuildingId buildingId, UserId deletedBy) {
        this.buildingId = buildingId;
        this.deletedBy = deletedBy;
        this.occurredOn = java.time.LocalDateTime.now();
    }
    
    @Override
    public java.time.LocalDateTime occurredOn() {
        return occurredOn;
    }
    
    public BuildingId getBuildingId() {
        return buildingId;
    }
    
    public UserId getDeletedBy() {
        return deletedBy;
    }
}