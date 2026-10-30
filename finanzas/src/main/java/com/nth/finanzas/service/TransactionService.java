package com.nth.finanzas.service;

import com.nth.finanzas.dto.TransactionRequest;
import com.nth.finanzas.dto.TransactionResponse;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.Transaction;
import com.nth.finanzas.model.TransactionType;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.TransactionRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta de origen o destino no encontrada o no pertenece al usuario"));

        TransactionType type;
        try {
            type = TransactionType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
        }

        Account destinationAccount = null;
        BigDecimal amount = request.getAmount();

        if (type == TransactionType.EXPENSE) {
            // GASTO:
            // Si es tarjeta de crédito -> aumenta la deuda
            // Si es débito/efectivo/inversión -> disminuye el saldo
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentDebt.add(amount));
            } else {
                BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentBal.subtract(amount));
            }
            accountRepository.save(account);

        } else if (type == TransactionType.INCOME) {
            // INGRESO:
            // Si entra a tarjeta de crédito -> abono que reduce deuda
            // Si entra a débito/efectivo/inversión -> suma al saldo
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentDebt.subtract(amount));
            } else {
                BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentBal.add(amount));
            }
            accountRepository.save(account);

        } else if (type == TransactionType.TRANSFER) {
            // TRANSFERENCIA:
            if (request.getDestinationAccountId() == null) {
                throw new RuntimeException("Para transferencias se debe especificar la cuenta de destino (destinationAccountId)");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new RuntimeException("La cuenta de origen y destino no pueden ser la misma");
            }

            destinationAccount = accountRepository.findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));

            // Restar de cuenta origen
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentDebt.add(amount));
            } else {
                BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(currentBal.subtract(amount));
            }
            accountRepository.save(account);

            // Sumar a cuenta destino
            if (destinationAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = destinationAccount.getCurrentBalance() != null ? destinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                destinationAccount.setCurrentBalance(currentDebt.subtract(amount));
            } else {
                BigDecimal currentBal = destinationAccount.getCurrentBalance() != null ? destinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                destinationAccount.setCurrentBalance(currentBal.add(amount));
            }
            accountRepository.save(destinationAccount);
        }

        Transaction transaction = Transaction.builder()
                .user(user)
                .account(account)
                .destinationAccount(destinationAccount)
                .amount(amount)
                .type(type)
                .category(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null)
                .description(request.getDescription())
                .senderOrRecipient(request.getSenderOrRecipient())
                .debtTicketId(request.getDebtTicketId())
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .build();

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    public List<TransactionResponse> getTransactionsByUserId(Long userId, String typeStr) {
        if (typeStr != null && !typeStr.isBlank()) {
            try {
                TransactionType type = TransactionType.valueOf(typeStr.toUpperCase());
                return transactionRepository.findByUserIdAndTypeOrderByTransactionDateDescCreatedAtDesc(userId, type)
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {
            }
        }

        return transactionRepository.findByUserIdOrderByTransactionDateDescCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public TransactionResponse getTransactionById(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        Account newAccount = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta de origen o destino no encontrada o no pertenece al usuario"));

        TransactionType newType;
        try {
            newType = TransactionType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
        }

        Account newDestinationAccount = null;
        if (newType == TransactionType.TRANSFER) {
            if (request.getDestinationAccountId() == null) {
                throw new RuntimeException("Para transferencias se debe especificar la cuenta de destino (destinationAccountId)");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new RuntimeException("La cuenta de origen y destino no pueden ser la misma");
            }
            newDestinationAccount = accountRepository.findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));
        }

        // 1. Revertir los efectos del movimiento original en los saldos
        Account oldAccount = transaction.getAccount();
        BigDecimal oldAmount = transaction.getAmount();
        TransactionType oldType = transaction.getType();

        if (oldType == TransactionType.EXPENSE) {
            if (oldAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(debt.subtract(oldAmount));
            } else {
                BigDecimal bal = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(bal.add(oldAmount));
            }
            accountRepository.save(oldAccount);

        } else if (oldType == TransactionType.INCOME) {
            if (oldAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(debt.add(oldAmount));
            } else {
                BigDecimal bal = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(bal.subtract(oldAmount));
            }
            accountRepository.save(oldAccount);

        } else if (oldType == TransactionType.TRANSFER) {
            Account oldDestinationAccount = transaction.getDestinationAccount();

            if (oldAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(debt.subtract(oldAmount));
            } else {
                BigDecimal bal = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(bal.add(oldAmount));
            }
            accountRepository.save(oldAccount);

            if (oldDestinationAccount != null) {
                if (oldDestinationAccount.getType() == Account.AccountType.CREDIT) {
                    BigDecimal debt = oldDestinationAccount.getCurrentBalance() != null ? oldDestinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                    oldDestinationAccount.setCurrentBalance(debt.add(oldAmount));
                } else {
                    BigDecimal bal = oldDestinationAccount.getCurrentBalance() != null ? oldDestinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                    oldDestinationAccount.setCurrentBalance(bal.subtract(oldAmount));
                }
                accountRepository.save(oldDestinationAccount);
            }
        }

        // 2. Aplicar los efectos del movimiento actualizado en los saldos
        BigDecimal newAmount = request.getAmount();

        if (newType == TransactionType.EXPENSE) {
            if (newAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentDebt.add(newAmount));
            } else {
                BigDecimal currentBal = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentBal.subtract(newAmount));
            }
            accountRepository.save(newAccount);

        } else if (newType == TransactionType.INCOME) {
            if (newAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentDebt.subtract(newAmount));
            } else {
                BigDecimal currentBal = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentBal.add(newAmount));
            }
            accountRepository.save(newAccount);

        } else if (newType == TransactionType.TRANSFER && newDestinationAccount != null) {
            if (newAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentDebt.add(newAmount));
            } else {
                BigDecimal currentBal = newAccount.getCurrentBalance() != null ? newAccount.getCurrentBalance() : BigDecimal.ZERO;
                newAccount.setCurrentBalance(currentBal.subtract(newAmount));
            }
            accountRepository.save(newAccount);

            if (newDestinationAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal currentDebt = newDestinationAccount.getCurrentBalance() != null ? newDestinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                newDestinationAccount.setCurrentBalance(currentDebt.subtract(newAmount));
            } else {
                BigDecimal currentBal = newDestinationAccount.getCurrentBalance() != null ? newDestinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                newDestinationAccount.setCurrentBalance(currentBal.add(newAmount));
            }
            accountRepository.save(newDestinationAccount);
        }

        // 3. Actualizar campos del movimiento
        transaction.setAccount(newAccount);
        transaction.setDestinationAccount(newDestinationAccount);
        transaction.setAmount(newAmount);
        transaction.setType(newType);
        transaction.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null);
        transaction.setDescription(request.getDescription());
        transaction.setSenderOrRecipient(request.getSenderOrRecipient());
        if (request.getDebtTicketId() != null) {
            transaction.setDebtTicketId(request.getDebtTicketId());
        }
        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        Account account = transaction.getAccount();
        BigDecimal amount = transaction.getAmount();
        TransactionType type = transaction.getType();

        // Revertir efectos en saldos
        if (type == TransactionType.EXPENSE) {
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(debt.subtract(amount));
            } else {
                BigDecimal bal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(bal.add(amount));
            }
            accountRepository.save(account);

        } else if (type == TransactionType.INCOME) {
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(debt.add(amount));
            } else {
                BigDecimal bal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(bal.subtract(amount));
            }
            accountRepository.save(account);

        } else if (type == TransactionType.TRANSFER) {
            Account destinationAccount = transaction.getDestinationAccount();

            // Revertir origen: sumar lo que se restó
            if (account.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(debt.subtract(amount));
            } else {
                BigDecimal bal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
                account.setCurrentBalance(bal.add(amount));
            }
            accountRepository.save(account);

            // Revertir destino: restar lo que se sumó
            if (destinationAccount != null) {
                if (destinationAccount.getType() == Account.AccountType.CREDIT) {
                    BigDecimal debt = destinationAccount.getCurrentBalance() != null ? destinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                    destinationAccount.setCurrentBalance(debt.add(amount));
                } else {
                    BigDecimal bal = destinationAccount.getCurrentBalance() != null ? destinationAccount.getCurrentBalance() : BigDecimal.ZERO;
                    destinationAccount.setCurrentBalance(bal.subtract(amount));
                }
                accountRepository.save(destinationAccount);
            }
        }

        transactionRepository.delete(transaction);
    }

    private TransactionResponse mapToResponse(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .accountId(t.getAccount().getId())
                .accountName(t.getAccount().getName())
                .accountType(t.getAccount().getType().name())
                .destinationAccountId(t.getDestinationAccount() != null ? t.getDestinationAccount().getId() : null)
                .destinationAccountName(t.getDestinationAccount() != null ? t.getDestinationAccount().getName() : null)
                .destinationAccountType(t.getDestinationAccount() != null ? t.getDestinationAccount().getType().name() : null)
                .amount(t.getAmount())
                .type(t.getType().name())
                .category(t.getCategory())
                .description(t.getDescription())
                .senderOrRecipient(t.getSenderOrRecipient())
                .debtTicketId(t.getDebtTicketId())
                .transactionDate(t.getTransactionDate())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
