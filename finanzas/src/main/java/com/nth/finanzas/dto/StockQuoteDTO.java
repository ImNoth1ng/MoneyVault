package com.nth.finanzas.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockQuoteDTO {

    private String symbol;
    private String shortName;
    private BigDecimal regularMarketPrice;
    private BigDecimal previousClose;
    private BigDecimal change;
    private BigDecimal changePercent;
    private BigDecimal dayHigh;
    private BigDecimal dayLow;
    private String currency;
    private String exchangeName;
    private BigDecimal exchangeRateToMxn;
    private List<BigDecimal> sparkline;
    private boolean isLive;
    private LocalDateTime fetchedAt;
}
