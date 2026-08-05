package com.nth.finanzas.dto;

import lombok.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "RegisterRequest", description = "Datos para crear una cuenta de usuario")
public class RegisterRequest {
    @NotBlank(message = "El username es obligatorio")
    @Schema(description = "Nombre de usuario único", example = "juan.perez")
    @Size(min = 3, max = 50, message = "El username debe tener entre 3 y 50 caracteres")
    private String username;

    @NotBlank(message = "El email es obligatorio")
    @Schema(description = "Correo electrónico del usuario", example = "juan@example.com")
    @Email(message = "El email no es válido")
    @Size(max = 100, message = "El email no puede superar 100 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Schema(description = "Contraseña de la cuenta", example = "Password123!")
    @Size(min = 8, max = 255, message = "La contraseña debe tener al menos 8 caracteres")
    private String password;

    @NotBlank(message = "La confirmación de contraseña es obligatoria")
    @Schema(description = "Confirmación de la contraseña", example = "Password123!")
    private String passwordConfirm;
}
