package com.nth.finanzas.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentHoldingResponse {

    private Long id;
    private Long accountId;
    private String accountName;
    private String accountCurrency;

    private String symbol;
    private String name;
    private BigDecimal quantity;
    private BigDecimal buyPrice;
    private BigDecimal totalInvested;
    private String currency;
    private String assetType;
    private LocalDateTime buyDate;
    private String notes;

    // Market data and calculations
    private BigDecimal currentPrice;
    private BigDecimal currentValue;
    private BigDecimal gainLoss;
    private BigDecimal gainLossPercent;
    private BigDecimal dailyChangePercent;

    // Values converted to Account's base currency (e.g. MXN)
    private BigDecimal currentValueInAccountCurrency;
    private BigDecimal totalInvestedInAccountCurrency;
    private BigDecimal gainLossInAccountCurrency;

    private boolean isQuoteLive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
