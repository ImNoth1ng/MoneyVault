package com.nth.finanzas.controller;

import com.nth.finanzas.dto.TransactionRequest;
import com.nth.finanzas.dto.TransactionResponse;
import com.nth.finanzas.service.TransactionService;
import com.nth.finanzas.util.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
@Tag(name = "Movimientos", description = "Administración de gastos, compras, ingresos, depósitos y transferencias")
@SecurityRequirement(name = "bearerAuth")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    @Operation(summary = "Crear movimiento financiero", description = "Registra un gasto, ingreso o transferencia, actualizando en automático los balances de las cuentas y tarjetas.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Movimiento registrado con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos del movimiento inválidos")
    })
    public ResponseEntity<TransactionResponse> createTransaction(@Valid @RequestBody TransactionRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        TransactionResponse response = transactionService.createTransaction(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar movimientos", description = "Obtiene el listado cronológico de movimientos del usuario autenticado, con filtro opcional por tipo (EXPENSE, INCOME, TRANSFER).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Listado de movimientos obtenido")
    })
    public ResponseEntity<List<TransactionResponse>> getAllTransactions(
            @RequestParam(required = false) String type) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<TransactionResponse> transactions = transactionService.getTransactionsByUserId(userId, type);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener detalle de movimiento", description = "Devuelve el detalle de un movimiento por su identificador.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Movimiento encontrado"),
        @ApiResponse(responseCode = "404", description = "Movimiento no encontrado")
    })
    public ResponseEntity<TransactionResponse> getTransaction(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        TransactionResponse response = transactionService.getTransactionById(userId, id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar movimiento", description = "Elimina un movimiento y revierte de forma automática sus efectos en los saldos y deudas de las cuentas involucradas.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Movimiento eliminado y saldos revertidos"),
        @ApiResponse(responseCode = "404", description = "Movimiento no encontrado")
    })
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        transactionService.deleteTransaction(userId, id);
        return ResponseEntity.noContent().build();
    }
}
