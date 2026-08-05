package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "TicketItemRequest", description = "Concepto individual que forma parte de un ticket de deuda")
public class TicketItemRequest {
    @NotBlank(message = "El concepto es obligatorio")
    @Schema(description = "Concepto del cargo o movimiento", example = "Préstamo principal")
    @Size(min = 2, max = 100, message = "El concepto debe tener entre 2 y 100 caracteres")
    private String concept;

    @NotNull(message = "El monto es obligatorio")
    @Schema(description = "Monto del concepto", example = "50000.00")
    private BigDecimal amount;
}
