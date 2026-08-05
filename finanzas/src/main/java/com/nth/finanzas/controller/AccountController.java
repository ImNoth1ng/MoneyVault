package com.nth.finanzas.controller;

import com.nth.finanzas.dto.AccountRequest;
import com.nth.finanzas.dto.AccountResponse;
import com.nth.finanzas.service.AccountService;
import com.nth.finanzas.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Cuentas", description = "Administración de cuentas bancarias y de efectivo")
@SecurityRequirement(name = "bearerAuth")
public class AccountController {

    private final AccountService accountService;

    @PostMapping
        @Operation(summary = "Crear cuenta", description = "Crea una cuenta nueva para el usuario autenticado.")
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Cuenta creada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
        })
    public ResponseEntity<AccountResponse> createAccount(@Valid @RequestBody AccountRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        AccountResponse response = accountService.createAccount(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
        @Operation(summary = "Listar mis cuentas", description = "Devuelve todas las cuentas del usuario autenticado.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de cuentas obtenido correctamente")
        })
    public ResponseEntity<List<AccountResponse>> getAllAccounts() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<AccountResponse> accounts = accountService.getAccountsByUserId(userId);
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/{id}")
        @Operation(summary = "Obtener cuenta", description = "Devuelve el detalle de una cuenta por su identificador.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cuenta encontrada"),
            @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
        })
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        AccountResponse account = accountService.getAccountById(userId, id);
        return ResponseEntity.ok(account);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar cuenta", description = "Actualiza el nombre, tipo, saldo o moneda de una cuenta existente.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Cuenta actualizada correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
        })
    public ResponseEntity<AccountResponse> updateAccount(
            @PathVariable Long id,
            @Valid @RequestBody AccountRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        AccountResponse response = accountService.updateAccount(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
        @Operation(summary = "Eliminar cuenta", description = "Elimina una cuenta por su identificador.")
        @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Cuenta eliminada correctamente"),
            @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
        })
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        accountService.deleteAccount(userId, id);
        return ResponseEntity.noContent().build();
    }
}
