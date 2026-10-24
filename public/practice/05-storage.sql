USE uiabd3_training;
CREATE TABLE storage_sample(id INT PRIMARY KEY,title VARCHAR(100)) ENGINE=InnoDB;
INSERT INTO storage_sample VALUES(1,'Заявка'),(2,'Ремонт');
SELECT DATABASE(),SCHEMA(),@@datadir,@@innodb_file_per_table;
SELECT table_name,engine,data_length,index_length,
 data_length+index_length AS estimated_bytes
FROM information_schema.tables
WHERE table_schema=DATABASE() AND table_name='storage_sample';
