package com.Tirth_Electrical_Main.MainBackend.repository;

import com.Tirth_Electrical_Main.MainBackend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findAllByOrderByIdDesc();

    /** Highest numeric suffix among existing codes (INV-0018 -> 18), or 0 when there are none. */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM '[0-9]+$') AS INTEGER)), 0) FROM invoice",
            nativeQuery = true)
    int findMaxCodeNumber();
}
