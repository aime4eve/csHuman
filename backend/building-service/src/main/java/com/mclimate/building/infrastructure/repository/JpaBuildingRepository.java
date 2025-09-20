package com.mclimate.building.infrastructure.repository;

import com.mclimate.building.application.dto.BuildingQuery;
import com.mclimate.building.domain.model.Building;
import com.mclimate.building.domain.repository.BuildingRepository;
import com.mclimate.building.domain.valueobject.*;
import com.mclimate.building.infrastructure.entity.BuildingEntity;
import com.mclimate.building.infrastructure.mapper.BuildingMapper;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import javax.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 建筑物仓储JPA实现
 * 负责建筑物聚合根的持久化操作
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@Repository
public class JpaBuildingRepository implements BuildingRepository {
    
    private final SpringDataBuildingRepository springDataRepository;
    private final BuildingMapper buildingMapper;
    
    /**
     * 构造函数
     */
    public JpaBuildingRepository(SpringDataBuildingRepository springDataRepository,
                               BuildingMapper buildingMapper) {
        this.springDataRepository = springDataRepository;
        this.buildingMapper = buildingMapper;
    }
    
    @Override
    public Building save(Building building) {
        BuildingEntity entity = buildingMapper.toEntity(building);
        BuildingEntity savedEntity = springDataRepository.save(entity);
        return buildingMapper.toDomain(savedEntity);
    }
    
    @Override
    public Optional<Building> findById(BuildingId buildingId) {
        return springDataRepository.findById(buildingId.getValue())
            .map(buildingMapper::toDomain);
    }
    
    @Override
    public List<Building> findAll() {
        return springDataRepository.findAll().stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Building> findByQuery(BuildingQuery query) {
        Specification<BuildingEntity> spec = createSpecification(query);
        
        // 创建分页和排序
        Sort sort = createSort(query);
        Pageable pageable = PageRequest.of(query.getPage(), query.getSize(), sort);
        
        Page<BuildingEntity> page = springDataRepository.findAll(spec, pageable);
        
        return page.getContent().stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Building> findNearby(Coordinates center, double radiusKm) {
        // 使用Haversine公式计算距离
        double lat = center.getLatitude();
        double lon = center.getLongitude();
        
        List<BuildingEntity> entities = springDataRepository.findNearbyBuildings(
            lat, lon, radiusKm
        );
        
        return entities.stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public boolean existsByName(String name) {
        return springDataRepository.existsByNameIgnoreCase(name);
    }
    
    @Override
    public boolean existsById(BuildingId buildingId) {
        return springDataRepository.existsById(buildingId.getValue());
    }
    
    @Override
    public void delete(Building building) {
        springDataRepository.deleteById(building.getId().getValue());
    }
    
    @Override
    public void deleteById(BuildingId buildingId) {
        springDataRepository.deleteById(buildingId.getValue());
    }
    
    @Override
    public long count() {
        return springDataRepository.count();
    }
    
    @Override
    public List<Building> findByType(BuildingType type) {
        return springDataRepository.findByType(type.name()).stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Building> findByStatus(BuildingStatus status) {
        return springDataRepository.findByStatus(status.name()).stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Building> findByCity(String city) {
        return springDataRepository.findByCityIgnoreCase(city).stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<Building> findByCountry(String country) {
        return springDataRepository.findByCountryIgnoreCase(country).stream()
            .map(buildingMapper::toDomain)
            .collect(Collectors.toList());
    }
    
    /**
     * 创建查询规范
     * 
     * @param query 查询条件
     * @return JPA规范
     */
    private Specification<BuildingEntity> createSpecification(BuildingQuery query) {
        return (root, criteriaQuery, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // 名称模糊查询
            if (query.hasNameQuery()) {
                predicates.add(criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("name")),
                    "%" + query.getName().toLowerCase() + "%"
                ));
            }
            
            // 城市查询
            if (query.getCity() != null && !query.getCity().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("city")),
                    query.getCity().toLowerCase()
                ));
            }
            
            // 国家查询
            if (query.getCountry() != null && !query.getCountry().trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(
                    criteriaBuilder.lower(root.get("country")),
                    query.getCountry().toLowerCase()
                ));
            }
            
            // 建筑物类型查询
            if (query.getType() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("type"),
                    query.getType().name()
                ));
            }
            
            // 建筑物状态查询
            if (query.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(
                    root.get("status"),
                    query.getStatus().name()
                ));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * 创建排序
     * 
     * @param query 查询条件
     * @return 排序对象
     */
    private Sort createSort(BuildingQuery query) {
        Sort.Direction direction = "DESC".equalsIgnoreCase(query.getSortDirection()) 
            ? Sort.Direction.DESC 
            : Sort.Direction.ASC;
        
        return Sort.by(direction, query.getSortBy());
    }
}

/**
 * Spring Data JPA 仓储接口
 * 
 * @author 伍志勇
 */
interface SpringDataBuildingRepository extends org.springframework.data.jpa.repository.JpaRepository<BuildingEntity, String>,
        org.springframework.data.jpa.repository.JpaSpecificationExecutor<BuildingEntity> {
    
    /**
     * 根据名称检查是否存在（忽略大小写）
     */
    boolean existsByNameIgnoreCase(String name);
    
    /**
     * 根据类型查找建筑物
     */
    List<BuildingEntity> findByType(String type);
    
    /**
     * 根据状态查找建筑物
     */
    List<BuildingEntity> findByStatus(String status);
    
    /**
     * 根据城市查找建筑物（忽略大小写）
     */
    List<BuildingEntity> findByCityIgnoreCase(String city);
    
    /**
     * 根据国家查找建筑物（忽略大小写）
     */
    List<BuildingEntity> findByCountryIgnoreCase(String country);
    
    /**
     * 查找附近的建筑物
     * 使用原生SQL查询，基于Haversine公式计算距离
     */
    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT * FROM buildings b WHERE " +
        "(6371 * acos(cos(radians(?1)) * cos(radians(b.latitude)) * " +
        "cos(radians(b.longitude) - radians(?2)) + sin(radians(?1)) * " +
        "sin(radians(b.latitude)))) <= ?3 " +
        "AND b.latitude IS NOT NULL AND b.longitude IS NOT NULL",
        nativeQuery = true)
    List<BuildingEntity> findNearbyBuildings(double latitude, double longitude, double radiusKm);
    
    /**
     * 根据名称模糊查询
     */
    List<BuildingEntity> findByNameContainingIgnoreCase(String name);
    
    /**
     * 统计指定类型的建筑物数量
     */
    long countByType(String type);
    
    /**
     * 统计指定状态的建筑物数量
     */
    long countByStatus(String status);
    
    /**
     * 统计指定城市的建筑物数量
     */
    long countByCityIgnoreCase(String city);
}