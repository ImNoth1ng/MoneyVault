package com.nth.finanzas.dto;

import lombok.*;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "AuthResponse", description = "Respuesta de autenticación con token JWT y datos básicos del usuario")
public class AuthResponse {
    @Schema(description = "JWT generado para el usuario", example = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...")
    private String token;
    @Schema(description = "Nombre de usuario", example = "juan.perez")
    private String username;
    @Schema(description = "Correo electrónico", example = "juan@example.com")
    private String email;
    @Schema(description = "Identificador del usuario", example = "1")
    private Long userId;
}
