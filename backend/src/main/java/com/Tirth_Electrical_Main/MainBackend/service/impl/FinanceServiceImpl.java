package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.finance.TransactionResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.FinanceBudget;
import com.Tirth_Electrical_Main.MainBackend.entity.FinanceTransaction;
import com.Tirth_Electrical_Main.MainBackend.entity.TransactionStatus;
import com.Tirth_Electrical_Main.MainBackend.entity.TransactionType;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.FinanceBudgetRepository;
import com.Tirth_Electrical_Main.MainBackend.repository.FinanceTransactionRepository;
import com.Tirth_Electrical_Main.MainBackend.service.FinanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FinanceServiceImpl implements FinanceService {

    private static final BigDecimal MAX_BUDGET = new BigDecimal("999999999999.99");

    private final FinanceTransactionRepository transactionRepository;
    private final FinanceBudgetRepository budgetRepository;

    @Override
    @Transactional(readOnly = true)
    public List<TransactionResponseDto> getAllTransactions() {
        // Money in is not stored here any more - the UI builds it from the invoices.
        // (Income rows left over from older versions are simply not returned.)
        return transactionRepository.findAllByTypeOrderByTxnDateDescIdDesc(TransactionType.EXPENSE)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TransactionResponseDto createTransaction(TransactionRequestDto dto) {
        FinanceTransaction transaction = FinanceTransaction.builder().build();
        apply(transaction, dto);

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    @Transactional
    public TransactionResponseDto updateTransaction(Long id, TransactionRequestDto dto) {
        FinanceTransaction transaction = findOrThrow(id);
        apply(transaction, dto);

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    @Transactional
    public TransactionResponseDto updateStatus(Long id, String status) {
        FinanceTransaction transaction = findOrThrow(id);
        transaction.setStatus(Labels.parse(TransactionStatus.class, status, TransactionStatus.COMPLETED));

        return mapToResponse(transactionRepository.save(transaction));
    }

    @Override
    @Transactional
    public void deleteTransaction(Long id) {
        transactionRepository.delete(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, BigDecimal> getBudgets() {
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        budgetRepository.findAll().forEach(b -> result.put(b.getCategory(), b.getMonthlyLimit()));
        return result;
    }

    @Override
    @Transactional
    public Map<String, BigDecimal> saveBudgets(Map<String, BigDecimal> budgets) {
        // Validate everything first so a bad value can't leave half the budgets saved.
        for (Map.Entry<String, BigDecimal> entry : budgets.entrySet()) {
            String category = entry.getKey() == null ? "" : entry.getKey().trim();
            BigDecimal limit = entry.getValue();
            if (category.isEmpty() || category.length() > 60) {
                throw new IllegalArgumentException("Budget category must be 1 to 60 characters.");
            }
            if (limit == null || limit.signum() < 0 || limit.compareTo(MAX_BUDGET) > 0) {
                throw new IllegalArgumentException("Budget for " + category + " must be 0 or more.");
            }
        }

        budgetRepository.deleteAll();
        budgetRepository.flush();
        budgets.forEach((category, limit) -> budgetRepository.save(FinanceBudget.builder()
                .category(category.trim())
                .monthlyLimit(limit.setScale(2, RoundingMode.HALF_UP))
                .build()));

        return getBudgets();
    }

    // ------------------------------------------------------------------

    private FinanceTransaction findOrThrow(Long id) {
        FinanceTransaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction Not Found"));
        if (transaction.getType() != TransactionType.EXPENSE) {
            throw new IllegalArgumentException("Money in comes from invoices and cannot be changed here.");
        }
        return transaction;
    }

    private void apply(FinanceTransaction transaction, TransactionRequestDto dto) {
        transaction.setTxnDate(dto.getDate());
        transaction.setDescription(dto.getDescription().trim());
        transaction.setType(TransactionType.EXPENSE); // validated as Expense in the DTO
        transaction.setCategory(dto.getCategory().trim());
        transaction.setParty(Labels.clean(dto.getParty()));
        transaction.setPaymentMethod(Labels.clean(dto.getMethod()));
        transaction.setReferenceNo(Labels.clean(dto.getReference()));
        transaction.setAmount(dto.getAmount().setScale(2, RoundingMode.HALF_UP));
        transaction.setStatus(Labels.parse(TransactionStatus.class, dto.getStatus(), TransactionStatus.COMPLETED));
        transaction.setNotes(Labels.clean(dto.getNotes()));
    }

    private TransactionResponseDto mapToResponse(FinanceTransaction t) {
        return TransactionResponseDto.builder()
                .id(t.getId())
                .date(t.getTxnDate())
                .description(t.getDescription())
                .type(Labels.pretty(t.getType()))
                .category(t.getCategory())
                .party(t.getParty())
                .method(t.getPaymentMethod())
                .reference(t.getReferenceNo())
                .amount(t.getAmount())
                .status(Labels.pretty(t.getStatus()))
                .notes(t.getNotes())
                .build();
    }
}
