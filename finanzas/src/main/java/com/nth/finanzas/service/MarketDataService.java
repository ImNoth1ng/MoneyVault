package com.nth.finanzas.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nth.finanzas.dto.StockQuoteDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketDataService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Cache con TTL de 5 minutos y límite máximo para evitar OOM DoS
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);
    private static final int MAX_CACHE_SIZE = 500;
    private static final java.util.regex.Pattern SAFE_SYMBOL_PATTERN = java.util.regex.Pattern.compile("^[A-Z0-9.^=-]{1,15}$");
    private final Map<String, CacheEntry> quoteCache = new ConcurrentHashMap<>();

    private void putInCache(String key, StockQuoteDTO quote) {
        if (quoteCache.size() >= MAX_CACHE_SIZE) {
            quoteCache.entrySet().removeIf(e -> e.getValue().isExpired());
            if (quoteCache.size() >= MAX_CACHE_SIZE) {
                quoteCache.clear();
            }
        }
        quoteCache.put(key, new CacheEntry(quote));
    }

    private static class CacheEntry {
        final StockQuoteDTO quote;
        final Instant timestamp;

        CacheEntry(StockQuoteDTO quote) {
            this.quote = quote;
            this.timestamp = Instant.now();
        }

        boolean isExpired() {
            return Instant.now().isAfter(timestamp.plus(CACHE_TTL));
        }
    }

    /**
     * Obtiene la tasa de cambio USD a MXN actual.
     */
    public BigDecimal getUsdToMxnRate() {
        StockQuoteDTO usdMxn = fetchSymbolDirectCached("USDMXN=X");
        if (usdMxn != null && usdMxn.getRegularMarketPrice() != null && usdMxn.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
            return usdMxn.getRegularMarketPrice();
        }
        return new BigDecimal("18.50"); // Fallback prudente
    }

    private StockQuoteDTO fetchSymbolDirectCached(String symbol) {
        CacheEntry entry = quoteCache.get(symbol);
        if (entry != null && !entry.isExpired()) {
            return entry.quote;
        }
        StockQuoteDTO directQuote = fetchQuoteDirect(symbol, symbol);
        if (directQuote != null && directQuote.getRegularMarketPrice() != null && directQuote.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
            putInCache(symbol, directQuote);
            return directQuote;
        }
        return entry != null ? entry.quote : null;
    }

    /**
     * Obtiene cotización en tiempo real para un símbolo o ticker (por defecto en la Bolsa Mexicana de Valores BMV/SIC).
     */
    public StockQuoteDTO getQuote(String rawSymbol) {
        return getQuote(rawSymbol, "MXN");
    }

    /**
     * Obtiene cotización en tiempo real para un símbolo indicando el mercado/moneda preferida:
     * - "MXN" / "MX" (por defecto): Prioriza la Bolsa Mexicana de Valores (BMV/SIC) consultando {symbol}.MX en MXN.
     * - "USD" / "US": Consulta directamente la Bolsa de Estados Unidos (NYSE/NASDAQ) en USD.
     */
    public StockQuoteDTO getQuote(String rawSymbol, String preferredMarketOrCurrency) {
        if (rawSymbol == null || rawSymbol.trim().isEmpty()) {
            return null;
        }

        String symbol = rawSymbol.trim().toUpperCase();
        if (!SAFE_SYMBOL_PATTERN.matcher(symbol).matches()) {
            log.warn("Símbolo de cotización rechazado por formato inválido: {}", symbol);
            return null;
        }

        boolean isUsMarket = "USD".equalsIgnoreCase(preferredMarketOrCurrency)
                || "US".equalsIgnoreCase(preferredMarketOrCurrency)
                || "USA".equalsIgnoreCase(preferredMarketOrCurrency);

        String cacheKey = symbol + ":" + (isUsMarket ? "USD" : "MXN");

        // 1. Revisar cache específica por mercado/moneda si no ha expirado
        CacheEntry entry = quoteCache.get(cacheKey);
        if (entry != null && !entry.isExpired()) {
            return entry.quote;
        }

        if (isUsMarket) {
            // Mercado de Estados Unidos (NYSE / NASDAQ en USD)
            String usSymbol = symbol.endsWith(".MX") ? symbol.substring(0, symbol.length() - 3) : symbol;
            StockQuoteDTO usQuote = fetchQuoteDirect(usSymbol, symbol);
            if (usQuote != null && usQuote.getRegularMarketPrice() != null && usQuote.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
                putInCache(cacheKey, usQuote);
                return usQuote;
            }
        } else {
            // Por defecto: Bolsa Mexicana de Valores (BMV / SIC) agregando .MX
            if (!symbol.contains(".") && !symbol.contains("=") && !symbol.contains("-")) {
                String mxSymbol = symbol + ".MX";
                CacheEntry mxEntry = quoteCache.get(mxSymbol);
                if (mxEntry != null && !mxEntry.isExpired()) {
                    return mxEntry.quote;
                }

                StockQuoteDTO mxQuote = fetchQuoteDirect(mxSymbol, symbol);
                if (mxQuote != null && mxQuote.getRegularMarketPrice() != null && mxQuote.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
                    putInCache(mxSymbol, mxQuote);
                    putInCache(cacheKey, mxQuote);
                    return mxQuote;
                }
            }
        }

        // 2. Consultar símbolo directo como respaldo
        StockQuoteDTO directQuote = fetchQuoteDirect(symbol, symbol);
        if (directQuote != null && directQuote.getRegularMarketPrice() != null && directQuote.getRegularMarketPrice().compareTo(BigDecimal.ZERO) > 0) {
            putInCache(cacheKey, directQuote);
            return directQuote;
        }

        // 3. Si falló la consulta pero teníamos una entrada previa en cache (aunque expirada), la devolvemos con flag no-live
        if (entry != null) {
            StockQuoteDTO staleQuote = entry.quote;
            staleQuote.setLive(false);
            return staleQuote;
        }

        // 4. Fallback si nunca se ha podido consultar
        StockQuoteDTO fallback = StockQuoteDTO.builder()
                .symbol(symbol)
                .shortName(symbol)
                .regularMarketPrice(BigDecimal.ZERO)
                .previousClose(BigDecimal.ZERO)
                .change(BigDecimal.ZERO)
                .changePercent(BigDecimal.ZERO)
                .currency(isUsMarket ? "USD" : "MXN")
                .exchangeName(isUsMarket ? "NMS" : "MEX")
                .isLive(false)
                .fetchedAt(LocalDateTime.now())
                .sparkline(Collections.emptyList())
                .build();

        return fallback;
    }

    private StockQuoteDTO fetchQuoteDirect(String remoteSymbol, String originalSymbol) {
        if (!SAFE_SYMBOL_PATTERN.matcher(remoteSymbol).matches()) {
            return null;
        }
        try {
            String url = String.format("https://query1.finance.yahoo.com/v8/finance/chart/%s?interval=1d&range=1mo", remoteSymbol);

            HttpHeaders headers = new HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json");

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseYahooChartResponse(originalSymbol, response.getBody());
            }
        } catch (Exception e) {
            log.debug("No se pudo obtener cotización remota para {}: {}", remoteSymbol, e.getMessage());
        }
        return null;
    }

    /**
     * Obtiene múltiples cotizaciones a la vez (por defecto en BMV / MXN).
     */
    public Map<String, StockQuoteDTO> getQuotes(Collection<String> symbols) {
        return getQuotes(symbols, "MXN");
    }

    /**
     * Obtiene múltiples cotizaciones a la vez para el mercado/moneda indicado ("MXN" o "USD").
     */
    public Map<String, StockQuoteDTO> getQuotes(Collection<String> symbols, String preferredMarketOrCurrency) {
        Map<String, StockQuoteDTO> results = new HashMap<>();
        if (symbols == null) return results;

        for (String sym : symbols) {
            if (sym != null && !sym.isBlank()) {
                String normalized = sym.trim().toUpperCase();
                StockQuoteDTO quote = getQuote(normalized, preferredMarketOrCurrency);
                if (quote != null) {
                    results.put(normalized, quote);
                }
            }
        }
        return results;
    }

    /**
     * Parsea el JSON retornado por Yahoo Finance Chart API.
     */
    private StockQuoteDTO parseYahooChartResponse(String symbol, String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode resultNode = root.path("chart").path("result");
            if (resultNode.isMissingNode() || !resultNode.isArray() || resultNode.isEmpty()) {
                return null;
            }

            JsonNode firstResult = resultNode.get(0);
            JsonNode meta = firstResult.path("meta");

            String resolvedSymbol = symbol;
            String shortName = meta.path("shortName").asText(meta.path("symbol").asText(resolvedSymbol));
            String currency = meta.path("currency").asText("MXN");
            String exchangeName = meta.path("exchangeName").asText(meta.path("exchange").asText(""));

            double priceVal = meta.path("regularMarketPrice").asDouble(0.0);
            double prevCloseVal = meta.path("chartPreviousClose").asDouble(priceVal);
            if (prevCloseVal == 0.0) {
                prevCloseVal = meta.path("previousClose").asDouble(priceVal);
            }

            double dayHighVal = meta.path("regularMarketDayHigh").asDouble(priceVal);
            double dayLowVal = meta.path("regularMarketDayLow").asDouble(priceVal);

            BigDecimal regularMarketPrice = BigDecimal.valueOf(priceVal).setScale(4, RoundingMode.HALF_UP);
            BigDecimal previousClose = BigDecimal.valueOf(prevCloseVal).setScale(4, RoundingMode.HALF_UP);
            BigDecimal change = regularMarketPrice.subtract(previousClose);
            BigDecimal changePercent = BigDecimal.ZERO;
            if (previousClose.compareTo(BigDecimal.ZERO) > 0) {
                changePercent = change.multiply(BigDecimal.valueOf(100)).divide(previousClose, 4, RoundingMode.HALF_UP);
            }

            // Extraer sparkline de los últimos cierres
            List<BigDecimal> sparkline = new ArrayList<>();
            JsonNode closeNode = firstResult.path("indicators").path("quote");
            if (closeNode.isArray() && !closeNode.isEmpty()) {
                JsonNode closes = closeNode.get(0).path("close");
                if (closes.isArray()) {
                    for (JsonNode c : closes) {
                        if (!c.isNull() && c.isNumber()) {
                            sparkline.add(BigDecimal.valueOf(c.asDouble()).setScale(2, RoundingMode.HALF_UP));
                        }
                    }
                }
            }

            // Reducir sparkline a máx 20 puntos para gráficos limpios
            if (sparkline.size() > 20) {
                sparkline = sparkline.subList(sparkline.size() - 20, sparkline.size());
            }

            return StockQuoteDTO.builder()
                    .symbol(resolvedSymbol)
                    .shortName(shortName)
                    .regularMarketPrice(regularMarketPrice)
                    .previousClose(previousClose)
                    .change(change)
                    .changePercent(changePercent)
                    .dayHigh(BigDecimal.valueOf(dayHighVal).setScale(4, RoundingMode.HALF_UP))
                    .dayLow(BigDecimal.valueOf(dayLowVal).setScale(4, RoundingMode.HALF_UP))
                    .currency(currency)
                    .exchangeName(exchangeName)
                    .sparkline(sparkline)
                    .isLive(true)
                    .fetchedAt(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error al parsear respuesta de Yahoo para {}: {}", symbol, e.getMessage());
            return null;
        }
    }

    /**
     * Limpia la cache forzadamente (útil al pulsar "Refrescar cotizaciones").
     */
    public void clearCache() {
        quoteCache.clear();
    }
}
