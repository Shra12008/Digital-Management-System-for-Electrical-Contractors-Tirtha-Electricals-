package com.Tirth_Electrical_Main.MainBackend.repository;

import com.Tirth_Electrical_Main.MainBackend.entity.FinanceTransaction;
import com.Tirth_Electrical_Main.MainBackend.entity.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long> {

    List<FinanceTransaction> findAllByOrderByTxnDateDescIdDesc();

    /** The manual ledger: money out only. Money in is derived from invoices. */
    List<FinanceTransaction> findAllByTypeOrderByTxnDateDescIdDesc(TransactionType type);
}
