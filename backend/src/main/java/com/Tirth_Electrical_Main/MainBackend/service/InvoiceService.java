package com.Tirth_Electrical_Main.MainBackend.service;

import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceResponseDto;

import java.time.LocalDate;
import java.util.List;

public interface InvoiceService {

    List<InvoiceResponseDto> getAllInvoices();

    InvoiceResponseDto getInvoiceById(Long id);

    /** The number the next created invoice will most likely get (INV-0019). */
    String getNextCode();

    InvoiceResponseDto createInvoice(InvoiceRequestDto dto);

    InvoiceResponseDto updateInvoice(Long id, InvoiceRequestDto dto);

    /** Marking PAID records the payment date (today unless given); UNPAID clears it. */
    InvoiceResponseDto updateStatus(Long id, String status, LocalDate paidDate);

    void deleteInvoice(Long id);
}
