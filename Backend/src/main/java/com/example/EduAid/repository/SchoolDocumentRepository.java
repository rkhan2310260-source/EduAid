package com.example.EduAid.repository;

import com.example.EduAid.Entity.SchoolDocument;
import com.example.EduAid.Entity.SchoolDocument.DocumentType;
import com.example.EduAid.Entity.School;
import com.example.EduAid.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolDocumentRepository extends JpaRepository<SchoolDocument, Integer> {


}