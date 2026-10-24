SET NAMES utf8mb4;
SELECT 'Я🙂' AS sample,CHAR_LENGTH('Я🙂') AS characters,
 OCTET_LENGTH('Я🙂') AS bytes;
SELECT _utf8mb4'A' COLLATE utf8mb4_0900_ai_ci = _utf8mb4'a' AS ci_equal,
 _utf8mb4'A' COLLATE utf8mb4_0900_as_cs = _utf8mb4'a' AS cs_equal;
SELECT _utf8mb4'e' COLLATE utf8mb4_0900_ai_ci = _utf8mb4'é' AS ai_equal,
 _utf8mb4'e' COLLATE utf8mb4_0900_as_cs = _utf8mb4'é' AS as_equal;
