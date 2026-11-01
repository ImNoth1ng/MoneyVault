package com.nth.finanzas.service;

import com.nth.finanzas.dto.TransactionRequest;
import com.nth.finanzas.dto.TransactionResponse;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.DebtTicket;
import com.nth.finanzas.model.Debtor;
import com.nth.finanzas.model.TicketItem;
import com.nth.finanzas.model.Transaction;
import com.nth.finanzas.model.TransactionType;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.DebtTicketRepository;
import com.nth.finanzas.repository.DebtorRepository;
import com.nth.finanzas.repository.TransactionRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final DebtTicketRepository debtTicketRepository;
    private final DebtorRepository debtorRepository;

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
            throw new IllegalArgumentException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
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
                throw new IllegalArgumentException("Para transferencias se debe especificar la cuenta de destino (destinationAccountId)");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new IllegalArgumentException("La cuenta de origen y destino no pueden ser la misma");
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
                .description(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : null)
                .senderOrRecipient(request.getSenderOrRecipient() != null && !request.getSenderOrRecipient().isBlank() ? request.getSenderOrRecipient().trim() : null)
                .debtTicketId(request.getDebtTicketId())
                .transactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : LocalDateTime.now())
                .build();

        Transaction saved = transactionRepository.save(transaction);

        // Si es un gasto (EXPENSE) y el usuario solicitó adjuntarlo a un ticket de deuda (nuevo o existente)
        if (type == TransactionType.EXPENSE && Boolean.TRUE.equals(request.getAttachToTicket())) {
            attachExpenseToTicket(user, saved, request);
            saved = transactionRepository.save(saved);
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
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

    @Transactional(readOnly = true)
    public TransactionResponse getTransactionById(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));
        return mapToResponse(transaction);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long userId, Long transactionId, TransactionRequest request) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        TransactionType newType;
        try {
            newType = TransactionType.valueOf(request.getType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tipo de movimiento inválido: " + request.getType() + ". Usa EXPENSE, INCOME o TRANSFER.");
        }

        if (newType == TransactionType.TRANSFER) {
            if (request.getDestinationAccountId() == null) {
                throw new IllegalArgumentException("Para transferencias se debe especificar la cuenta de destino (destinationAccountId)");
            }
            if (request.getAccountId().equals(request.getDestinationAccountId())) {
                throw new IllegalArgumentException("La cuenta de origen y destino no pueden ser la misma");
            }
        }

        // 1. Revertir los efectos del movimiento original en los saldos
        Account oldAccount = accountRepository.findByIdAndUserId(transaction.getAccount().getId(), userId)
                .orElse(transaction.getAccount());
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
            if (oldAccount.getType() == Account.AccountType.CREDIT) {
                BigDecimal debt = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(debt.subtract(oldAmount));
            } else {
                BigDecimal bal = oldAccount.getCurrentBalance() != null ? oldAccount.getCurrentBalance() : BigDecimal.ZERO;
                oldAccount.setCurrentBalance(bal.add(oldAmount));
            }
            accountRepository.save(oldAccount);

            if (transaction.getDestinationAccount() != null) {
                Account oldDestinationAccount = accountRepository.findByIdAndUserId(transaction.getDestinationAccount().getId(), userId)
                        .orElse(transaction.getDestinationAccount());
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

        // 2. Cargar cuentas nuevas (después de revertir para tener los saldos actualizados) y aplicar nuevos efectos
        Account newAccount = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta de origen o destino no encontrada o no pertenece al usuario"));

        Account newDestinationAccount = null;
        if (newType == TransactionType.TRANSFER) {
            newDestinationAccount = accountRepository.findByIdAndUserId(request.getDestinationAccountId(), userId)
                    .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));
        }

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

        // 3. Actualizar campos básicos del movimiento
        Long previousTicketId = transaction.getDebtTicketId();

        transaction.setAccount(newAccount);
        transaction.setDestinationAccount(newDestinationAccount);
        transaction.setAmount(newAmount);
        transaction.setType(newType);
        transaction.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : null);
        transaction.setDescription(request.getDescription() != null && !request.getDescription().isBlank() ? request.getDescription().trim() : null);
        transaction.setSenderOrRecipient(request.getSenderOrRecipient() != null && !request.getSenderOrRecipient().isBlank() ? request.getSenderOrRecipient().trim() : null);
        if (request.getTransactionDate() != null) {
            transaction.setTransactionDate(request.getTransactionDate());
        }

        // 4. Sincronización con Tickets de Deuda (para gastos adjuntos a tickets)
        if (Boolean.TRUE.equals(request.getDetachFromTicket()) || (oldType == TransactionType.EXPENSE && newType != TransactionType.EXPENSE)) {
            if (previousTicketId != null && oldType == TransactionType.EXPENSE) {
                removeExpenseItemFromTicket(userId, previousTicketId, transaction.getId(), oldAmount);
                transaction.setDebtTicketId(null);
            }
        } else if (newType == TransactionType.EXPENSE && Boolean.TRUE.equals(request.getAttachToTicket())) {
            String mode = request.getTicketMode() != null ? request.getTicketMode().toUpperCase() : "EXISTING";
            if ("NEW".equals(mode)) {
                if (previousTicketId != null) {
                    removeExpenseItemFromTicket(userId, previousTicketId, transaction.getId(), oldAmount);
                }
                attachExpenseToTicket(transaction.getUser(), transaction, request);
            } else {
                Long targetId = request.getTargetTicketId() != null
                        ? request.getTargetTicketId()
                        : (request.getDebtTicketId() != null ? request.getDebtTicketId() : previousTicketId);

                if (previousTicketId != null && targetId != null && !previousTicketId.equals(targetId)) {
                    removeExpenseItemFromTicket(userId, previousTicketId, transaction.getId(), oldAmount);
                    attachExpenseToTicket(transaction.getUser(), transaction, request);
                } else if (previousTicketId != null && previousTicketId.equals(targetId)) {
                    syncExistingTicketItem(userId, previousTicketId, transaction, request, oldAmount);
                } else if (targetId != null) {
                    attachExpenseToTicket(transaction.getUser(), transaction, request);
                }
            }
        } else if (newType == TransactionType.EXPENSE && previousTicketId != null) {
            // Si ya estaba vinculado a un ticket y se editó el monto o descripción del gasto, actualizar el ítem del ticket
            syncExistingTicketItem(userId, previousTicketId, transaction, request, oldAmount);
        }

        Transaction saved = transactionRepository.save(transaction);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteTransaction(Long userId, Long transactionId) {
        Transaction transaction = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> new RuntimeException("Movimiento no encontrado"));

        Account account = accountRepository.findByIdAndUserId(transaction.getAccount().getId(), userId)
                .orElse(transaction.getAccount());
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

            // Si este gasto estaba adjunto a un ticket de deuda, descontar/remover el ítem del ticket
            if (transaction.getDebtTicketId() != null) {
                removeExpenseItemFromTicket(userId, transaction.getDebtTicketId(), transaction.getId(), amount);
            }

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
            if (transaction.getDestinationAccount() != null) {
                Account destinationAccount = accountRepository.findByIdAndUserId(transaction.getDestinationAccount().getId(), userId)
                        .orElse(transaction.getDestinationAccount());
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

    /**
     * Adjunta un gasto (EXPENSE) a un ticket de deuda existente o a uno nuevo.
     */
    private void attachExpenseToTicket(User user, Transaction transaction, TransactionRequest request) {
        String mode = request.getTicketMode() != null ? request.getTicketMode().trim().toUpperCase() : "EXISTING";
        String itemConcept = resolveTicketItemConcept(transaction, request);
        BigDecimal itemAmount = request.getTicketItemAmount() != null && request.getTicketItemAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.getTicketItemAmount()
                : transaction.getAmount();

        if ("NEW".equals(mode)) {
            Debtor debtor;
            if (request.getDebtorId() != null) {
                debtor = debtorRepository.findByIdAndUserId(request.getDebtorId(), user.getId())
                        .orElseThrow(() -> new IllegalArgumentException("El deudor seleccionado no existe o no pertenece al usuario."));
            } else if (request.getNewDebtorName() != null && !request.getNewDebtorName().isBlank()) {
                Debtor newDebtor = Debtor.builder()
                        .user(user)
                        .name(request.getNewDebtorName().trim())
                        .contactInfo(request.getNewDebtorContact() != null && !request.getNewDebtorContact().isBlank()
                                ? request.getNewDebtorContact().trim()
                                : null)
                        .build();
                debtor = debtorRepository.save(newDebtor);
            } else {
                throw new IllegalArgumentException("Para crear un ticket nuevo debes elegir un deudor o escribir el nombre de un nuevo deudor.");
            }

            String ticketDesc = request.getTicketDescription() != null && !request.getTicketDescription().isBlank()
                    ? request.getTicketDescription().trim()
                    : (transaction.getDescription() != null && !transaction.getDescription().isBlank()
                        ? transaction.getDescription().trim()
                        : "Cargos de " + debtor.getName());
            if (ticketDesc.length() > 255) {
                ticketDesc = ticketDesc.substring(0, 255);
            }

            DebtTicket newTicket = DebtTicket.builder()
                    .debtor(debtor)
                    .user(user)
                    .description(ticketDesc)
                    .totalAmount(itemAmount)
                    .isPaid(false)
                    .build();

            DebtTicket savedTicket = debtTicketRepository.save(newTicket);

            TicketItem item = TicketItem.builder()
                    .debtTicket(savedTicket)
                    .concept(itemConcept)
                    .amount(itemAmount)
                    .transactionId(transaction.getId())
                    .build();
            savedTicket.getItems().add(item);
            debtTicketRepository.save(savedTicket);

            transaction.setDebtTicketId(savedTicket.getId());
            if (transaction.getSenderOrRecipient() == null || transaction.getSenderOrRecipient().isBlank()) {
                transaction.setSenderOrRecipient(debtor.getName());
            }

        } else {
            Long targetTicketId = request.getTargetTicketId() != null
                    ? request.getTargetTicketId()
                    : request.getDebtTicketId();
            if (targetTicketId == null) {
                throw new IllegalArgumentException("Debes seleccionar el ticket existente al cual deseas adjuntar este gasto.");
            }

            DebtTicket existingTicket = debtTicketRepository.findByIdAndUserId(targetTicketId, user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("El ticket seleccionado no existe o no pertenece al usuario."));

            TicketItem item = TicketItem.builder()
                    .debtTicket(existingTicket)
                    .concept(itemConcept)
                    .amount(itemAmount)
                    .transactionId(transaction.getId())
                    .build();
            existingTicket.getItems().add(item);
            existingTicket.setIsPaid(false);
            recalculateTicketTotal(existingTicket);
            debtTicketRepository.save(existingTicket);

            transaction.setDebtTicketId(existingTicket.getId());
            if ((transaction.getSenderOrRecipient() == null || transaction.getSenderOrRecipient().isBlank())
                    && existingTicket.getDebtor() != null) {
                transaction.setSenderOrRecipient(existingTicket.getDebtor().getName());
            }
        }
    }

    /**
     * Sincroniza el concepto y monto del ítem dentro del ticket cuando se edita un gasto vinculado.
     */
    private void syncExistingTicketItem(Long userId, Long ticketId, Transaction transaction, TransactionRequest request, BigDecimal oldAmount) {
        Optional<DebtTicket> ticketOpt = debtTicketRepository.findByIdAndUserId(ticketId, userId);
        if (ticketOpt.isEmpty()) {
            return;
        }
        DebtTicket ticket = ticketOpt.get();
        String itemConcept = resolveTicketItemConcept(transaction, request);
        BigDecimal itemAmount = request.getTicketItemAmount() != null && request.getTicketItemAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.getTicketItemAmount()
                : transaction.getAmount();

        Optional<TicketItem> matchedItem = ticket.getItems().stream()
                .filter(i -> transaction.getId().equals(i.getTransactionId()))
                .findFirst();

        if (matchedItem.isEmpty() && oldAmount != null) {
            matchedItem = ticket.getItems().stream()
                    .filter(i -> i.getTransactionId() == null && i.getAmount() != null && i.getAmount().compareTo(oldAmount) == 0)
                    .findFirst();
        }

        if (matchedItem.isPresent()) {
            TicketItem item = matchedItem.get();
            item.setConcept(itemConcept);
            item.setAmount(itemAmount);
            item.setTransactionId(transaction.getId());
        } else if (Boolean.TRUE.equals(request.getAttachToTicket())) {
            TicketItem newItem = TicketItem.builder()
                    .debtTicket(ticket)
                    .concept(itemConcept)
                    .amount(itemAmount)
                    .transactionId(transaction.getId())
                    .build();
            ticket.getItems().add(newItem);
        }

        recalculateTicketTotal(ticket);
        debtTicketRepository.save(ticket);
    }

    /**
     * Elimina el ítem vinculado de un ticket cuando el movimiento de gasto se desvincula o elimina.
     */
    private void removeExpenseItemFromTicket(Long userId, Long ticketId, Long transactionId, BigDecimal oldAmount) {
        Optional<DebtTicket> ticketOpt = debtTicketRepository.findByIdAndUserId(ticketId, userId);
        if (ticketOpt.isEmpty()) {
            return;
        }
        DebtTicket ticket = ticketOpt.get();

        Optional<TicketItem> matchedItem = ticket.getItems().stream()
                .filter(i -> transactionId != null && transactionId.equals(i.getTransactionId()))
                .findFirst();

        if (matchedItem.isEmpty() && oldAmount != null) {
            matchedItem = ticket.getItems().stream()
                    .filter(i -> i.getTransactionId() == null && i.getAmount() != null && i.getAmount().compareTo(oldAmount) == 0)
                    .findFirst();
        }

        if (matchedItem.isPresent()) {
            ticket.getItems().remove(matchedItem.get());
            recalculateTicketTotal(ticket);
            debtTicketRepository.save(ticket);
        }
    }

    private void recalculateTicketTotal(DebtTicket ticket) {
        BigDecimal total = ticket.getItems().stream()
                .map(i -> i.getAmount() != null ? i.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        ticket.setTotalAmount(total);
    }

    private String resolveTicketItemConcept(Transaction transaction, TransactionRequest request) {
        String concept = null;
        if (request.getTicketItemConcept() != null && !request.getTicketItemConcept().isBlank()) {
            concept = request.getTicketItemConcept().trim();
        } else if (transaction.getDescription() != null && !transaction.getDescription().isBlank()) {
            concept = transaction.getDescription().trim();
        } else if (transaction.getCategory() != null && !transaction.getCategory().isBlank()) {
            concept = transaction.getCategory().trim();
        } else if (transaction.getAccount() != null && transaction.getAccount().getName() != null) {
            concept = "Gasto con " + transaction.getAccount().getName();
        } else {
            concept = "Gasto registrado";
        }
        if (concept.length() < 2) {
            concept = concept + " - Cargo";
        }
        if (concept.length() > 100) {
            concept = concept.substring(0, 100);
        }
        return concept;
    }

    private TransactionResponse mapToResponse(Transaction t) {
        String ticketDesc = null;
        String ticketDebtorName = null;
        if (t.getDebtTicketId() != null && t.getUser() != null) {
            Optional<DebtTicket> ticketOpt = debtTicketRepository.findByIdAndUserId(t.getDebtTicketId(), t.getUser().getId());
            if (ticketOpt.isPresent()) {
                DebtTicket dt = ticketOpt.get();
                ticketDesc = dt.getDescription();
                if (dt.getDebtor() != null) {
                    ticketDebtorName = dt.getDebtor().getName();
                }
            }
        }

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
                .debtTicketDescription(ticketDesc)
                .debtTicketDebtorName(ticketDebtorName)
                .transactionDate(t.getTransactionDate())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
