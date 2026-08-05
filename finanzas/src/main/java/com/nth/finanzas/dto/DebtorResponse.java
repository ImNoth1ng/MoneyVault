package com.nth.finanzas.dto;

import lombok.*;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "DebtorResponse", description = "Representación pública de un deudor")
public class DebtorResponse {
    @Schema(description = "Identificador del deudor", example = "1")
    private Long id;
    @Schema(description = "Nombre del deudor", example = "Carlos López")
    private String name;
    @Schema(description = "Información de contacto", example = "carlos@email.com o 555-1234", nullable = true)
    private String contactInfo;
}
