package com.nth.finanzas.service;

import com.nth.finanzas.dto.DebtTicketRequest;
import com.nth.finanzas.dto.DebtTicketResponse;
import com.nth.finanzas.dto.TicketItemResponse;
import com.nth.finanzas.dto.TicketPaymentRequest;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.Debtor;
import com.nth.finanzas.model.DebtTicket;
import com.nth.finanzas.model.TicketItem;
import com.nth.finanzas.model.Transaction;
import com.nth.finanzas.model.TransactionType;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.DebtorRepository;
import com.nth.finanzas.repository.DebtTicketRepository;
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
public class DebtTicketService {

    private final DebtTicketRepository debtTicketRepository;
    private final DebtorRepository debtorRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    public DebtTicketResponse createDebtTicket(Long userId, DebtTicketRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Debtor debtor = debtorRepository.findByIdAndUserId(request.getDebtorId(), userId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));

        BigDecimal totalAmount = request.getItems().stream()
                .map(item -> item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        DebtTicket ticket = DebtTicket.builder()
                .debtor(debtor)
                .user(user)
                .description(request.getDescription())
                .totalAmount(totalAmount)
                .isPaid(false)
                .build();

        DebtTicket savedTicket = debtTicketRepository.save(ticket);

        for (var itemRequest : request.getItems()) {
            TicketItem item = TicketItem.builder()
                    .debtTicket(savedTicket)
                    .concept(itemRequest.getConcept())
                    .amount(itemRequest.getAmount())
                    .build();
            savedTicket.getItems().add(item);
        }

        debtTicketRepository.save(savedTicket);
        return mapToResponse(savedTicket);
    }

    public DebtTicketResponse updateDebtTicket(Long userId, Long ticketId, DebtTicketRequest request) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));

        if (request.getDebtorId() != null) {
            Debtor debtor = debtorRepository.findByIdAndUserId(request.getDebtorId(), userId)
                    .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));
            ticket.setDebtor(debtor);
        }

        if (request.getDescription() != null) {
            ticket.setDescription(request.getDescription());
        }

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            ticket.getItems().clear();
            BigDecimal totalAmount = BigDecimal.ZERO;
            for (var itemReq : request.getItems()) {
                TicketItem item = TicketItem.builder()
                        .debtTicket(ticket)
                        .concept(itemReq.getConcept())
                        .amount(itemReq.getAmount())
                        .build();
                ticket.getItems().add(item);
                totalAmount = totalAmount.add(itemReq.getAmount() != null ? itemReq.getAmount() : BigDecimal.ZERO);
            }
            ticket.setTotalAmount(totalAmount);
        }

        DebtTicket updatedTicket = debtTicketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public List<DebtTicketResponse> getTicketsByUserId(Long userId) {
        return debtTicketRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<DebtTicketResponse> getTicketsByDebtorId(Long userId, Long debtorId) {
        debtorRepository.findByIdAndUserId(debtorId, userId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));

        return debtTicketRepository.findByDebtorIdAndUserId(debtorId, userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DebtTicketResponse getTicketById(Long userId, Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));
        return mapToResponse(ticket);
    }

    public DebtTicketResponse markTicketAsPaid(Long userId, Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));
        boolean currentPaid = Boolean.TRUE.equals(ticket.getIsPaid());
        ticket.setIsPaid(!currentPaid);
        DebtTicket updatedTicket = debtTicketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    @Transactional
    public DebtTicketResponse payDebtTicket(Long userId, Long ticketId, TicketPaymentRequest request) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));

        Account account = accountRepository.findByIdAndUserId(request.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta de destino no encontrada o no pertenece al usuario"));

        BigDecimal totalTicket = ticket.getTotalAmount() != null ? ticket.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal received = request.getAmountReceived() != null ? request.getAmountReceived() : totalTicket;
        BigDecimal surplus = received.subtract(totalTicket);

        // 1. Marcar ticket como pagado
        ticket.setIsPaid(true);
        DebtTicket savedTicket = debtTicketRepository.save(ticket);

        // 2. Sumar monto recibido a la cuenta elegida
        if (account.getType() == Account.AccountType.CREDIT) {
            BigDecimal debt = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            account.setCurrentBalance(debt.subtract(received));
        } else {
            BigDecimal bal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            account.setCurrentBalance(bal.add(received));
        }
        accountRepository.save(account);

        // 3. Generar descripción detallada con excedente si existe
        StringBuilder desc = new StringBuilder("Pago ticket #" + ticket.getId());
        if (ticket.getDescription() != null && !ticket.getDescription().isBlank()) {
            desc.append(" (").append(ticket.getDescription()).append(")");
        }
        if (surplus.compareTo(BigDecimal.ZERO) > 0) {
            desc.append(" [Incluye excedente de +$").append(surplus).append("]");
        } else if (surplus.compareTo(BigDecimal.ZERO) < 0) {
            desc.append(" [Abono/Diferencia de -$").append(surplus.abs()).append("]");
        }
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            desc.append(" - ").append(request.getNotes().trim());
        }

        // 4. Crear movimiento de Ingreso automáticamente
        Transaction transaction = Transaction.builder()
                .user(ticket.getUser())
                .account(account)
                .amount(received)
                .type(TransactionType.INCOME)
                .category("Pago de Ticket")
                .description(desc.toString())
                .senderOrRecipient(ticket.getDebtor() != null ? ticket.getDebtor().getName() : "Deudor")
                .debtTicketId(ticket.getId())
                .transactionDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDateTime.now())
                .build();
        transactionRepository.save(transaction);

        return mapToResponse(savedTicket);
    }

    public void deleteTicket(Long userId, Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));
        debtTicketRepository.delete(ticket);
    }

    private DebtTicketResponse mapToResponse(DebtTicket ticket) {
        List<TicketItemResponse> items = ticket.getItems().stream()
                .map(item -> TicketItemResponse.builder()
                        .id(item.getId())
                        .concept(item.getConcept())
                        .amount(item.getAmount())
                        .build())
                .collect(Collectors.toList());

        return DebtTicketResponse.builder()
                .id(ticket.getId())
                .debtorId(ticket.getDebtor().getId())
                .debtorName(ticket.getDebtor().getName())
                .description(ticket.getDescription())
                .issueDate(ticket.getIssueDate())
                .totalAmount(ticket.getTotalAmount())
                .isPaid(ticket.getIsPaid())
                .items(items)
                .build();
    }
}
