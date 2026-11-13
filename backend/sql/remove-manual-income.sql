-- =====================================================================
-- One-time cleanup: remove manually entered MONEY IN from the finance ledger
-- =====================================================================
-- Money in now comes only from paid invoices. Older versions let people type
-- income rows into finance_transaction; the app now ignores them, but they are
-- still in the table. Delete them when you are sure the same money is already
-- covered by a paid invoice:
--   psql -U postgres -d MainDatabase -f remove-manual-income.sql

-- Look first:
SELECT id, txn_date, description, amount FROM finance_transaction WHERE type = 'INCOME' ORDER BY txn_date;

-- Then delete (uncomment):
-- DELETE FROM finance_transaction WHERE type = 'INCOME';
