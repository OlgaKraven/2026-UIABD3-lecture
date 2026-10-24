USE uiabd3_training;
CREATE TABLE lock_stock(id INT PRIMARY KEY,qty INT NOT NULL) ENGINE=InnoDB;
INSERT INTO lock_stock VALUES(1,10),(2,20);
SELECT CONNECTION_ID(),@@transaction_isolation;
SELECT * FROM lock_stock ORDER BY id;
