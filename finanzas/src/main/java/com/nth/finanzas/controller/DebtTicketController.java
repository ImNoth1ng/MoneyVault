package com.nth.finanzas.controller;

import com.nth.finanzas.dto.DebtTicketRequest;
import com.nth.finanzas.dto.DebtTicketResponse;
import com.nth.finanzas.service.DebtTicketService;
import com.nth.finanzas.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

@RestController
@RequestMapping("/api/v1/debt-tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets de deuda", description = "Administración de tickets, conceptos e ítems de deuda")
@SecurityRequirement(name = "bearerAuth")
public class DebtTicketController {

    private final DebtTicketService debtTicketService;

    @PostMapping
    @Operation(summary = "Crear ticket de deuda", description = "Registra un nuevo ticket de deuda con uno o más ítems asociados.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Ticket creado correctamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos")
    })
    public ResponseEntity<DebtTicketResponse> createDebtTicket(@Valid @RequestBody DebtTicketRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtTicketResponse response = debtTicketService.createDebtTicket(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar ticket de deuda", description = "Actualiza la descripción, deudor o ítems de un ticket existente.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Ticket actualizado correctamente"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<DebtTicketResponse> updateDebtTicket(
            @PathVariable Long id,
            @Valid @RequestBody DebtTicketRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtTicketResponse response = debtTicketService.updateDebtTicket(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Listar mis tickets", description = "Devuelve todos los tickets de deuda del usuario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Listado de tickets obtenido correctamente")
    })
    public ResponseEntity<List<DebtTicketResponse>> getAllDebtTickets() {
        Long userId = SecurityUtil.getCurrentUserId();
        List<DebtTicketResponse> tickets = debtTicketService.getTicketsByUserId(userId);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener ticket", description = "Devuelve el detalle de un ticket de deuda por su identificador.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Ticket encontrado"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<DebtTicketResponse> getDebtTicket(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtTicketResponse ticket = debtTicketService.getTicketById(userId, id);
        return ResponseEntity.ok(ticket);
    }

    @GetMapping("/debtor/{debtorId}")
    @Operation(summary = "Listar tickets de un deudor", description = "Devuelve todos los tickets asociados a un deudor específico.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tickets obtenidos correctamente")
    })
    public ResponseEntity<List<DebtTicketResponse>> getTicketsByDebtor(@PathVariable Long debtorId) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<DebtTicketResponse> tickets = debtTicketService.getTicketsByDebtorId(userId, debtorId);
        return ResponseEntity.ok(tickets);
    }

    @PutMapping("/{id}/mark-paid")
    @Operation(summary = "Marcar ticket como pagado", description = "Marca un ticket de deuda como pagado.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Ticket marcado como pagado"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<DebtTicketResponse> markTicketAsPaid(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        DebtTicketResponse response = debtTicketService.markTicketAsPaid(userId, id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar ticket", description = "Elimina un ticket de deuda por su identificador.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Ticket eliminado correctamente"),
        @ApiResponse(responseCode = "404", description = "Ticket no encontrado")
    })
    public ResponseEntity<Void> deleteDebtTicket(@PathVariable Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        debtTicketService.deleteTicket(userId, id);
        return ResponseEntity.noContent().build();
    }
}
