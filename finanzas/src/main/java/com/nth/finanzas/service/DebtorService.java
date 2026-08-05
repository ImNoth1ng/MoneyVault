package com.nth.finanzas.service;

import com.nth.finanzas.dto.DebtorRequest;
import com.nth.finanzas.dto.DebtorResponse;
import com.nth.finanzas.model.Debtor;
import com.nth.finanzas.model.User;
import com.nth.finanzas.repository.DebtorRepository;
import com.nth.finanzas.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DebtorService {

    private final DebtorRepository debtorRepository;
    private final UserRepository userRepository;

    public DebtorResponse createDebtor(Long userId, DebtorRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Debtor debtor = Debtor.builder()
                .user(user)
                .name(request.getName())
                .contactInfo(request.getContactInfo())
                .build();

        Debtor savedDebtor = debtorRepository.save(debtor);
        return mapToResponse(savedDebtor);
    }

    public List<DebtorResponse> getDebtorsByUserId(Long userId) {
        return debtorRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public DebtorResponse getDebtorById(Long debtorId) {
        Debtor debtor = debtorRepository.findById(debtorId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado"));
        return mapToResponse(debtor);
    }

    public DebtorResponse getDebtorById(Long userId, Long debtorId) {
        Debtor debtor = debtorRepository.findByIdAndUserId(debtorId, userId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));
        return mapToResponse(debtor);
    }

    public DebtorResponse updateDebtor(Long debtorId, DebtorRequest request) {
        Debtor debtor = debtorRepository.findById(debtorId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado"));

        debtor.setName(request.getName());
        debtor.setContactInfo(request.getContactInfo());

        Debtor updatedDebtor = debtorRepository.save(debtor);
        return mapToResponse(updatedDebtor);
    }

    public DebtorResponse updateDebtor(Long userId, Long debtorId, DebtorRequest request) {
        Debtor debtor = debtorRepository.findByIdAndUserId(debtorId, userId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));

        debtor.setName(request.getName());
        debtor.setContactInfo(request.getContactInfo());

        Debtor updatedDebtor = debtorRepository.save(debtor);
        return mapToResponse(updatedDebtor);
    }

    public void deleteDebtor(Long debtorId) {
        debtorRepository.deleteById(debtorId);
    }

    public void deleteDebtor(Long userId, Long debtorId) {
        Debtor debtor = debtorRepository.findByIdAndUserId(debtorId, userId)
                .orElseThrow(() -> new RuntimeException("Deudor no encontrado o no autorizado"));
        debtorRepository.delete(debtor);
    }

    private DebtorResponse mapToResponse(Debtor debtor) {
        return DebtorResponse.builder()
                .id(debtor.getId())
                .name(debtor.getName())
                .contactInfo(debtor.getContactInfo())
                .build();
    }
}
