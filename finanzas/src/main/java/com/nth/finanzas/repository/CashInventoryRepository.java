package com.nth.finanzas.repository;

import com.nth.finanzas.model.CashInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CashInventoryRepository extends JpaRepository<CashInventory, Long> {
    List<CashInventory> findByAccountId(Long accountId);
}
