package com.example.EduAid.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static images from the resources/static/images directory
        registry.addResourceHandler("/images/**")
                .addResourceLocations("classpath:/static/images/");
        
        // Keep the old mapping for backward compatibility
        registry.addResourceHandler("/static/images/**")
                .addResourceLocations("classpath:/static/images/");
        
        // AI FIX: Serve ALL uploaded files (project_transparency, fund_transparency, school_projects)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("classpath:/static/uploads/")
                .setCachePeriod(0); // Disable cache for development
    }
}