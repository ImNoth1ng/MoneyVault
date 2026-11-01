package com.nth.finanzas.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionRequest {

    @NotNull(message = "El identificador de la cuenta es obligatorio")
    private Long accountId;

    private Long destinationAccountId;

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    private BigDecimal amount;

    @NotBlank(message = "El tipo de movimiento es obligatorio (EXPENSE, INCOME, TRANSFER)")
    private String type;

    private String category;

    private String description;

    private String senderOrRecipient;

    private Long debtTicketId;

    private LocalDateTime transactionDate;

    // --- Campos opcionales para adjuntar un gasto (EXPENSE) a un ticket de deuda ---
    private Boolean attachToTicket;

    /**
     * Modo de asociación al ticket: "EXISTING" (ticket pendiente existente) o "NEW" (crear nuevo ticket)
     */
    private String ticketMode;

    /**
     * ID del ticket existente al cual agregar el gasto (cuando ticketMode == "EXISTING")
     */
    private Long targetTicketId;

    /**
     * ID del deudor existente (cuando ticketMode == "NEW")
     */
    private Long debtorId;

    /**
     * Nombre de un nuevo deudor a crear al vuelo (cuando ticketMode == "NEW" y debtorId == null)
     */
    private String newDebtorName;

    /**
     * Contacto opcional del nuevo deudor creado al vuelo
     */
    private String newDebtorContact;

    /**
     * Descripción / título del nuevo ticket (cuando ticketMode == "NEW")
     */
    private String ticketDescription;

    /**
     * Concepto del ítem dentro del ticket (si se omite, usa la descripción o categoría del gasto)
     */
    private String ticketItemConcept;

    /**
     * Monto específico a cargar en el ticket (si se omite, usa el monto total del gasto)
     */
    private BigDecimal ticketItemAmount;

    /**
     * Si es true al editar un movimiento, desvincula el gasto del ticket y remueve su cargo del ticket
     */
    private Boolean detachFromTicket;
}
