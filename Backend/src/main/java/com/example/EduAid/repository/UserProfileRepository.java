package com.example.EduAid.repository;

import com.example.EduAid.Entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Integer> {

    java.util.Optional<UserProfile> findByUser_UserId(Integer userId);

}