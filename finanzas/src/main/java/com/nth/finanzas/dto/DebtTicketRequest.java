package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "DebtTicketRequest", description = "Datos para crear un ticket de deuda con sus ítems")
public class DebtTicketRequest {
    @NotNull(message = "El debtorId es obligatorio")
    @Schema(description = "Identificador del deudor asociado", example = "1")
    private Long debtorId;

    @Schema(description = "Descripción general del ticket", example = "Préstamo para compra de auto", nullable = true)
    @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
    private String description;

    @NotEmpty(message = "Debe incluir al menos un ítem")
    @Schema(description = "Lista de conceptos y montos que componen el ticket")
    @Valid
    private List<TicketItemRequest> items;
}
