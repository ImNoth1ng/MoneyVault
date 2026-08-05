package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "AccountRequest", description = "Datos para crear o actualizar una cuenta bancaria o de efectivo")
public class AccountRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Schema(description = "Nombre visible de la cuenta", example = "Cuenta Corriente Banco X")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String name;

    @NotBlank(message = "El tipo de cuenta es obligatorio")
    @Schema(description = "Tipo de cuenta", example = "DEBIT", allowableValues = {"DEBIT", "CREDIT", "CASH", "INVESTMENT"})
    @Pattern(regexp = "DEBIT|CREDIT|CASH|INVESTMENT", message = "El tipo debe ser DEBIT, CREDIT, CASH o INVESTMENT")
    private String type; // DEBIT, CREDIT, CASH, INVESTMENT

    @NotNull(message = "El saldo actual es obligatorio")
    @Schema(description = "Saldo inicial o actual de la cuenta", example = "5000.00")
    private BigDecimal currentBalance;

    @Schema(description = "Límite de crédito si aplica", example = "15000.00", nullable = true)
    private BigDecimal creditLimit;

    @NotBlank(message = "La moneda es obligatoria")
    @Schema(description = "Moneda ISO o abreviatura usada en la cuenta", example = "MXN")
    @Size(min = 3, max = 10, message = "La moneda debe tener entre 3 y 10 caracteres")
    @Builder.Default
    private String currency = "MXN";

    @Schema(description = "Cantidad de billetes de $1000 MXN", example = "5")
    private Integer b1000Count;

    @Schema(description = "Cantidad de billetes de $500 MXN", example = "10")
    private Integer b500Count;

    @Schema(description = "Cantidad de billetes de $200 MXN", example = "8")
    private Integer b200Count;

    @Schema(description = "Cantidad de billetes de $100 MXN", example = "15")
    private Integer b100Count;

    @Schema(description = "Cantidad de billetes de $50 MXN", example = "20")
    private Integer b50Count;

    @Schema(description = "Cantidad de billetes de $20 MXN", example = "10")
    private Integer b20Count;
}
