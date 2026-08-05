package com.nth.finanzas.dto;

import com.nth.finanzas.model.BalanceSnapshot;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "BalanceSnapshotRequest", description = "Datos para registrar un snapshot de balance")
public class BalanceSnapshotRequest {

    @NotNull(message = "La frecuencia del snapshot es obligatoria")
    @Schema(description = "Frecuencia del snapshot", example = "MONTHLY", allowableValues = {"FIFTEEN_DAYS", "FORTNIGHTLY", "MONTHLY"})
    private BalanceSnapshot.SnapshotFrequency frequency;

    @Schema(description = "Tipo de snapshot (GLOBAL, ACCOUNT, CREDIT_CARD, CASH, DEBTOR, INVESTMENT)", example = "GLOBAL")
    private BalanceSnapshot.SnapshotType snapshotType;

    @Schema(description = "Monto personalizado del snapshot (opcional)", example = "15500.00")
    private BigDecimal customAmount;

    @Schema(description = "Notas explicativas o desglose (opcional)", example = "Desglose de efectivo en billetes")
    private String notes;
}