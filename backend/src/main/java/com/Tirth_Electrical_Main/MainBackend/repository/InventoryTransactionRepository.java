package com.Tirth_Electrical_Main.MainBackend.repository;

import com.Tirth_Electrical_Main.MainBackend.entity.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InventoryTransactionRepository
        extends JpaRepository<InventoryTransaction, Long> {

    List<InventoryTransaction> findByInventoryId(Long inventoryId);
}