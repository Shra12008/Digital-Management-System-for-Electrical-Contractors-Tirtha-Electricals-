package com.Tirth_Electrical_Main.MainBackend.controller;

import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceResponseDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceStatusRequestDto;
import com.Tirth_Electrical_Main.MainBackend.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Billing & Invoicing. Role rules live in SecurityConfig:
 * ADMIN/ACCOUNTANT can read and write, CLIENT can only read.
 */
@RestController
@RequestMapping("/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public List<InvoiceResponseDto> getAllInvoices() {
        return invoiceService.getAllInvoices();
    }

    @GetMapping("/next-code")
    public Map<String, String> getNextCode() {
        return Map.of("code", invoiceService.getNextCode());
    }

    @GetMapping("/{id}")
    public InvoiceResponseDto getInvoiceById(@PathVariable Long id) {
        return invoiceService.getInvoiceById(id);
    }

    @PostMapping
    public ResponseEntity<InvoiceResponseDto> createInvoice(@Valid @RequestBody InvoiceRequestDto dto) {
        return ResponseEntity.status(201).body(invoiceService.createInvoice(dto));
    }

    @PutMapping("/{id}")
    public InvoiceResponseDto updateInvoice(@PathVariable Long id,
                                            @Valid @RequestBody InvoiceRequestDto dto) {
        return invoiceService.updateInvoice(id, dto);
    }

    @PatchMapping("/{id}/status")
    public InvoiceResponseDto updateStatus(@PathVariable Long id,
                                           @Valid @RequestBody InvoiceStatusRequestDto dto) {
        return invoiceService.updateStatus(id, dto.getStatus(), dto.getPaidDate());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
