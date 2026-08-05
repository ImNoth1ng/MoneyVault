package com.nth.finanzas.repository;

import com.nth.finanzas.model.DebtTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DebtTicketRepository extends JpaRepository<DebtTicket, Long> {
    List<DebtTicket> findByDebtorId(Long debtorId);
    List<DebtTicket> findByUserId(Long userId);
    List<DebtTicket> findByUserIdAndIsPaid(Long userId, Boolean isPaid);
    List<DebtTicket> findByUserIdAndIssueDateBetween(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    List<DebtTicket> findByDebtorIdAndUserId(Long debtorId, Long userId);
    Optional<DebtTicket> findByIdAndUserId(Long id, Long userId);
}
