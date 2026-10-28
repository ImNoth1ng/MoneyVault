package com.nth.finanzas.service;

import com.nth.finanzas.dto.*;
import com.nth.finanzas.model.Account;
import com.nth.finanzas.model.InvestmentHolding;
import com.nth.finanzas.model.Transaction;
import com.nth.finanzas.model.TransactionType;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.AccountRepository;
import com.nth.finanzas.repository.InvestmentHoldingRepository;
import com.nth.finanzas.repository.TransactionRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {

    private final InvestmentHoldingRepository holdingRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final MarketDataService marketDataService;

    private static final String[] ALLOCATION_PALETTE = {
            "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6",
            "#ec4899", "#f59e0b", "#14b8a6", "#6366f1"
    };

    /**
     * Registra una nueva compra o posición de inversión.
     */
    @Transactional
    public InvestmentHoldingResponse createHolding(Long userId, InvestmentHoldingRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Account account = accountRepository.findByIdAndUserId(req.getAccountId(), userId)
                .orElseThrow(() -> new RuntimeException("Cuenta de inversión no encontrada o no pertenece al usuario"));

        if (account.getType() != Account.AccountType.INVESTMENT) {
            throw new RuntimeException("La cuenta seleccionada no es de tipo INVERSIÓN (INVESTMENT)");
        }

        String symbol = req.getSymbol().trim().toUpperCase();
        String currency = (req.getCurrency() != null && !req.getCurrency().isBlank())
                ? req.getCurrency().trim().toUpperCase()
                : "MXN";

        BigDecimal quantity = req.getQuantity();
        BigDecimal buyPrice = req.getBuyPrice();
        BigDecimal totalInvested = quantity.multiply(buyPrice).setScale(4, RoundingMode.HALF_UP);

        BigDecimal usdRate = marketDataService.getUsdToMxnRate();

        // Si se seleccionó descontar de la liquidez del broker:
        if (req.isDeductFromCash()) {
            BigDecimal deductionInAccountCurrency = totalInvested;
            if ("USD".equalsIgnoreCase(currency) && !"USD".equalsIgnoreCase(account.getCurrency())) {
                deductionInAccountCurrency = totalInvested.multiply(usdRate).setScale(4, RoundingMode.HALF_UP);
            } else if (!"USD".equalsIgnoreCase(currency) && "USD".equalsIgnoreCase(account.getCurrency())) {
                deductionInAccountCurrency = totalInvested.divide(usdRate, 4, RoundingMode.HALF_UP);
            }

            BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            account.setCurrentBalance(currentBal.subtract(deductionInAccountCurrency));
            accountRepository.save(account);

            // Registrar movimiento en el historial
            Transaction purchaseTx = Transaction.builder()
                    .user(user)
                    .account(account)
                    .amount(deductionInAccountCurrency)
                    .type(TransactionType.EXPENSE)
                    .category("Inversión")
                    .description("Compra de " + quantity + " " + symbol + " (" + req.getName() + ")")
                    .transactionDate(req.getBuyDate() != null ? req.getBuyDate() : LocalDateTime.now())
                    .build();
            transactionRepository.save(purchaseTx);
        }

        InvestmentHolding holding = InvestmentHolding.builder()
                .user(user)
                .account(account)
                .symbol(symbol)
                .name(req.getName() != null && !req.getName().isBlank() ? req.getName().trim() : symbol)
                .quantity(quantity)
                .buyPrice(buyPrice)
                .currency(currency)
                .assetType(req.getAssetType() != null ? req.getAssetType().trim().toUpperCase() : "STOCK")
                .buyDate(req.getBuyDate() != null ? req.getBuyDate() : LocalDateTime.now())
                .notes(req.getNotes())
                .build();

        InvestmentHolding saved = holdingRepository.save(holding);
        StockQuoteDTO quote = marketDataService.getQuote(symbol);
        return mapToResponse(saved, quote, usdRate);
    }

    /**
     * Lista todas las posiciones del usuario, con opción de filtrar por broker (accountId).
     */
    public List<InvestmentHoldingResponse> getHoldings(Long userId, Long accountId) {
        List<InvestmentHolding> holdings;
        if (accountId != null && accountId > 0) {
            holdings = holdingRepository.findByUserIdAndAccountIdOrderByCreatedAtDesc(userId, accountId);
        } else {
            holdings = holdingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        }

        Set<String> symbols = holdings.stream().map(InvestmentHolding::getSymbol).collect(Collectors.toSet());
        Map<String, StockQuoteDTO> quotes = marketDataService.getQuotes(symbols);
        BigDecimal usdRate = marketDataService.getUsdToMxnRate();

        return holdings.stream()
                .map(h -> mapToResponse(h, quotes.get(h.getSymbol()), usdRate))
                .collect(Collectors.toList());
    }

    /**
     * Actualiza una posición existente.
     */
    @Transactional
    public InvestmentHoldingResponse updateHolding(Long userId, Long id, InvestmentHoldingRequest req) {
        InvestmentHolding holding = holdingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Posición de inversión no encontrada"));

        String symbol = req.getSymbol().trim().toUpperCase();
        holding.setSymbol(symbol);
        holding.setName(req.getName() != null && !req.getName().isBlank() ? req.getName().trim() : symbol);
        holding.setQuantity(req.getQuantity());
        holding.setBuyPrice(req.getBuyPrice());
        if (req.getCurrency() != null && !req.getCurrency().isBlank()) {
            holding.setCurrency(req.getCurrency().trim().toUpperCase());
        }
        if (req.getAssetType() != null && !req.getAssetType().isBlank()) {
            holding.setAssetType(req.getAssetType().trim().toUpperCase());
        }
        if (req.getBuyDate() != null) {
            holding.setBuyDate(req.getBuyDate());
        }
        holding.setNotes(req.getNotes());

        InvestmentHolding updated = holdingRepository.save(holding);
        BigDecimal usdRate = marketDataService.getUsdToMxnRate();
        StockQuoteDTO quote = marketDataService.getQuote(symbol);
        return mapToResponse(updated, quote, usdRate);
    }

    /**
     * Elimina una posición, opcionalmente reembolsando su costo al saldo del broker.
     */
    @Transactional
    public void deleteHolding(Long userId, Long id, boolean refundToCash) {
        InvestmentHolding holding = holdingRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Posición de inversión no encontrada"));

        if (refundToCash) {
            Account account = holding.getAccount();
            BigDecimal totalInvested = holding.getQuantity().multiply(holding.getBuyPrice());
            BigDecimal refundAmount = totalInvested;

            BigDecimal usdRate = marketDataService.getUsdToMxnRate();
            if ("USD".equalsIgnoreCase(holding.getCurrency()) && !"USD".equalsIgnoreCase(account.getCurrency())) {
                refundAmount = totalInvested.multiply(usdRate).setScale(4, RoundingMode.HALF_UP);
            } else if (!"USD".equalsIgnoreCase(holding.getCurrency()) && "USD".equalsIgnoreCase(account.getCurrency())) {
                refundAmount = totalInvested.divide(usdRate, 4, RoundingMode.HALF_UP);
            }

            BigDecimal currentBal = account.getCurrentBalance() != null ? account.getCurrentBalance() : BigDecimal.ZERO;
            account.setCurrentBalance(currentBal.add(refundAmount));
            accountRepository.save(account);

            // Registrar movimiento de reembolso
            Transaction refundTx = Transaction.builder()
                    .user(holding.getUser())
                    .account(account)
                    .amount(refundAmount)
                    .type(TransactionType.INCOME)
                    .category("Inversión")
                    .description("Venta / Reembolso de " + holding.getQuantity() + " " + holding.getSymbol())
                    .transactionDate(LocalDateTime.now())
                    .build();
            transactionRepository.save(refundTx);
        }

        holdingRepository.delete(holding);
    }

    /**
     * Calcula y consolida el resumen global y por broker de todo el portafolio de inversiones.
     */
    public PortfolioSummaryDTO getPortfolioSummary(Long userId) {
        List<Account> brokerAccounts = accountRepository.findByUserId(userId).stream()
                .filter(a -> a.getType() == Account.AccountType.INVESTMENT)
                .collect(Collectors.toList());

        List<InvestmentHolding> allHoldings = holdingRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Set<String> symbols = allHoldings.stream().map(InvestmentHolding::getSymbol).collect(Collectors.toSet());
        Map<String, StockQuoteDTO> quotes = marketDataService.getQuotes(symbols);
        BigDecimal usdRate = marketDataService.getUsdToMxnRate();

        Map<Long, List<InvestmentHolding>> holdingsByAccount = allHoldings.stream()
                .collect(Collectors.groupingBy(h -> h.getAccount().getId()));

        List<BrokerSummaryDTO> brokerSummaries = new ArrayList<>();
        BigDecimal totalCashAvailableMxn = BigDecimal.ZERO;
        BigDecimal totalAssetsValueMxn = BigDecimal.ZERO;
        BigDecimal totalCostBasisMxn = BigDecimal.ZERO;

        Map<String, BigDecimal> allocationMap = new HashMap<>();

        for (Account broker : brokerAccounts) {
            BigDecimal brokerCash = broker.getCurrentBalance() != null ? broker.getCurrentBalance() : BigDecimal.ZERO;
            BigDecimal brokerCashMxn = "USD".equalsIgnoreCase(broker.getCurrency())
                    ? brokerCash.multiply(usdRate)
                    : brokerCash;
            totalCashAvailableMxn = totalCashAvailableMxn.add(brokerCashMxn);

            List<InvestmentHolding> accountHoldings = holdingsByAccount.getOrDefault(broker.getId(), Collections.emptyList());
            List<InvestmentHoldingResponse> holdingResponses = new ArrayList<>();

            BigDecimal brokerInvestedValue = BigDecimal.ZERO;
            BigDecimal brokerTotalCost = BigDecimal.ZERO;

            for (InvestmentHolding h : accountHoldings) {
                StockQuoteDTO q = quotes.get(h.getSymbol());
                InvestmentHoldingResponse resp = mapToResponse(h, q, usdRate);
                holdingResponses.add(resp);

                BigDecimal investedInAcc = resp.getCurrentValueInAccountCurrency() != null
                        ? resp.getCurrentValueInAccountCurrency()
                        : resp.getCurrentValue();
                BigDecimal costInAcc = resp.getTotalInvestedInAccountCurrency() != null
                        ? resp.getTotalInvestedInAccountCurrency()
                        : resp.getTotalInvested();

                brokerInvestedValue = brokerInvestedValue.add(investedInAcc);
                brokerTotalCost = brokerTotalCost.add(costInAcc);

                totalAssetsValueMxn = totalAssetsValueMxn.add(investedInAcc);
                totalCostBasisMxn = totalCostBasisMxn.add(costInAcc);

                allocationMap.merge(h.getSymbol(), investedInAcc, BigDecimal::add);
            }

            BigDecimal brokerGainLoss = brokerInvestedValue.subtract(brokerTotalCost);
            BigDecimal brokerGainLossPercent = BigDecimal.ZERO;
            if (brokerTotalCost.compareTo(BigDecimal.ZERO) > 0) {
                brokerGainLossPercent = brokerGainLoss.multiply(BigDecimal.valueOf(100)).divide(brokerTotalCost, 2, RoundingMode.HALF_UP);
            }

            BigDecimal brokerTotalPortfolio = brokerCash.add(brokerInvestedValue);

            brokerSummaries.add(BrokerSummaryDTO.builder()
                    .accountId(broker.getId())
                    .accountName(broker.getName())
                    .currency(broker.getCurrency())
                    .cashAvailable(brokerCash)
                    .investedValue(brokerInvestedValue)
                    .totalCost(brokerTotalCost)
                    .totalPortfolioValue(brokerTotalPortfolio)
                    .gainLoss(brokerGainLoss)
                    .gainLossPercent(brokerGainLossPercent)
                    .holdingsCount(accountHoldings.size())
                    .holdings(holdingResponses)
                    .build());
        }

        BigDecimal totalPortfolioValueMxn = totalCashAvailableMxn.add(totalAssetsValueMxn);
        BigDecimal totalGainLossMxn = totalAssetsValueMxn.subtract(totalCostBasisMxn);
        BigDecimal totalGainLossPercent = BigDecimal.ZERO;
        if (totalCostBasisMxn.compareTo(BigDecimal.ZERO) > 0) {
            totalGainLossPercent = totalGainLossMxn.multiply(BigDecimal.valueOf(100)).divide(totalCostBasisMxn, 2, RoundingMode.HALF_UP);
        }

        // Construir lista de asignación de activos para gráficos
        List<AssetAllocationDTO> allocations = new ArrayList<>();
        if (totalCashAvailableMxn.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal cashPct = totalPortfolioValueMxn.compareTo(BigDecimal.ZERO) > 0
                    ? totalCashAvailableMxn.multiply(BigDecimal.valueOf(100)).divide(totalPortfolioValueMxn, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            allocations.add(AssetAllocationDTO.builder()
                    .name("Efectivo Líquido")
                    .symbol("CASH")
                    .type("CASH")
                    .valueMxn(totalCashAvailableMxn)
                    .percentage(cashPct)
                    .color("#10b981")
                    .build());
        }

        int colorIdx = 1;
        for (Map.Entry<String, BigDecimal> entry : allocationMap.entrySet()) {
            BigDecimal val = entry.getValue();
            BigDecimal pct = totalPortfolioValueMxn.compareTo(BigDecimal.ZERO) > 0
                    ? val.multiply(BigDecimal.valueOf(100)).divide(totalPortfolioValueMxn, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            allocations.add(AssetAllocationDTO.builder()
                    .name(entry.getKey())
                    .symbol(entry.getKey())
                    .type("STOCK")
                    .valueMxn(val)
                    .percentage(pct)
                    .color(ALLOCATION_PALETTE[colorIdx % ALLOCATION_PALETTE.length])
                    .build());
            colorIdx++;
        }

        return PortfolioSummaryDTO.builder()
                .totalPortfolioValueMxn(totalPortfolioValueMxn.setScale(2, RoundingMode.HALF_UP))
                .totalCashAvailableMxn(totalCashAvailableMxn.setScale(2, RoundingMode.HALF_UP))
                .totalAssetsValueMxn(totalAssetsValueMxn.setScale(2, RoundingMode.HALF_UP))
                .totalCostBasisMxn(totalCostBasisMxn.setScale(2, RoundingMode.HALF_UP))
                .totalGainLossMxn(totalGainLossMxn.setScale(2, RoundingMode.HALF_UP))
                .totalGainLossPercent(totalGainLossPercent)
                .usdToMxnRate(usdRate)
                .lastUpdated(LocalDateTime.now())
                .brokers(brokerSummaries)
                .allocation(allocations)
                .build();
    }

    /**
     * Mapea una entidad a su DTO de respuesta con cálculos financieros completos.
     */
    private InvestmentHoldingResponse mapToResponse(InvestmentHolding h, StockQuoteDTO quote, BigDecimal usdRate) {
        BigDecimal totalInvested = h.getQuantity().multiply(h.getBuyPrice()).setScale(4, RoundingMode.HALF_UP);

        BigDecimal currentPrice = h.getBuyPrice();
        boolean isLive = false;
        BigDecimal dailyChange = BigDecimal.ZERO;

        if (quote != null && quote.getRegularMarketPrice() != null && quote.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
            currentPrice = quote.getRegularMarketPrice();
            if ("USD".equalsIgnoreCase(quote.getCurrency()) && "MXN".equalsIgnoreCase(h.getCurrency())) {
                currentPrice = currentPrice.multiply(usdRate).setScale(4, RoundingMode.HALF_UP);
            } else if ("MXN".equalsIgnoreCase(quote.getCurrency()) && "USD".equalsIgnoreCase(h.getCurrency())) {
                currentPrice = currentPrice.divide(usdRate, 4, RoundingMode.HALF_UP);
            }
            isLive = quote.isLive();
            dailyChange = quote.getChangePercent();
        }

        BigDecimal currentValue = h.getQuantity().multiply(currentPrice).setScale(4, RoundingMode.HALF_UP);
        BigDecimal gainLoss = currentValue.subtract(totalInvested).setScale(4, RoundingMode.HALF_UP);
        BigDecimal gainLossPercent = BigDecimal.ZERO;
        if (totalInvested.compareTo(BigDecimal.ZERO) > 0) {
            gainLossPercent = gainLoss.multiply(BigDecimal.valueOf(100)).divide(totalInvested, 2, RoundingMode.HALF_UP);
        }

        // Conversión a la moneda de la cuenta (ej. MXN)
        BigDecimal multiplier = BigDecimal.ONE;
        if ("USD".equalsIgnoreCase(h.getCurrency()) && !"USD".equalsIgnoreCase(h.getAccount().getCurrency())) {
            multiplier = usdRate;
        } else if (!"USD".equalsIgnoreCase(h.getCurrency()) && "USD".equalsIgnoreCase(h.getAccount().getCurrency())) {
            multiplier = BigDecimal.ONE.divide(usdRate, 4, RoundingMode.HALF_UP);
        }

        BigDecimal currentValueInAcc = currentValue.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalInvestedInAcc = totalInvested.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        BigDecimal gainLossInAcc = gainLoss.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);

        return InvestmentHoldingResponse.builder()
                .id(h.getId())
                .accountId(h.getAccount().getId())
                .accountName(h.getAccount().getName())
                .accountCurrency(h.getAccount().getCurrency())
                .symbol(h.getSymbol())
                .name(h.getName())
                .quantity(h.getQuantity())
                .buyPrice(h.getBuyPrice())
                .totalInvested(totalInvested)
                .currency(h.getCurrency())
                .assetType(h.getAssetType())
                .buyDate(h.getBuyDate())
                .notes(h.getNotes())
                .currentPrice(currentPrice)
                .currentValue(currentValue)
                .gainLoss(gainLoss)
                .gainLossPercent(gainLossPercent)
                .dailyChangePercent(dailyChange)
                .currentValueInAccountCurrency(currentValueInAcc)
                .totalInvestedInAccountCurrency(totalInvestedInAcc)
                .gainLossInAccountCurrency(gainLossInAcc)
                .isQuoteLive(isLive)
                .createdAt(h.getCreatedAt())
                .updatedAt(h.getUpdatedAt())
                .build();
    }
}
