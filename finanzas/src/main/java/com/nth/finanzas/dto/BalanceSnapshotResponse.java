package com.nth.finanzas.dto;

import com.nth.finanzas.model.BalanceSnapshot;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "BalanceSnapshotResponse", description = "Representación pública de un snapshot de balance")
public class BalanceSnapshotResponse {
    @Schema(description = "Identificador del snapshot", example = "1")
    private Long id;
    @Schema(description = "Identificador de la cuenta", example = "1")
    private Long accountId;
    @Schema(description = "Nombre de la cuenta", example = "Cuenta Corriente Banco X")
    private String accountName;
    @Schema(description = "Monto capturado en el snapshot", example = "5000.00")
    private BigDecimal snapshotAmount;
    @Schema(description = "Fecha y hora del snapshot", example = "2026-08-04T10:30:00")
    private LocalDateTime snapshotDate;
    @Schema(description = "Frecuencia asociada al snapshot", example = "MONTHLY")
    private BalanceSnapshot.SnapshotFrequency frequency;
    @Schema(description = "Tipo de snapshot", example = "GLOBAL")
    private BalanceSnapshot.SnapshotType snapshotType;
    @Schema(description = "Notas opcionales", example = "Billetes de 500 y 200")
    private String notes;
}