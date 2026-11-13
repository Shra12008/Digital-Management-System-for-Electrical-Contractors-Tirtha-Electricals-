package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.company.CompanySettingsDto;
import com.Tirth_Electrical_Main.MainBackend.service.CompanySettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * Company details for invoices + invoice/finance defaults.
 * GET: ADMIN, ACCOUNTANT, CLIENT. PUT: ADMIN, ACCOUNTANT (see SecurityConfig).
 */
@RestController
@RequestMapping("/company-settings")
@RequiredArgsConstructor
public class CompanySettingsController {

    private final CompanySettingsService companySettingsService;

    @GetMapping
    public CompanySettingsDto getSettings() {
        return companySettingsService.getSettings();
    }

    @PutMapping
    public CompanySettingsDto saveSettings(@Valid @RequestBody CompanySettingsDto dto) {
        return companySettingsService.saveSettings(dto);
    }
}
