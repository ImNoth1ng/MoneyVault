package com.nth.finanzas.controller;

import com.nth.finanzas.dto.*;
import com.nth.finanzas.service.InvestmentService;
import com.nth.finanzas.service.MarketDataService;
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

import java.util.*;

@RestController
@RequestMapping("/api/v1/investments")
@RequiredArgsConstructor
@Tag(name = "Inversiones", description = "Seguimiento de portafolio, activos bursátiles, cotizaciones en vivo y pools de liquidez por broker")
@SecurityRequirement(name = "bearerAuth")
public class InvestmentController {

    private final InvestmentService investmentService;
    private final MarketDataService marketDataService;

    @PostMapping
    @Operation(summary = "Registrar posición de inversión", description = "Crea un activo o acción comprada, con opción de descontar del saldo líquido disponible del broker.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Posición registrada con éxito"),
            @ApiResponse(responseCode = "400", description = "Datos de inversión inválidos")
    })
    public ResponseEntity<InvestmentHoldingResponse> createHolding(@Valid @RequestBody InvestmentHoldingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        InvestmentHoldingResponse response = investmentService.createHolding(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    @Operation(summary = "Listar posiciones de inversión", description = "Obtiene todas las acciones y activos del usuario con cotizaciones y rendimientos actualizados.")
    public ResponseEntity<List<InvestmentHoldingResponse>> getHoldings(
            @RequestParam(required = false) Long accountId) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<InvestmentHoldingResponse> holdings = investmentService.getHoldings(userId, accountId);
        return ResponseEntity.ok(holdings);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar posición de inversión", description = "Modifica los datos de una posición existente (cantidad, precio de compra, notas).")
    public ResponseEntity<InvestmentHoldingResponse> updateHolding(
            @PathVariable Long id,
            @Valid @RequestBody InvestmentHoldingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        InvestmentHoldingResponse response = investmentService.updateHolding(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar posición de inversión", description = "Elimina una posición, opcionalmente devolviendo su costo al saldo líquido disponible del broker.")
    public ResponseEntity<Void> deleteHolding(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean refundToCash) {
        Long userId = SecurityUtil.getCurrentUserId();
        investmentService.deleteHolding(userId, id, refundToCash);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    @Operation(summary = "Resumen consolidado del portafolio", description = "Devuelve métricas totales de inversión: valor total, liquidez disponible por broker, activos invertidos, rendimientos y gráfico de distribución.")
    public ResponseEntity<PortfolioSummaryDTO> getPortfolioSummary() {
        Long userId = SecurityUtil.getCurrentUserId();
        PortfolioSummaryDTO summary = investmentService.getPortfolioSummary(userId);
        return ResponseEntity.ok(summary);
    }

    @GetMapping("/quotes")
    @Operation(summary = "Obtener cotizaciones de mercado", description = "Consulta precios de bolsa en tiempo real para una lista de símbolos (ej: symbols=NVDA,VOO).")
    public ResponseEntity<Map<String, StockQuoteDTO>> getQuotes(
            @RequestParam List<String> symbols,
            @RequestParam(defaultValue = "false") boolean refresh) {
        if (symbols != null && symbols.size() > 30) {
            throw new IllegalArgumentException("No se pueden consultar más de 30 símbolos por solicitud");
        }
        if (refresh) {
            marketDataService.clearCache();
        }
        Map<String, StockQuoteDTO> quotes = marketDataService.getQuotes(symbols);
        return ResponseEntity.ok(quotes);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Forzar actualización de cotizaciones", description = "Invalida la caché de cotizaciones para forzar datos frescos del mercado.")
    public ResponseEntity<Map<String, String>> refreshQuotes() {
        marketDataService.clearCache();
        return ResponseEntity.ok(Map.of("message", "Caché de cotizaciones de mercado limpiada con éxito"));
    }
}
