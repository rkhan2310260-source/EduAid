package com.example.EduAid.Entity;

import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "donor_gamification")
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class DonorGamification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gamification_id")
    @EqualsAndHashCode.Include
    private Integer gamificationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "donor_id", nullable = false)
    @NotNull
    @ToString.Exclude
    private Donor donor;

    @Column(name = "total_points", nullable = false)
    @Builder.Default
    private Integer totalPoints = 0;

    @Column(name = "impact_score", nullable = false)
    @Builder.Default
    private Double impactScore = 0.0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "badges_earned", columnDefinition = "JSON")
    private List<String> badgesEarned;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;
}