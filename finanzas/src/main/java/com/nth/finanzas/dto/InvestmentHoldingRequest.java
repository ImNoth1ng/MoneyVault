package com.nth.finanzas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentHoldingRequest {

    @NotNull(message = "El id de la cuenta (broker) es obligatorio")
    private Long accountId;

    @NotBlank(message = "El símbolo o ticker es obligatorio (ej. NVDA, VOO)")
    private String symbol;

    private String name;

    @NotNull(message = "La cantidad de títulos o acciones es obligatoria")
    @DecimalMin(value = "0.000001", message = "La cantidad debe ser mayor a 0")
    private BigDecimal quantity;

    @NotNull(message = "El precio de compra por título es obligatorio")
    @DecimalMin(value = "0.0001", message = "El precio de compra debe ser mayor a 0")
    private BigDecimal buyPrice;

    @Builder.Default
    private String currency = "MXN";

    @Builder.Default
    private String assetType = "STOCK";

    private LocalDateTime buyDate;

    private String notes;

    /**
     * Si es true, el importe total (quantity * buyPrice) se descuenta automáticamente
     * del saldo líquido disponible (currentBalance) de la cuenta de inversión (broker).
     */
    @Builder.Default
    private boolean deductFromCash = false;
}
