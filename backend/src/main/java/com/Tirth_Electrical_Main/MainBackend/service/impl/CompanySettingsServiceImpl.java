package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.company.BankDetailsDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.company.CompanySettingsDto;
import com.Tirth_Electrical_Main.MainBackend.entity.CompanySettings;
import com.Tirth_Electrical_Main.MainBackend.repository.CompanySettingsRepository;
import com.Tirth_Electrical_Main.MainBackend.service.CompanySettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CompanySettingsServiceImpl implements CompanySettingsService {

    private static final int DEFAULT_GST = 18;
    private static final int DEFAULT_DUE_DAYS = 14;

    private final CompanySettingsRepository repository;

    @Override
    @Transactional(readOnly = true)
    public CompanySettingsDto getSettings() {
        // Nothing saved yet -> an empty row; the app then falls back to its built-in defaults.
        CompanySettings settings = repository.findById(CompanySettings.SINGLETON_ID)
                .orElseGet(() -> CompanySettings.builder().id(CompanySettings.SINGLETON_ID).build());
        return mapToDto(settings);
    }

    @Override
    @Transactional
    public CompanySettingsDto saveSettings(CompanySettingsDto dto) {
        CompanySettings settings = repository.findById(CompanySettings.SINGLETON_ID)
                .orElseGet(() -> CompanySettings.builder().id(CompanySettings.SINGLETON_ID).build());

        settings.setName(dto.getName().trim());
        settings.setTagline(Labels.clean(dto.getTagline()));
        settings.setAddressLine(Labels.clean(dto.getAddressLine()));
        settings.setPhone(Labels.clean(dto.getPhone()));
        settings.setEmail(Labels.clean(dto.getEmail()));
        settings.setGstin(Labels.clean(dto.getGstin()));

        BankDetailsDto bank = dto.getBank();
        if (bank != null) {
            settings.setBankAccountName(Labels.clean(bank.getAccountName()));
            settings.setBankName(Labels.clean(bank.getBankName()));
            settings.setBankAccountNumber(Labels.clean(bank.getAccountNumber()));
            settings.setBankIfsc(Labels.clean(bank.getIfsc()));
            settings.setBankUpi(Labels.clean(bank.getUpi()));
        }

        List<String> terms = dto.getTerms() == null ? new ArrayList<>() : dto.getTerms();
        settings.setTerms(terms.stream()
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.joining("\n")));

        settings.setDefaultGst(dto.getDefaultGst() == null ? DEFAULT_GST : dto.getDefaultGst());
        settings.setDueDays(dto.getDueDays() == null ? DEFAULT_DUE_DAYS : dto.getDueDays());
        settings.setOpeningBalance(dto.getOpeningBalance() == null
                ? BigDecimal.ZERO
                : dto.getOpeningBalance().setScale(2, RoundingMode.HALF_UP));

        return mapToDto(repository.save(settings));
    }

    private CompanySettingsDto mapToDto(CompanySettings s) {
        List<String> terms = s.getTerms() == null || s.getTerms().isBlank()
                ? new ArrayList<>()
                : Arrays.stream(s.getTerms().split("\\R")).filter(t -> !t.isBlank()).collect(Collectors.toList());

        return CompanySettingsDto.builder()
                .name(s.getName())
                .tagline(s.getTagline())
                .addressLine(s.getAddressLine())
                .phone(s.getPhone())
                .email(s.getEmail())
                .gstin(s.getGstin())
                .bank(BankDetailsDto.builder()
                        .accountName(s.getBankAccountName())
                        .bankName(s.getBankName())
                        .accountNumber(s.getBankAccountNumber())
                        .ifsc(s.getBankIfsc())
                        .upi(s.getBankUpi())
                        .build())
                .terms(terms)
                .defaultGst(s.getDefaultGst() == null ? DEFAULT_GST : s.getDefaultGst())
                .dueDays(s.getDueDays() == null ? DEFAULT_DUE_DAYS : s.getDueDays())
                .openingBalance(s.getOpeningBalance() == null ? BigDecimal.ZERO : s.getOpeningBalance())
                .build();
    }
}
