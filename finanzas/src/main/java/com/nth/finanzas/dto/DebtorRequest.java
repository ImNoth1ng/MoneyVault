package com.nth.finanzas.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "DebtorRequest", description = "Datos para crear o actualizar un deudor")
public class DebtorRequest {
    @NotBlank(message = "El nombre es obligatorio")
    @Schema(description = "Nombre del deudor", example = "Carlos López")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String name;

    @Schema(description = "Información de contacto opcional", example = "carlos@email.com o 555-1234", nullable = true)
    @Size(max = 255, message = "La información de contacto no puede superar 255 caracteres")
    private String contactInfo;
}
