package com.nth.finanzas.repository;

import com.nth.finanzas.model.Debtor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DebtorRepository extends JpaRepository<Debtor, Long> {
    List<Debtor> findByUserId(Long userId);
    Optional<Debtor> findByIdAndUserId(Long id, Long userId);
}
