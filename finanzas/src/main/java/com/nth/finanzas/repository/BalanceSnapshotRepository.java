package com.nth.finanzas.repository;

import com.nth.finanzas.model.BalanceSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BalanceSnapshotRepository extends JpaRepository<BalanceSnapshot, Long> {
    List<BalanceSnapshot> findByAccountIdOrderBySnapshotDateDesc(Long accountId);
    List<BalanceSnapshot> findByUserIdAndSnapshotDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    List<BalanceSnapshot> findByUserIdOrderBySnapshotDateDesc(Long userId);
}
