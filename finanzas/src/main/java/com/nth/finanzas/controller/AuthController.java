package com.nth.finanzas.controller;

import com.nth.finanzas.dto.AuthRequest;
import com.nth.finanzas.dto.AuthResponse;
import com.nth.finanzas.dto.ChangePasswordRequest;
import com.nth.finanzas.dto.RegisterRequest;
import com.nth.finanzas.model.Role;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.RoleRepository;
import com.nth.finanzas.repository.UserRepository;
import com.nth.finanzas.service.JwtService;
import com.nth.finanzas.service.RateLimiterService;
import com.nth.finanzas.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Autenticación", description = "Registro y acceso al sistema mediante JWT")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RateLimiterService rateLimiterService;
    private final HttpServletRequest httpRequest;

    private String getClientIp() {
        String xfHeader = httpRequest.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isBlank()) {
            return xfHeader.split(",")[0].trim();
        }
        String realIp = httpRequest.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp;
        }
        return httpRequest.getRemoteAddr();
    }

    @PostMapping("/register")
    @Operation(
            summary = "Registrar usuario",
            description = "Crea una nueva cuenta de usuario con el rol ROLE_USER por defecto.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Usuario registrado con éxito"),
            @ApiResponse(responseCode = "400", description = "Los datos enviados no son válidos o el usuario ya existe")
    })
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Intento de registro para username={} email={}", request.getUsername(), request.getEmail());

        // Validar que contraseña coincida
        if (!request.getPassword().equals(request.getPasswordConfirm())) {
            log.warn("Registro rechazado por contraseñas distintas para username={}", request.getUsername());
            return ResponseEntity.badRequest().body("Las contraseñas no coinciden");
        }

        // Validar que el usuario no exista
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registro rechazado: username ya existe={}", request.getUsername());
            return ResponseEntity.badRequest().body("El usuario ya existe");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Registro rechazado: email ya existe={}", request.getEmail());
            return ResponseEntity.badRequest().body("El email ya está registrado");
        }

        // Crear nuevo usuario
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .build();

        // Asignar rol por defecto ROLE_USER
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new RuntimeException("Rol por defecto no encontrado"));
        log.debug("Asignando rol ROLE_USER al usuario {}", request.getUsername());
        user.getRoles().add(userRole);

        userRepository.save(user);
        log.info("Usuario registrado correctamente username={} id={}", user.getUsername(), user.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body("Usuario registrado con éxito");
    }

    @PostMapping("/login")
    @Operation(
            summary = "Iniciar sesión",
            description = "Autentica al usuario y devuelve un token JWT junto con sus datos básicos.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Autenticación exitosa"),
            @ApiResponse(responseCode = "401", description = "Usuario o contraseña incorrectos"),
            @ApiResponse(responseCode = "429", description = "Demasiados intentos fallidos")
    })
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        String clientIp = getClientIp();
        if (rateLimiterService.isBlocked(clientIp)) {
            long remaining = rateLimiterService.getRemainingBlockMinutes(clientIp);
            log.warn("Login bloqueado para IP={} por exceso de intentos fallidos", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Demasiados intentos fallidos. Por favor intenta de nuevo en " + remaining + " minutos.");
        }

        log.info("Intento de login para username={}", request.getUsername());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            rateLimiterService.recordFailedAttempt(clientIp);
            log.warn("Login fallido para username={}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
        }

        rateLimiterService.resetAttempts(clientIp);

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String jwtToken = jwtService.generateToken(user);

        AuthResponse response = AuthResponse.builder()
                .token(jwtToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .userId(user.getId())
                .build();

        log.info("Login exitoso para username={} id={}", user.getUsername(), user.getId());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    @Operation(
            summary = "Cambiar contraseña",
            description = "Cambia la contraseña del usuario autenticado previa verificación de la contraseña actual.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Contraseña actualizada exitosamente"),
            @ApiResponse(responseCode = "400", description = "La contraseña actual es incorrecta o los datos son inválidos"),
            @ApiResponse(responseCode = "401", description = "Usuario no autenticado"),
            @ApiResponse(responseCode = "429", description = "Demasiados intentos fallidos")
    })
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String clientIp = getClientIp();
        if (rateLimiterService.isBlocked(clientIp)) {
            long remaining = rateLimiterService.getRemainingBlockMinutes(clientIp);
            log.warn("Cambio de contraseña bloqueado para IP={} por exceso de intentos fallidos", clientIp);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("Demasiados intentos fallidos. Por favor intenta de nuevo en " + remaining + " minutos.");
        }

        Long userId;
        try {
            userId = SecurityUtil.getCurrentUserId();
        } catch (Exception e) {
            log.warn("Intento de cambio de contraseña sin autenticación válida");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no autenticado");
        }

        log.info("Intento de cambio de contraseña para userId={}", userId);

        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            log.warn("Cambio de contraseña rechazado para userId={}: las nuevas contraseñas no coinciden", userId);
            return ResponseEntity.badRequest().body("Las nuevas contraseñas no coinciden");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            rateLimiterService.recordFailedAttempt(clientIp);
            log.warn("Cambio de contraseña rechazado para userId={}: contraseña actual incorrecta", userId);
            return ResponseEntity.badRequest().body("La contraseña actual es incorrecta");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        rateLimiterService.resetAttempts(clientIp);

        log.info("Contraseña actualizada exitosamente para userId={}", userId);
        return ResponseEntity.ok("Contraseña actualizada exitosamente");
    }
}