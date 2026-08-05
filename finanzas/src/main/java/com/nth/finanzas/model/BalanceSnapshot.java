package com.nth.finanzas.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "balance_snapshots", indexes = {
    @Index(name = "idx_user_date", columnList = "user_id, snapshot_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BalanceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = true)
    private Account account;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal snapshotAmount;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDateTime snapshotDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SnapshotFrequency frequency;

    @Enumerated(EnumType.STRING)
    @Column(name = "snapshot_type")
    private SnapshotType snapshotType;

    @Column(length = 500)
    private String notes;

    public enum SnapshotFrequency {
        FIFTEEN_DAYS, FORTNIGHTLY, MONTHLY
    }

    public enum SnapshotType {
        GLOBAL, ACCOUNT, CREDIT_CARD, CASH, DEBTOR, INVESTMENT
    }
}
