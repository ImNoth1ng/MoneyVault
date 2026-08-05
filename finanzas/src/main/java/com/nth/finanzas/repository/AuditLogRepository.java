package com.nth.finanzas.repository;

import com.nth.finanzas.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
    List<AuditLog> findByAffectedEntityAndEntityId(String affectedEntity, Long entityId);
    List<AuditLog> findByTimestampBetween(LocalDateTime startDate, LocalDateTime endDate);
}
