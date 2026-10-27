package com.nth.finanzas.repository;

import com.nth.finanzas.model.Transaction;
import com.nth.finanzas.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findByUserIdOrderByTransactionDateDescCreatedAtDesc(Long userId);

    List<Transaction> findByUserIdAndTypeOrderByTransactionDateDescCreatedAtDesc(Long userId, TransactionType type);

    Optional<Transaction> findByIdAndUserId(Long id, Long userId);

    List<Transaction> findByAccountId(Long accountId);

    List<Transaction> findByDebtTicketId(Long debtTicketId);
}
