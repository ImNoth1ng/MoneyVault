package com.nth.finanzas.controller;

import com.nth.finanzas.dto.RecurringTransactionRequest;
import com.nth.finanzas.dto.RecurringTransactionResponse;
import com.nth.finanzas.service.RecurringTransactionService;
import com.nth.finanzas.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recurring-transactions")
@RequiredArgsConstructor
@Tag(name = "Movimientos Recurrentes", description = "Plantillas de movimientos frecuentes (gastos, ingresos y transferencias recurrentes)")
@SecurityRequirement(name = "bearerAuth")
public class RecurringTransactionController {

    private final RecurringTransactionService recurringService;

    @PostMapping
    @Operation(summary = "Crear movimiento recurrente", description = "Crea una plantilla de movimiento recurrente con cuenta, categoría, descripción y monto predefinido.")
    public ResponseEntity<RecurringTransactionResponse> create(@Valid @RequestBody RecurringTransactionRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(recurringService.create(userId, request));
    }

    @GetMapping
    @Operation(summary = "Listar movimientos recurrentes", description = "Obtiene todos los movimientos recurrentes configurados por el usuario.")
    public ResponseEntity<List<RecurringTransactionResponse>> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(recurringService.getAllByUserId(userId));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar movimiento recurrente", description = "Actualiza los datos de un movimiento recurrente existente.")
    public ResponseEntity<RecurringTransactionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody RecurringTransactionRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        return ResponseEntity.ok(recurringService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar movimiento recurrente", description = "Elimina una plantilla de movimiento recurrente.")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        recurringService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}

