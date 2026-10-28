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
public class PortfolioSummaryDTO {

    /**
     * Valor total consolidado del portafolio en MXN (Suma de efectivo líquido en todos los brokers + valor de mercado de activos).
     */
    private BigDecimal totalPortfolioValueMxn;

    /**
     * Total de efectivo disponible / líquido para invertir en brokers (MXN).
     */
    private BigDecimal totalCashAvailableMxn;

    /**
     * Total de valor actual de mercado de activos/acciones (MXN).
     */
    private BigDecimal totalAssetsValueMxn;

    /**
     * Costo total de adquisición invertido (MXN).
     */
    private BigDecimal totalCostBasisMxn;

    /**
     * Ganancia / Pérdida no realizada total consolidada (MXN).
     */
    private BigDecimal totalGainLossMxn;

    /**
     * Porcentaje de rendimiento global.
     */
    private BigDecimal totalGainLossPercent;

    /**
     * Tipo de cambio USD a MXN utilizado.
     */
    private BigDecimal usdToMxnRate;

    /**
     * Fecha/hora de última actualización de cotizaciones.
     */
    private LocalDateTime lastUpdated;

    /**
     * Desglose por broker / cuenta.
     */
    private List<BrokerSummaryDTO> brokers;

    /**
     * Distribución de activos (para gráficos de pie/donut).
     */
    private List<AssetAllocationDTO> allocation;
}
