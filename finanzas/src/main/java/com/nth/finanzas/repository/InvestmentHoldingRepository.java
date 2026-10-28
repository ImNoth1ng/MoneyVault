package com.nth.finanzas.repository;

import com.nth.finanzas.model.InvestmentHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvestmentHoldingRepository extends JpaRepository<InvestmentHolding, Long> {

    List<InvestmentHolding> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<InvestmentHolding> findByUserIdAndAccountIdOrderByCreatedAtDesc(Long userId, Long accountId);

    Optional<InvestmentHolding> findByIdAndUserId(Long id, Long userId);
}
