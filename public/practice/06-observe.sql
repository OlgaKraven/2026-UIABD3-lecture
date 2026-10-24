SELECT r.PROCESSLIST_ID AS waiting_connection,
 b.PROCESSLIST_ID AS blocking_connection,
 w.REQUESTING_ENGINE_TRANSACTION_ID AS waiting_transaction,
 w.BLOCKING_ENGINE_TRANSACTION_ID AS blocking_transaction
FROM performance_schema.data_lock_waits w
JOIN performance_schema.threads r ON r.THREAD_ID=w.REQUESTING_THREAD_ID
JOIN performance_schema.threads b ON b.THREAD_ID=w.BLOCKING_THREAD_ID;
