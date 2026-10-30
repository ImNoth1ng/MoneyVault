package com.nth.finanzas.service;

import com.nth.finanzas.dto.RecurringTransactionRequest;
import com.nth.finanzas.dto.RecurringTransactionResponse;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.RecurringTransaction;
import com.nth.finanzas.model.TransactionType;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.RecurringTransactionRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public RecurringTransactionResponse create(Long userId, RecurringTransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada o no pertenece al usuario"));

        TransactionType type;
        try {
            type = TransactionType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
        }

        Account destinationAccount = null;
        if (type == TransactionType.TRANSFER) {
            if (request.getDestinationAccountId() == null) {
                throw new RuntimeException("Para transferencias se debe especificar la cuenta de destino");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new RuntimeException("La cuenta de origen y destino no pueden ser la misma");
            }
            destinationAccount = accountRepository.findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));
        }

        RecurringTransaction entity = RecurringTransaction.builder()
                .user(user)
                .name(request.getName().trim())
                .account(account)
                .destinationAccount(destinationAccount)
                .amount(request.getAmount())
                .type(type)
                .category(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null)
                .description(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : request.getName().trim())
                .senderOrRecipient(request.getSenderOrRecipient())
                .build();

        RecurringTransaction saved = recurringRepository.save(entity);
        return mapToResponse(saved);
    }

    public List<RecurringTransactionResponse> getAllByUserId(Long userId) {
        return recurringRepository.findByUserIdOrderByNameAscCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecurringTransactionResponse update(Long userId, Long id, RecurringTransactionRequest request) {
        RecurringTransaction entity = recurringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento recurrente no encontrado"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta no encontrada o no pertenece al usuario"));

        TransactionType type;
        try {
            type = TransactionType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
        }

        Account destinationAccount = null;
        if (type == TransactionType.TRANSFER) {
            if (request.getDestinationAccountId() == null) {
                throw new RuntimeException("Para transferencias se debe especificar la cuenta de destino");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new RuntimeException("La cuenta de origen y destino no pueden ser la misma");
            }
            destinationAccount = accountRepository.findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));
        }

        entity.setName(request.getName().trim());
        entity.setAccount(account);
        entity.setDestinationAccount(destinationAccount);
        entity.setAmount(request.getAmount());
        entity.setType(type);
        entity.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null);
        entity.setDescription(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : request.getName().trim());
        entity.setSenderOrRecipient(request.getSenderOrRecipient());

        RecurringTransaction saved = recurringRepository.save(entity);
        return mapToResponse(saved);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        RecurringTransaction entity = recurringRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento recurrente no encontrado"));
        recurringRepository.delete(entity);
    }

    private RecurringTransactionResponse mapToResponse(RecurringTransaction r) {
        return RecurringTransactionResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .name(r.getName())
                .accountId(r.getAccount().getId())
                .accountName(r.getAccount().getName())
                .accountType(r.getAccount().getType().name())
                .destinationAccountId(r.getDestinationAccount() != null ? r.getDestinationAccount().getId() : null)
                .destinationAccountName(r.getDestinationAccount() != null ? r.getDestinationAccount().getName() : null)
                .destinationAccountType(r.getDestinationAccount() != null ? r.getDestinationAccount().getType().name() : null)
                .amount(r.getAmount())
                .type(r.getType().name())
                .category(r.getCategory())
                .description(r.getDescription())
                .senderOrRecipient(r.getSenderOrRecipient())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}

