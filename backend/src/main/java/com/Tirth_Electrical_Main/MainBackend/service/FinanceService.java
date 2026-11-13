package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionResponseDto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface FinanceService {

    List<TransactionResponseDto> getAllTransactions();

    TransactionResponseDto createTransaction(TransactionRequestDto dto);

    TransactionResponseDto updateTransaction(Long id, TransactionRequestDto dto);

    TransactionResponseDto updateStatus(Long id, String status);

    void deleteTransaction(Long id);

    /** Monthly limit per expense category. */
    Map<String, BigDecimal> getBudgets();

    /** Replaces all budgets with the given category -> limit map. */
    Map<String, BigDecimal> saveBudgets(Map<String, BigDecimal> budgets);
}
