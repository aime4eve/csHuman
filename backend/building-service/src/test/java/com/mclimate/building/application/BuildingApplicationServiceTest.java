package com.mclimate.building.application;

import com.mclimate.building.application.command.CreateBuildingCommand;
import com.mclimate.building.application.command.UpdateBuildingCommand;
import com.mclimate.building.application.command.AddFloorCommand;
import com.mclimate.building.application.command.AssignDeviceCommand;
import com.mclimate.building.application.dto.BuildingDto;
import com.mclimate.building.application.dto.BuildingStatisticsDto;
import com.mclimate.building.application.query.BuildingQuery;
import com.mclimate.building.domain.model.*;
import com.mclimate.building.domain.repository.BuildingRepository;
import com.mclimate.building.domain.service.BuildingDomainService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * 建筑管理应用服务测试类
 * 测试建筑管理的核心业务逻辑
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@ExtendWith(MockitoExtension.class)
class BuildingApplicationServiceTest {
    
    @Mock
    private BuildingRepository buildingRepository;
    
    @Mock
    private BuildingDomainService buildingDomainService;
    
    @InjectMocks
    private BuildingApplicationService buildingApplicationService;
    
    private Building testBuilding;
    private BuildingId testBuildingId;
    
    @BeforeEach
    void setUp() {
        testBuildingId = BuildingId.generate();
        Address address = Address.of("123 Test Street", "Test City", "Test State", "Test Country", "12345");
        Coordinates coordinates = new Coordinates(22.3193, 114.1694);
        
        testBuilding = Building.create(
            testBuildingId,
            "Test Building",
            "Test Description",
            BuildingType.OFFICE,
            address,
            coordinates
        );
    }
    
    @Test
    void createBuilding_ShouldReturnBuildingDto_WhenValidCommand() {
        // Given
        CreateBuildingCommand command = new CreateBuildingCommand();
        command.setName("Test Building");
        command.setDescription("Test Description");
        command.setType(BuildingType.OFFICE);
        command.setStreet("123 Test Street");
        command.setCity("Test City");
        command.setState("Test State");
        command.setCountry("Test Country");
        command.setPostalCode("12345");
        command.setLatitude(22.3193);
        command.setLongitude(114.1694);
        command.setTotalArea(1000.0);
        command.setConstructionYear(2020);
        
        when(buildingRepository.existsByName(anyString())).thenReturn(false);
        when(buildingRepository.save(any(Building.class))).thenReturn(testBuilding);
        
        // When
        BuildingDto result = buildingApplicationService.createBuilding(command);
        
        // Then
        assertNotNull(result);
        assertEquals("Test Building", result.getName());
        assertEquals("Test Description", result.getDescription());
        assertEquals(BuildingType.OFFICE, result.getType());
        assertEquals(BuildingStatus.ACTIVE, result.getStatus());
        
        verify(buildingRepository).existsByName("Test Building");
        verify(buildingRepository).save(any(Building.class));
    }
    
    @Test
    void createBuilding_ShouldThrowException_WhenBuildingNameExists() {
        // Given
        CreateBuildingCommand command = new CreateBuildingCommand();
        command.setName("Existing Building");
        
        when(buildingRepository.existsByName("Existing Building")).thenReturn(true);
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            buildingApplicationService.createBuilding(command);
        });
        
        verify(buildingRepository).existsByName("Existing Building");
        verify(buildingRepository, never()).save(any(Building.class));
    }
    
    @Test
    void updateBuilding_ShouldReturnUpdatedBuildingDto_WhenValidCommand() {
        // Given
        UpdateBuildingCommand command = new UpdateBuildingCommand();
        command.setBuildingId(testBuildingId.getValue());
        command.setName("Updated Building");
        command.setDescription("Updated Description");
        command.setStatus(BuildingStatus.MAINTENANCE);
        
        when(buildingRepository.findById(testBuildingId)).thenReturn(Optional.of(testBuilding));
        when(buildingRepository.save(any(Building.class))).thenReturn(testBuilding);
        
        // When
        BuildingDto result = buildingApplicationService.updateBuilding(command);
        
        // Then
        assertNotNull(result);
        verify(buildingRepository).findById(testBuildingId);
        verify(buildingRepository).save(testBuilding);
    }
    
    @Test
    void updateBuilding_ShouldThrowException_WhenBuildingNotFound() {
        // Given
        UpdateBuildingCommand command = new UpdateBuildingCommand();
        command.setBuildingId("non-existent-id");
        
        BuildingId nonExistentId = BuildingId.of("non-existent-id");
        when(buildingRepository.findById(nonExistentId)).thenReturn(Optional.empty());
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            buildingApplicationService.updateBuilding(command);
        });
        
        verify(buildingRepository).findById(nonExistentId);
        verify(buildingRepository, never()).save(any(Building.class));
    }
    
    @Test
    void getBuildingById_ShouldReturnBuildingDto_WhenBuildingExists() {
        // Given
        when(buildingRepository.findById(testBuildingId)).thenReturn(Optional.of(testBuilding));
        
        // When
        BuildingDto result = buildingApplicationService.getBuildingById(testBuildingId.getValue());
        
        // Then
        assertNotNull(result);
        assertEquals(testBuilding.getName(), result.getName());
        assertEquals(testBuilding.getDescription(), result.getDescription());
        
        verify(buildingRepository).findById(testBuildingId);
    }
    
    @Test
    void getBuildingById_ShouldReturnNull_WhenBuildingNotExists() {
        // Given
        when(buildingRepository.findById(testBuildingId)).thenReturn(Optional.empty());
        
        // When
        BuildingDto result = buildingApplicationService.getBuildingById(testBuildingId.getValue());
        
        // Then
        assertNull(result);
        verify(buildingRepository).findById(testBuildingId);
    }
    
    @Test
    void getBuildings_ShouldReturnPagedResults_WhenValidQuery() {
        // Given
        BuildingQuery query = new BuildingQuery();
        query.setName("Test");
        query.setType(BuildingType.OFFICE);
        
        Pageable pageable = PageRequest.of(0, 10);
        List<Building> buildings = Arrays.asList(testBuilding);
        Page<Building> buildingPage = new PageImpl<>(buildings, pageable, 1);
        
        when(buildingRepository.findByQuery(query, pageable)).thenReturn(buildingPage);
        
        // When
        Page<BuildingDto> result = buildingApplicationService.getBuildings(query, pageable);
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());
        assertEquals(testBuilding.getName(), result.getContent().get(0).getName());
        
        verify(buildingRepository).findByQuery(query, pageable);
    }
    
    @Test
    void addFloor_ShouldSucceed_WhenValidCommand() {
        // Given
        AddFloorCommand command = new AddFloorCommand();
        command.setBuildingId(testBuildingId.getValue());
        command.setName("Test Floor");
        command.setFloorNumber(1);
        command.setDescription("Test Floor Description");
        
        when(buildingRepository.findById(testBuildingId)).thenReturn(Optional.of(testBuilding));
        when(buildingRepository.save(any(Building.class))).thenReturn(testBuilding);
        
        // When
        assertDoesNotThrow(() -> {
            buildingApplicationService.addFloor(command);
        });
        
        // Then
        verify(buildingRepository).findById(testBuildingId);
        verify(buildingRepository).save(testBuilding);
    }
    
    @Test
    void assignDevice_ShouldSucceed_WhenValidCommand() {
        // Given
        AssignDeviceCommand command = new AssignDeviceCommand();
        command.setBuildingId(testBuildingId.getValue());
        command.setDeviceId("device-001");
        command.setDeviceName("Test Device");
        command.setDeviceType("TEMPERATURE_SENSOR");
        command.setLocation("Test Location");
        command.setDescription("Test Device Description");
        
        when(buildingRepository.findById(testBuildingId)).thenReturn(Optional.of(testBuilding));
        when(buildingRepository.save(any(Building.class))).thenReturn(testBuilding);
        
        // When
        assertDoesNotThrow(() -> {
            buildingApplicationService.assignDevice(command);
        });
        
        // Then
        verify(buildingRepository).findById(testBuildingId);
        verify(buildingRepository).save(testBuilding);
    }
    
    @Test
    void getBuildingStatistics_ShouldReturnStatistics() {
        // Given
        BuildingStatistics statistics = new BuildingStatistics(
            10L, 8L, 2L, 0L,
            5L, 3L, 2L, 0L,
            100L, 50000.0,
            10.0, 5000.0
        );
        
        when(buildingRepository.getBuildingStatistics()).thenReturn(statistics);
        
        // When
        BuildingStatisticsDto result = buildingApplicationService.getBuildingStatistics();
        
        // Then
        assertNotNull(result);
        assertEquals(10L, result.getTotalBuildings());
        assertEquals(8L, result.getActiveBuildings());
        assertEquals(2L, result.getInactiveBuildings());
        assertEquals(5L, result.getOfficeBuildings());
        
        verify(buildingRepository).getBuildingStatistics();
    }
    
    @Test
    void getNearbyBuildings_ShouldReturnNearbyBuildings_WhenValidCoordinates() {
        // Given
        double latitude = 22.3193;
        double longitude = 114.1694;
        double radiusKm = 5.0;
        
        List<Building> nearbyBuildings = Arrays.asList(testBuilding);
        when(buildingRepository.findNearbyBuildings(latitude, longitude, radiusKm))
            .thenReturn(nearbyBuildings);
        
        // When
        List<BuildingDto> result = buildingApplicationService.getNearbyBuildings(
            latitude, longitude, radiusKm);
        
        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(testBuilding.getName(), result.get(0).getName());
        
        verify(buildingRepository).findNearbyBuildings(latitude, longitude, radiusKm);
    }
    
    @Test
    void getNearbyBuildings_ShouldThrowException_WhenInvalidCoordinates() {
        // Given
        double invalidLatitude = 91.0; // 超出有效范围
        double longitude = 114.1694;
        double radiusKm = 5.0;
        
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            buildingApplicationService.getNearbyBuildings(invalidLatitude, longitude, radiusKm);
        });
        
        verify(buildingRepository, never()).findNearbyBuildings(anyDouble(), anyDouble(), anyDouble());
    }
}