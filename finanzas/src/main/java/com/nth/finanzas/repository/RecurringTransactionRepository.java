package com.nth.finanzas.repository;

import com.nth.finanzas.model.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, Long> {

    List<RecurringTransaction> findByUserIdOrderByNameAscCreatedAtDesc(Long userId);

    Optional<RecurringTransaction> findByIdAndUserId(Long id, Long userId);
}

