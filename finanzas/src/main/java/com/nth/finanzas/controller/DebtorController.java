package com.nth.finanzas.controller;

import com.nth.finanzas.dto.DebtorRequest;
import com.nth.finanzas.dto.DebtorResponse;
import com.nth.finanzas.service.DebtorService;
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
@RequestMapping("/api/v1/debtors")
@RequiredArgsConstructor
@Tag(name = "Deudores", description = "Gestión de personas o entidades que deben dinero")
@SecurityRequirement(name = "bearerAuth")
public class DebtorController {

    private final DebtorService debtorService;

    @PostMapping
        @Operation(summary = "Crear deudor", description = "Registra un nuevo deudor asociado al usuario autenticado.")
        @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Deudor creado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos")
        })
    public ResponseEntity<DebtorResponse> createDebtor(@Valid @RequestBody DebtorRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtorResponse response = debtorService.createDebtor(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
        @Operation(summary = "Listar mis deudores", description = "Devuelve todos los deudores del usuario autenticado.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Listado de deudores obtenido correctamente")
        })
    public ResponseEntity<List<DebtorResponse>> getAllDebtors() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<DebtorResponse> debtors = debtorService.getDebtorsByUserId(userId);
        return ResponseEntity.ok(debtors);
    }

    @GetMapping("/{id}")
        @Operation(summary = "Obtener deudor", description = "Devuelve el detalle de un deudor por su identificador.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deudor encontrado"),
            @ApiResponse(responseCode = "404", description = "Deudor no encontrado")
        })
    public ResponseEntity<DebtorResponse> getDebtor(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtorResponse debtor = debtorService.getDebtorById(userId, id);
        return ResponseEntity.ok(debtor);
    }

    @PutMapping("/{id}")
        @Operation(summary = "Actualizar deudor", description = "Actualiza el nombre o la información de contacto de un deudor.")
        @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deudor actualizado correctamente"),
            @ApiResponse(responseCode = "400", description = "Datos inválidos"),
            @ApiResponse(responseCode = "404", description = "Deudor no encontrado")
        })
    public ResponseEntity<DebtorResponse> updateDebtor(
            @PathVariable Long id,
            @Valid @RequestBody DebtorRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtorResponse response = debtorService.updateDebtor(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
        @Operation(summary = "Eliminar deudor", description = "Elimina un deudor por su identificador.")
        @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Deudor eliminado correctamente"),
            @ApiResponse(responseCode = "404", description = "Deudor no encontrado")
        })
    public ResponseEntity<Void> deleteDebtor(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        debtorService.deleteDebtor(userId, id);
        return ResponseEntity.noContent().build();
    }
}
