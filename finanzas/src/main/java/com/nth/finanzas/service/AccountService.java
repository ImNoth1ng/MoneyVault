package com.nth.finanzas.service;

import com.nth.finanzas.dto.AccountRequest;
import com.nth.finanzas.dto.AccountResponse;
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
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final BalanceSnapshotRepository balanceSnapshotRepository;

    public AccountResponse createAccount(Long userId, AccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Account account = Account.builder()
                .user(user)
                .name(request.getName())
                .type(Account.AccountType.valueOf(request.getType()))
                .currentBalance(request.getCurrentBalance() != null ? request.getCurrentBalance() : BigDecimal.ZERO)
                .creditLimit(request.getCreditLimit())
                .currency(request.getCurrency() != null ? request.getCurrency() : "MXN")
                .b1000Count(request.getB1000Count())
                .b500Count(request.getB500Count())
                .b200Count(request.getB200Count())
                .b100Count(request.getB100Count())
                .b50Count(request.getB50Count())
                .b20Count(request.getB20Count())
                .build();

        Account savedAccount = accountRepository.save(account);

        // Auto-create snapshot on account creation
        autoCreateSnapshot(user, savedAccount);

        return mapToResponse(savedAccount);
    }

    public List<AccountResponse> getAccountsByUserId(Long userId) {
        return accountRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccountById(Long accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));
        return mapToResponse(account);
    }

    public AccountResponse getAccountById(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
            .orElseThrow(() -> new RuntimeException("Cuenta no encontrada o no autorizada"));
        return mapToResponse(account);
    }

    public AccountResponse updateAccount(Long accountId, AccountRequest request) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada"));

        updateAccountFields(account, request);
        Account updatedAccount = accountRepository.save(account);

        // Auto-create snapshot on account update
        autoCreateSnapshot(updatedAccount.getUser(), updatedAccount);

        return mapToResponse(updatedAccount);
    }

    public AccountResponse updateAccount(Long userId, Long accountId, AccountRequest request) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada o no autorizada"));

        updateAccountFields(account, request);
        Account updatedAccount = accountRepository.save(account);

        // Auto-create snapshot on account update
        autoCreateSnapshot(updatedAccount.getUser(), updatedAccount);

        return mapToResponse(updatedAccount);
    }

    private void updateAccountFields(Account account, AccountRequest request) {
        if (request.getName() != null) account.setName(request.getName());
        if (request.getType() != null) account.setType(Account.AccountType.valueOf(request.getType()));
        if (request.getCreditLimit() != null) account.setCreditLimit(request.getCreditLimit());
        if (request.getCurrentBalance() != null) account.setCurrentBalance(request.getCurrentBalance());
        if (request.getCurrency() != null) account.setCurrency(request.getCurrency());

        if (request.getB1000Count() != null) account.setB1000Count(request.getB1000Count());
        if (request.getB500Count() != null) account.setB500Count(request.getB500Count());
        if (request.getB200Count() != null) account.setB200Count(request.getB200Count());
        if (request.getB100Count() != null) account.setB100Count(request.getB100Count());
        if (request.getB50Count() != null) account.setB50Count(request.getB50Count());
        if (request.getB20Count() != null) account.setB20Count(request.getB20Count());
    }

    public void deleteAccount(Long accountId) {
        accountRepository.deleteById(accountId);
    }

    public void deleteAccount(Long userId, Long accountId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada o no autorizada"));
        accountRepository.delete(account);
    }

    private void autoCreateSnapshot(User user, Account account) {
        try {
            BalanceSnapshot.SnapshotType sType = mapAccountTypeToSnapshotType(account.getType());
            BalanceSnapshot snapshot = BalanceSnapshot.builder()
                    .user(user)
                    .account(account)
                    .snapshotAmount(account.getCurrentBalance())
                    .snapshotDate(LocalDateTime.now())
                    .frequency(BalanceSnapshot.SnapshotFrequency.MONTHLY)
                    .snapshotType(sType)
                    .notes("Auto-snapshot al actualizar " + account.getName())
                    .build();
            balanceSnapshotRepository.save(snapshot);
        } catch (Exception e) {
            System.err.println("Auto-snapshot generation exception: " + e.getMessage());
        }
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

    private AccountResponse mapToResponse(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .name(account.getName())
                .type(account.getType().toString())
                .currentBalance(account.getCurrentBalance())
                .creditLimit(account.getCreditLimit())
                .currency(account.getCurrency())
                .b1000Count(account.getB1000Count())
                .b500Count(account.getB500Count())
                .b200Count(account.getB200Count())
                .b100Count(account.getB100Count())
                .b50Count(account.getB50Count())
                .b20Count(account.getB20Count())
                .createdAt(account.getCreatedAt())
                .build();
    }
}
