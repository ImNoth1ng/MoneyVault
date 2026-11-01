package com.nth.finanzas.config;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

@Configuration
public class JacksonConfig {

    @Bean
    public Jackson2ObjectMapperBuilderCustomizer jacksonLocalDateTimeCustomizer() {
        return builder -> builder.deserializerByType(LocalDateTime.class, new FlexibleLocalDateTimeDeserializer());
    }

    public static class FlexibleLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

        @Override
        public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            String raw = p.getText();
            if (raw == null || raw.isBlank()) {
                return null;
            }
            String value = raw.trim();

            // 1. Si viene solo fecha (YYYY-MM-DD)
            if (value.length() == 10) {
                try {
                    return LocalDate.parse(value, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay();
                } catch (DateTimeParseException ignored) {
                }
            }

            // 2. Si viene sin sufijo 'Z' ni offset de zona horaria (ej. "2026-11-01T16:30" o "2026-11-01T16:30:00")
            if (!value.endsWith("Z") && !value.endsWith("z") && !hasZoneOffset(value)) {
                try {
                    if (value.length() == 16) {
                        return LocalDateTime.parse(value + ":00", DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                    }
                    return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
                } catch (DateTimeParseException ignored) {
                }
            }

            // 3. Si viene con 'Z' o con offset ISO (ej. "2026-11-01T22:30:00.000Z")
            try {
                OffsetDateTime odt = OffsetDateTime.parse(value, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                return odt.atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
            } catch (DateTimeParseException ignored) {
            }

            try {
                Instant instant = Instant.parse(value);
                return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
            } catch (DateTimeParseException ignored) {
            }

            // 4. Fallback: recortar 'Z' final si existiera
            if (value.endsWith("Z") || value.endsWith("z")) {
                String stripped = value.substring(0, value.length() - 1);
                return LocalDateTime.parse(stripped, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
            }

            return LocalDateTime.parse(value);
        }

        private boolean hasZoneOffset(String str) {
            int tIndex = str.indexOf('T');
            if (tIndex < 0) return false;
            String timePart = str.substring(tIndex + 1);
            return timePart.contains("+") || timePart.contains("-");
        }
    }
}

