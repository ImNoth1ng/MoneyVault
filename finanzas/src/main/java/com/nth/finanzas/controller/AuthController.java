package com.nth.finanzas.controller;

import com.nth.finanzas.dto.AuthRequest;
import com.nth.finanzas.dto.AuthResponse;
import com.nth.finanzas.dto.RegisterRequest;
import com.nth.finanzas.model.Role;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.RoleRepository;
import com.nth.finanzas.repository.UserRepository;
import com.nth.finanzas.service.JwtService;
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
            @ApiResponse(responseCode = "401", description = "Usuario o contraseña incorrectos")
        })
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest request) {
        log.info("Intento de login para username={}", request.getUsername());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
        } catch (Exception e) {
            log.warn("Login fallido para username={}: {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario o contraseña incorrectos");
        }

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
}