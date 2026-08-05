package com.nth.finanzas.service;

import com.nth.finanzas.dto.BalanceSnapshotRequest;
import com.nth.finanzas.dto.BalanceSnapshotResponse;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.BalanceSnapshot;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.BalanceSnapshotRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BalanceSnapshotService {

    private final BalanceSnapshotRepository balanceSnapshotRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public BalanceSnapshotResponse createSnapshot(Long userId, Long accountId, BalanceSnapshotRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Account account = accountId != null ? accountRepository.findByIdAndUserId(accountId, userId).orElse(null) : null;

        BigDecimal amount = (request != null && request.getCustomAmount() != null)
                ? request.getCustomAmount()
                : (account != null ? account.getCurrentBalance() : BigDecimal.ZERO);

        BalanceSnapshot.SnapshotType type = (request != null && request.getSnapshotType() != null)
                ? request.getSnapshotType()
                : (account != null ? mapAccountTypeToSnapshotType(account.getType()) : BalanceSnapshot.SnapshotType.ACCOUNT);

        BalanceSnapshot snapshot = BalanceSnapshot.builder()
                .account(account)
                .user(user)
                .snapshotAmount(amount)
                .snapshotDate(LocalDateTime.now())
                .frequency(request != null && request.getFrequency() != null ? request.getFrequency() : BalanceSnapshot.SnapshotFrequency.MONTHLY)
                .snapshotType(type)
                .notes(request != null ? request.getNotes() : null)
                .build();

        return mapToResponse(balanceSnapshotRepository.save(snapshot));
    }

    public BalanceSnapshotResponse createGlobalSnapshot(Long userId, BalanceSnapshotRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        BigDecimal amount = request != null && request.getCustomAmount() != null ? request.getCustomAmount() : BigDecimal.ZERO;
        BalanceSnapshot.SnapshotType type = (request != null && request.getSnapshotType() != null) ? request.getSnapshotType() : BalanceSnapshot.SnapshotType.GLOBAL;

        BalanceSnapshot snapshot = BalanceSnapshot.builder()
                .account(null)
                .user(user)
                .snapshotAmount(amount)
                .snapshotDate(LocalDateTime.now())
                .frequency(request != null && request.getFrequency() != null ? request.getFrequency() : BalanceSnapshot.SnapshotFrequency.MONTHLY)
                .snapshotType(type)
                .notes(request != null ? request.getNotes() : null)
                .build();

        return mapToResponse(balanceSnapshotRepository.save(snapshot));
    }

    public List<BalanceSnapshotResponse> getSnapshotsByAccount(Long userId, Long accountId) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        return balanceSnapshotRepository.findByAccountIdOrderBySnapshotDateDesc(accountId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BalanceSnapshotResponse> getAllSnapshotsByUser(Long userId) {
        return balanceSnapshotRepository.findByUserIdOrderBySnapshotDateDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BalanceSnapshotResponse> getSnapshotsByPeriod(Long userId, LocalDateTime startDate, LocalDateTime endDate) {
        return balanceSnapshotRepository.findByUserIdAndSnapshotDateBetween(userId, startDate, endDate)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public void deleteSnapshot(Long userId, Long snapshotId) {
        BalanceSnapshot snapshot = balanceSnapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new RuntimeException("Snapshot no encontrado"));
        if (!snapshot.getUser().getId().equals(userId)) {
            throw new RuntimeException("No tienes permisos para eliminar este snapshot");
        }
        balanceSnapshotRepository.delete(snapshot);
    }

    private BalanceSnapshot.SnapshotType mapAccountTypeToSnapshotType(Account.AccountType accountType) {
        if (accountType == null) return BalanceSnapshot.SnapshotType.ACCOUNT;
        switch (accountType) {
            case CREDIT:
                return BalanceSnapshot.SnapshotType.CREDIT_CARD;
            case CASH:
                return BalanceSnapshot.SnapshotType.CASH;
            case INVESTMENT:
                return BalanceSnapshot.SnapshotType.INVESTMENT;
            default:
                return BalanceSnapshot.SnapshotType.ACCOUNT;
        }
    }

    private BalanceSnapshotResponse mapToResponse(BalanceSnapshot snapshot) {
        String name = snapshot.getAccount() != null ? snapshot.getAccount().getName() : null;
        if (name == null) {
            if (snapshot.getSnapshotType() == BalanceSnapshot.SnapshotType.GLOBAL) {
                name = "Resumen Global Financiero";
            } else if (snapshot.getSnapshotType() == BalanceSnapshot.SnapshotType.DEBTOR) {
                name = "Snapshot de Deudores";
            } else {
                name = "Snapshot de Balance";
            }
        }

        return BalanceSnapshotResponse.builder()
                .id(snapshot.getId())
                .accountId(snapshot.getAccount() != null ? snapshot.getAccount().getId() : null)
                .accountName(name)
                .snapshotAmount(snapshot.getSnapshotAmount())
                .snapshotDate(snapshot.getSnapshotDate())
                .frequency(snapshot.getFrequency())
                .snapshotType(snapshot.getSnapshotType() != null ? snapshot.getSnapshotType() : BalanceSnapshot.SnapshotType.GLOBAL)
                .notes(snapshot.getNotes())
                .build();
    }
}