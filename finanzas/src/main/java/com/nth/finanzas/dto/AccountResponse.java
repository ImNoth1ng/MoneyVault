package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "AccountResponse", description = "Representación pública de una cuenta bancaria")
public class AccountResponse {
    @Schema(description = "Identificador de la cuenta", example = "1")
    private Long id;
    @Schema(description = "Nombre de la cuenta", example = "Cuenta Corriente Banco X")
    private String name;
    @Schema(description = "Tipo de cuenta", example = "DEBIT")
    private String type;
    @Schema(description = "Saldo actual", example = "5000.00")
    private BigDecimal currentBalance;
    @Schema(description = "Límite de crédito", example = "15000.00", nullable = true)
    private BigDecimal creditLimit;
    @Schema(description = "Moneda usada", example = "MXN")
    private String currency;
    @Schema(description = "Cantidad de billetes de $1000", example = "5")
    private Integer b1000Count;
    @Schema(description = "Cantidad de billetes de $500", example = "10")
    private Integer b500Count;
    @Schema(description = "Cantidad de billetes de $200", example = "8")
    private Integer b200Count;
    @Schema(description = "Cantidad de billetes de $100", example = "15")
    private Integer b100Count;
    @Schema(description = "Cantidad de billetes de $50", example = "20")
    private Integer b50Count;
    @Schema(description = "Cantidad de billetes de $20", example = "10")
    private Integer b20Count;
    @Schema(description = "Fecha de creación", example = "2026-08-04T10:30:00")
    private LocalDateTime createdAt;
}
