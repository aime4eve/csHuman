package com.mclimate.building;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * 建筑管理服务启动类
 * 基于Spring Boot和Spring Cloud的微服务应用
 * 
 * @author 伍志勇
 * @version 1.0
 * @since 2025-09-09
 */
@SpringBootApplication
@EnableEurekaClient
@EnableJpaRepositories(basePackages = "com.mclimate.building.infrastructure.repository")
@EnableJpaAuditing
@EnableTransactionManagement
public class BuildingServiceApplication {
    
    /**
     * 应用程序入口点
     * 
     * @param args 命令行参数
     */
    public static void main(String[] args) {
        SpringApplication.run(BuildingServiceApplication.class, args);
    }
}