package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.company.CompanySettingsDto;

public interface CompanySettingsService {

    CompanySettingsDto getSettings();

    CompanySettingsDto saveSettings(CompanySettingsDto dto);
}
