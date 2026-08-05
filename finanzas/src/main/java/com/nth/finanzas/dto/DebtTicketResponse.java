package com.nth.finanzas.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "DebtTicketResponse", description = "Representación pública de un ticket de deuda")
public class DebtTicketResponse {
    @Schema(description = "Identificador del ticket", example = "1")
    private Long id;
    @Schema(description = "Identificador del deudor", example = "1")
    private Long debtorId;
    @Schema(description = "Nombre del deudor", example = "Carlos López")
    private String debtorName;
    @Schema(description = "Descripción del ticket", example = "Préstamo para compra de auto", nullable = true)
    private String description;
    @Schema(description = "Fecha de emisión", example = "2026-08-04T10:30:00")
    private LocalDateTime issueDate;
    @Schema(description = "Monto total del ticket", example = "55000.00")
    private BigDecimal totalAmount;
    @Schema(description = "Indica si el ticket ya fue pagado", example = "false")
    private Boolean isPaid;
    @Schema(description = "Ítems que componen el ticket")
    private List<TicketItemResponse> items;
}
