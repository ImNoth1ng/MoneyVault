package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "TicketItemResponse", description = "Representación pública de un ítem de ticket de deuda")
public class TicketItemResponse {
    @Schema(description = "Identificador del ítem", example = "1")
    private Long id;
    @Schema(description = "Concepto del ítem", example = "Préstamo principal")
    private String concept;
    @Schema(description = "Monto del ítem", example = "50000.00")
    private BigDecimal amount;
}
