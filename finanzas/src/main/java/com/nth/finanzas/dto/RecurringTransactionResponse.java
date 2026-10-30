package com.nth.finanzas.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecurringTransactionResponse {

    private Long id;
    private Long userId;
    private String name;
    private Long accountId;
    private String accountName;
    private String accountType;
    private Long destinationAccountId;
    private String destinationAccountName;
    private String destinationAccountType;
    private BigDecimal amount;
    private String type;
    private String category;
    private String description;
    private String senderOrRecipient;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

