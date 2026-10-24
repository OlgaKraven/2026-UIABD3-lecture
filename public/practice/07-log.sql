SELECT VERSION(),@@port,UTC_TIMESTAMP(),NOW();
SHOW VARIABLES WHERE Variable_name IN
 ('log_error','log_error_services','log_error_verbosity','log_timestamps');
