package com.nth.finanzas.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "accounts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AccountType type;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal currentBalance = BigDecimal.ZERO;

    @Column(precision = 19, scale = 4)
    private BigDecimal creditLimit;

    @Column(length = 10, nullable = false)
    @Builder.Default
    private String currency = "MXN";

    @Column(name = "b1000_count")
    private Integer b1000Count;

    @Column(name = "b500_count")
    private Integer b500Count;

    @Column(name = "b200_count")
    private Integer b200Count;

    @Column(name = "b100_count")
    private Integer b100Count;

    @Column(name = "b50_count")
    private Integer b50Count;

    @Column(name = "b20_count")
    private Integer b20Count;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<BalanceSnapshot> snapshots = new HashSet<>();

    @OneToMany(mappedBy = "account", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<CashInventory> cashInventory = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public enum AccountType {
        DEBIT, CREDIT, CASH, INVESTMENT
    }
}
