package com.nth.finanzas.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrokerSummaryDTO {

    private Long accountId;
    private String accountName;
    private String currency;

    /**
     * Efectivo disponible y líquido para invertir en este broker (currentBalance de la cuenta).
     */
    private BigDecimal cashAvailable;

    /**
     * Valor actual acumulado de todas las posiciones/acciones en este broker.
     */
    private BigDecimal investedValue;

    /**
     * Costo total de adquisición de las posiciones en este broker.
     */
    private BigDecimal totalCost;

    /**
     * Valor total del portafolio en este broker (Efectivo líquido + Valor de activos).
     */
    private BigDecimal totalPortfolioValue;

    /**
     * Ganancia/Pérdida no realizada.
     */
    private BigDecimal gainLoss;
    private BigDecimal gainLossPercent;

    private int holdingsCount;
    private List<InvestmentHoldingResponse> holdings;
}
