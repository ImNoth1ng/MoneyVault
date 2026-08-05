package com.nth.finanzas.util;

import com.nth.finanzas.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utilidad para extraer información del usuario autenticado
 */
@Component
public class SecurityUtil {

    /**
     * Obtiene el userId del usuario autenticado desde el contexto de seguridad
     * @return ID del usuario autenticado
     * @throws RuntimeException si el usuario no está autenticado
     */
    public static Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado");
        }

        Object principal = authentication.getPrincipal();
        
        if (principal instanceof User) {
            return ((User) principal).getId();
        }
        
        throw new RuntimeException("No se pudo obtener el ID del usuario del token JWT");
    }

    /**
     * Obtiene el usuario autenticado desde el contexto de seguridad
     * @return Usuario autenticado
     * @throws RuntimeException si el usuario no está autenticado
     */
    public static User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado");
        }

        Object principal = authentication.getPrincipal();
        
        if (principal instanceof User) {
            return (User) principal;
        }
        
        throw new RuntimeException("No se pudo obtener el usuario del token JWT");
    }

    /**
     * Obtiene el username del usuario autenticado
     * @return Username del usuario
     */
    public static String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Usuario no autenticado");
        }
        
        return authentication.getName();
    }
}
