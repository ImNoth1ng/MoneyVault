package com.nth.finanzas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TicketPaymentRequest {

    @NotNull(message = "Debes seleccionar la cuenta a donde se recibió el dinero")
    private Long accountId;

    @NotNull(message = "El monto recibido es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto recibido debe ser mayor a 0")
    private BigDecimal amountReceived;

    private LocalDateTime paymentDate;

    private String notes;
}
