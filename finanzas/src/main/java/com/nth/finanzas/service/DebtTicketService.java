package com.nth.finanzas.service;

import com.nth.finanzas.dto.DebtTicketRequest;
import com.nth.finanzas.dto.DebtTicketResponse;
import com.nth.finanzas.dto.TicketItemResponse;
import com.nth.finanzas.model.Debtor;
import com.nth.finanzas.model.DebtTicket;
import com.nth.finanzas.model.TicketItem;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.DebtorRepository;
import com.nth.finanzas.repository.DebtTicketRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DebtTicketService {

    private final DebtTicketRepository debtTicketRepository;
    private final DebtorRepository debtorRepository;
    private final UserRepository userRepository;

    public DebtTicketResponse createDebtTicket(Long userId, DebtTicketRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Debtor debtor = debtorRepository.findById(request.getDebtorId())
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado"));

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

    public List<DebtTicketResponse> getTicketsByDebtorId(Long debtorId) {
        return debtTicketRepository.findByDebtorId(debtorId)
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

    public DebtTicketResponse getTicketById(Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        return mapToResponse(ticket);
    }

    public DebtTicketResponse getTicketById(Long userId, Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));
        return mapToResponse(ticket);
    }

    public DebtTicketResponse markTicketAsPaid(Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
        boolean currentPaid = Boolean.TRUE.equals(ticket.getIsPaid());
        ticket.setIsPaid(!currentPaid);
        DebtTicket updatedTicket = debtTicketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public DebtTicketResponse markTicketAsPaid(Long userId, Long ticketId) {
        DebtTicket ticket = debtTicketRepository.findByIdAndUserId(ticketId, userId)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado o no autorizado"));
        boolean currentPaid = Boolean.TRUE.equals(ticket.getIsPaid());
        ticket.setIsPaid(!currentPaid);
        DebtTicket updatedTicket = debtTicketRepository.save(ticket);
        return mapToResponse(updatedTicket);
    }

    public void deleteTicket(Long ticketId) {
        debtTicketRepository.deleteById(ticketId);
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
