USE uiabd3_training;
CREATE TABLE access_stock(id INT PRIMARY KEY,qty INT NOT NULL) ENGINE=InnoDB;
INSERT INTO access_stock VALUES(1,10);
CREATE USER 'uiabd3_reader'@'localhost' IDENTIFIED BY RANDOM PASSWORD;
GRANT SELECT ON uiabd3_training.access_stock TO 'uiabd3_reader'@'localhost';
SHOW GRANTS FOR 'uiabd3_reader'@'localhost';
