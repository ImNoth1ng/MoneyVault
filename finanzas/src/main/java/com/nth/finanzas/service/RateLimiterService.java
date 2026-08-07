package com.nth.finanzas.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class RateLimiterService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_DURATION_MS = TimeUnit.MINUTES.toMillis(5);
    private static final long LOCK_DURATION_MS = TimeUnit.MINUTES.toMillis(15);

    private final Map<String, AttemptTracker> attemptsMap = new ConcurrentHashMap<>();

    private static class AttemptTracker {
        private int attempts;
        private long firstAttemptTime;
        private long lockedUntil;

        public AttemptTracker(long currentTime) {
            this.attempts = 1;
            this.firstAttemptTime = currentTime;
            this.lockedUntil = 0;
        }

        public boolean isLocked(long currentTime) {
            return lockedUntil > currentTime;
        }

        public boolean isWindowExpired(long currentTime) {
            return (currentTime - firstAttemptTime) > WINDOW_DURATION_MS;
        }

        public void increment(long currentTime) {
            this.attempts++;
            if (this.attempts >= MAX_ATTEMPTS) {
                this.lockedUntil = currentTime + LOCK_DURATION_MS;
            }
        }

        public long getRemainingLockMinutes(long currentTime) {
            if (!isLocked(currentTime)) {
                return 0;
            }
            long remainingMs = lockedUntil - currentTime;
            return Math.max(1, TimeUnit.MILLISECONDS.toMinutes(remainingMs) + 1);
        }
    }

    /**
     * Verifica si una clave (IP/usuario) está bloqueada por exceder intentos fallidos.
     */
    public boolean isBlocked(String key) {
        if (key == null || key.isBlank()) return false;
        long now = System.currentTimeMillis();
        AttemptTracker tracker = attemptsMap.get(key);

        if (tracker == null) return false;

        if (tracker.isLocked(now)) {
            return true;
        }

        // Si la ventana de tiempo expiró y no estaba bloqueado, eliminar registro caducado
        if (tracker.isWindowExpired(now)) {
            attemptsMap.remove(key);
            return false;
        }

        return false;
    }

    /**
     * Registra un intento fallido para la clave especificada.
     */
    public synchronized void recordFailedAttempt(String key) {
        if (key == null || key.isBlank()) return;
        long now = System.currentTimeMillis();

        attemptsMap.compute(key, (k, tracker) -> {
            if (tracker == null || tracker.isWindowExpired(now) || (!tracker.isLocked(now) && tracker.lockedUntil > 0)) {
                return new AttemptTracker(now);
            }
            tracker.increment(now);
            if (tracker.isLocked(now)) {
                log.warn("RateLimiter: Clave {} bloqueada por {} minutos tras {} intentos fallidos",
                        key, tracker.getRemainingLockMinutes(now), MAX_ATTEMPTS);
            }
            return tracker;
        });
    }

    /**
     * Reinicia el contador de intentos fallidos al tener éxito.
     */
    public void resetAttempts(String key) {
        if (key != null) {
            attemptsMap.remove(key);
        }
    }

    /**
     * Obtiene el tiempo restante de bloqueo en minutos.
     */
    public long getRemainingBlockMinutes(String key) {
        if (key == null) return 0;
        AttemptTracker tracker = attemptsMap.get(key);
        if (tracker == null) return 0;
        return tracker.getRemainingLockMinutes(System.currentTimeMillis());
    }
}
