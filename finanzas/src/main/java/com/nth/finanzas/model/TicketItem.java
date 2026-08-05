package com.nth.finanzas.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ticket_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debt_ticket_id", nullable = false)
    private DebtTicket debtTicket;

    @Column(nullable = false, length = 100)
    private String concept;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;
}
