package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionStatusRequestDto;
import com.Tirth_Electrical_Main.MainBackend.service.FinanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Accounts & Finance (this class kept its original name, ExpenseController,
 * so existing references stay valid). It stores MONEY OUT only: money in is
 * never entered by hand, it comes from paid invoices (see InvoiceController).
 * ADMIN and ACCOUNTANT only - see SecurityConfig.
 */
@RestController
@RequestMapping("/finance")
@RequiredArgsConstructor
public class ExpenseController {

    private final FinanceService financeService;

    @GetMapping("/transactions")
    public List<TransactionResponseDto> getAllTransactions() {
        return financeService.getAllTransactions();
    }

    @PostMapping("/transactions")
    public ResponseEntity<TransactionResponseDto> createTransaction(
            @Valid @RequestBody TransactionRequestDto dto) {
        return ResponseEntity.status(201).body(financeService.createTransaction(dto));
    }

    @PutMapping("/transactions/{id}")
    public TransactionResponseDto updateTransaction(@PathVariable Long id,
                                                    @Valid @RequestBody TransactionRequestDto dto) {
        return financeService.updateTransaction(id, dto);
    }

    @PatchMapping("/transactions/{id}/status")
    public TransactionResponseDto updateStatus(@PathVariable Long id,
                                               @Valid @RequestBody TransactionStatusRequestDto dto) {
        return financeService.updateStatus(id, dto.getStatus());
    }

    @DeleteMapping("/transactions/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        financeService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/budgets")
    public Map<String, BigDecimal> getBudgets() {
        return financeService.getBudgets();
    }

    @PutMapping("/budgets")
    public Map<String, BigDecimal> saveBudgets(@RequestBody Map<String, BigDecimal> budgets) {
        return financeService.saveBudgets(budgets);
    }
}
