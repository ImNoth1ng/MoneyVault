package com.nth.finanzas.controller;

import com.nth.finanzas.dto.BalanceSnapshotRequest;
import com.nth.finanzas.dto.BalanceSnapshotResponse;
import com.nth.finanzas.service.BalanceSnapshotService;
import com.nth.finanzas.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/accounts")
@RequiredArgsConstructor
@Tag(name = "Snapshots de balance", description = "Captura y consulta de snapshots de saldo por cuenta y globales")
@SecurityRequirement(name = "bearerAuth")
public class BalanceSnapshotController {

    private final BalanceSnapshotService balanceSnapshotService;

    @PostMapping("/{accountId}/snapshots")
    @Operation(summary = "Crear snapshot de cuenta", description = "Guarda un snapshot del saldo actual de la cuenta autenticada.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Snapshot creado correctamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
    })
    public ResponseEntity<BalanceSnapshotResponse> createSnapshot(
            @PathVariable Long accountId,
            @Valid @RequestBody BalanceSnapshotRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        BalanceSnapshotResponse response = balanceSnapshotService.createSnapshot(userId, accountId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/snapshots/global")
    @Operation(summary = "Crear snapshot global de resumen financiero", description = "Guarda un snapshot del resumen global de dinero libre y pasivos del usuario.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Snapshot global creado correctamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<BalanceSnapshotResponse> createGlobalSnapshot(
            @Valid @RequestBody BalanceSnapshotRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        BalanceSnapshotResponse response = balanceSnapshotService.createGlobalSnapshot(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{accountId}/snapshots")
    @Operation(summary = "Listar snapshots de una cuenta", description = "Devuelve todos los snapshots asociados a una cuenta.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Snapshots obtenidos correctamente"),
        @ApiResponse(responseCode = "404", description = "Cuenta no encontrada")
    })
    public ResponseEntity<List<BalanceSnapshotResponse>> getSnapshotsByAccount(@PathVariable Long accountId) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<BalanceSnapshotResponse> snapshots = balanceSnapshotService.getSnapshotsByAccount(userId, accountId);
        return ResponseEntity.ok(snapshots);
    }

    @GetMapping("/snapshots/user")
    @Operation(summary = "Listar todos los snapshots del usuario", description = "Devuelve todo el historial de snapshots (globales y por cuenta) del usuario.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Snapshots obtenidos correctamente")
    })
    public ResponseEntity<List<BalanceSnapshotResponse>> getAllUserSnapshots() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<BalanceSnapshotResponse> snapshots = balanceSnapshotService.getAllSnapshotsByUser(userId);
        return ResponseEntity.ok(snapshots);
    }

    @GetMapping("/snapshots/period")
    @Operation(summary = "Listar snapshots por periodo", description = "Devuelve los snapshots del usuario entre dos fechas ISO-8601.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Snapshots obtenidos correctamente")
    })
    public ResponseEntity<List<BalanceSnapshotResponse>> getSnapshotsByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<BalanceSnapshotResponse> snapshots = balanceSnapshotService.getSnapshotsByPeriod(userId, startDate, endDate);
        return ResponseEntity.ok(snapshots);
    }

    @DeleteMapping("/snapshots/{id}")
    @Operation(summary = "Eliminar snapshot", description = "Elimina un snapshot de balance por su identificador.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Snapshot eliminado correctamente"),
        @ApiResponse(responseCode = "404", description = "Snapshot no encontrado")
    })
    public ResponseEntity<Void> deleteSnapshot(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        balanceSnapshotService.deleteSnapshot(userId, id);
        return ResponseEntity.noContent().build();
    }
}