package com.Tirth_Electrical_Main.MainBackend.service.impl;

import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceItemDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceRequestDto;
import com.Tirth_Electrical_Main.MainBackend.dtos.invoice.InvoiceResponseDto;
import com.Tirth_Electrical_Main.MainBackend.entity.Invoice;
import com.Tirth_Electrical_Main.MainBackend.entity.InvoiceItem;
import com.Tirth_Electrical_Main.MainBackend.entity.InvoiceStatus;
import com.Tirth_Electrical_Main.MainBackend.exception.ResourceNotFoundException;
import com.Tirth_Electrical_Main.MainBackend.repository.InvoiceRepository;
import com.Tirth_Electrical_Main.MainBackend.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final int CODE_RETRIES = 3;

    private final InvoiceRepository invoiceRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponseDto> getAllInvoices() {
        return invoiceRepository.findAllByOrderByIdDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponseDto getInvoiceById(Long id) {
        return mapToResponse(findOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public String getNextCode() {
        return formatCode(invoiceRepository.findMaxCodeNumber() + 1);
    }

    /**
     * Deliberately NOT @Transactional: if two people create an invoice at the
     * same instant they can compute the same next number, and the unique
     * constraint on invoice.code rejects the second insert. Each attempt below
     * is its own short transaction, so a rejected insert can simply be retried
     * with a fresh number instead of poisoning one big transaction.
     */
    @Override
    public InvoiceResponseDto createInvoice(InvoiceRequestDto dto) {
        validateDates(dto);

        for (int attempt = 1; ; attempt++) {
            Invoice invoice = Invoice.builder().build();
            apply(invoice, dto);
            invoice.setCode(formatCode(invoiceRepository.findMaxCodeNumber() + 1));

            try {
                return mapToResponse(invoiceRepository.save(invoice));
            } catch (DataIntegrityViolationException ex) {
                if (attempt >= CODE_RETRIES) {
                    throw new IllegalArgumentException(
                            "Could not generate a unique invoice number. Please try again.");
                }
            }
        }
    }

    @Override
    @Transactional
    public InvoiceResponseDto updateInvoice(Long id, InvoiceRequestDto dto) {
        validateDates(dto);

        Invoice invoice = findOrThrow(id);
        apply(invoice, dto);

        return mapToResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public InvoiceResponseDto updateStatus(Long id, String status, LocalDate paidDate) {
        Invoice invoice = findOrThrow(id);
        applyPayment(invoice, Labels.parse(InvoiceStatus.class, status, InvoiceStatus.UNPAID), paidDate);

        return mapToResponse(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public void deleteInvoice(Long id) {
        Invoice invoice = findOrThrow(id);
        invoiceRepository.delete(invoice);
    }

    // ------------------------------------------------------------------

    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice Not Found"));
    }

    private void validateDates(InvoiceRequestDto dto) {
        if (dto.getDueDate().isBefore(dto.getIssueDate())) {
            throw new IllegalArgumentException("Due date cannot be before the issue date.");
        }
    }

    /** Copies the request onto the entity and recalculates the grand total. */
    private void apply(Invoice invoice, InvoiceRequestDto dto) {
        invoice.setClient(dto.getClient().trim());
        invoice.setTitle(dto.getTitle().trim());
        invoice.setClientAddress(Labels.clean(dto.getClientAddress()));
        invoice.setClientPhone(Labels.clean(dto.getClientPhone()));
        invoice.setClientEmail(Labels.clean(dto.getClientEmail()));
        invoice.setClientGstin(Labels.clean(dto.getClientGstin()));
        invoice.setIssueDate(dto.getIssueDate());
        invoice.setDueDate(dto.getDueDate());
        applyPayment(invoice, Labels.parse(InvoiceStatus.class, dto.getStatus(), InvoiceStatus.UNPAID), dto.getPaidDate());
        invoice.setNotes(Labels.clean(dto.getNotes()));

        invoice.getItems().clear();
        int line = 1;
        BigDecimal subtotal = BigDecimal.ZERO;
        for (InvoiceItemDto item : dto.getItems()) {
            invoice.addItem(InvoiceItem.builder()
                    .lineNo(line++)
                    .description(item.getDescription().trim())
                    .qty(item.getQty().setScale(2, RoundingMode.HALF_UP))
                    .rate(item.getRate().setScale(2, RoundingMode.HALF_UP))
                    .build());
            subtotal = subtotal.add(item.getQty().multiply(item.getRate()));
        }
        subtotal = subtotal.setScale(2, RoundingMode.HALF_UP);

        BigDecimal gstRate = dto.getGstRate() == null ? BigDecimal.ZERO : dto.getGstRate();
        BigDecimal discount = dto.getDiscount() == null ? BigDecimal.ZERO : dto.getDiscount();
        // A discount can never be larger than the work billed.
        discount = discount.min(subtotal).setScale(2, RoundingMode.HALF_UP);

        BigDecimal taxable = subtotal.subtract(discount);
        BigDecimal gst = taxable.multiply(gstRate).divide(HUNDRED, 2, RoundingMode.HALF_UP);

        invoice.setGstRate(gstRate.setScale(2, RoundingMode.HALF_UP));
        invoice.setDiscount(discount);
        invoice.setAmount(taxable.add(gst).setScale(2, RoundingMode.HALF_UP));
    }

    /**
     * Keeps status and paidDate consistent. The finance module treats a PAID
     * invoice as money received on paidDate, so a paid invoice must always
     * carry a sensible date, and an unpaid one must never have one.
     */
    private void applyPayment(Invoice invoice, InvoiceStatus status, LocalDate requestedPaidDate) {
        invoice.setStatus(status);

        if (status != InvoiceStatus.PAID) {
            invoice.setPaidDate(null);
            return;
        }

        LocalDate paid = requestedPaidDate != null
                ? requestedPaidDate
                : (invoice.getPaidDate() != null ? invoice.getPaidDate() : LocalDate.now());

        if (paid.isBefore(invoice.getIssueDate())) {
            throw new IllegalArgumentException("Payment date cannot be before the issue date.");
        }
        if (paid.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Payment date cannot be in the future.");
        }
        invoice.setPaidDate(paid);
    }

    private String formatCode(int number) {
        return String.format("INV-%04d", number);
    }

    private InvoiceResponseDto mapToResponse(Invoice invoice) {
        List<InvoiceItemDto> items = invoice.getItems().stream()
                .map(i -> InvoiceItemDto.builder()
                        .description(i.getDescription())
                        .qty(i.getQty())
                        .rate(i.getRate())
                        .build())
                .collect(Collectors.toList());

        return InvoiceResponseDto.builder()
                .id(invoice.getId())
                .code(invoice.getCode())
                .title(invoice.getTitle())
                .client(invoice.getClient())
                .clientAddress(invoice.getClientAddress())
                .clientPhone(invoice.getClientPhone())
                .clientEmail(invoice.getClientEmail())
                .clientGstin(invoice.getClientGstin())
                .issueDate(invoice.getIssueDate())
                .dueDate(invoice.getDueDate())
                .paidDate(invoice.getPaidDate())
                .status(Labels.pretty(invoice.getStatus()))
                .gstRate(invoice.getGstRate())
                .discount(invoice.getDiscount())
                .amount(invoice.getAmount())
                .notes(invoice.getNotes())
                .items(items)
                .createdAt(invoice.getCreatedAt())
                .build();
    }
}
