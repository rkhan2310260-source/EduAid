package com.example.EduAid.repository;

import com.example.EduAid.Entity.ProjectType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTypeRepository extends JpaRepository<ProjectType, Integer> {

    // Get all active project type names for filtering
    @Query(value = "SELECT type_name FROM project_types WHERE is_active = true ORDER BY type_name", nativeQuery = true)
    List<String> findAllTypeNames();

}