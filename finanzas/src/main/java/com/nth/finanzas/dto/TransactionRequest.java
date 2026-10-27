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
public class TransactionRequest {

    @NotNull(message = "El identificador de la cuenta es obligatorio")
    private Long accountId;

    private Long destinationAccountId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    @NotBlank(message = "El tipo de movimiento es obligatorio (EXPENSE, INCOME, TRANSFER)")
    private String type;

    private String category;

    private String description;

    private String senderOrRecipient;

    private Long debtTicketId;

    private LocalDateTime transactionDate;
}
