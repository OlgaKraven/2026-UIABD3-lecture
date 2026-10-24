# Источники курса

Материалы относятся только к 3 курсу и 6 семестру. Семь тем сохранены по исходному составу проекта; снимок исходного содержания — `authoring/source-baseline.json`. Формальное соответствие часам и компетенциям не заявляется без отдельной проверки учебной программы.

Библиография сохранена из исходных лекций: Волк, Осеев, Черепанов (2025); Маркин, части 1–2 (2026); Кузьменко (2024); Евстифеева (2025). Полные описания и ссылки IPR находятся в двух общих слайдах каждой лекции.

Техническая платформа — MySQL 8.4; практическое выполнение проверено на 8.4.13 для Windows x64.

- [Инициализация данных](https://dev.mysql.com/doc/refman/8.4/en/data-directory-initialization.html).
- [Служба Windows](https://dev.mysql.com/doc/refman/8.4/en/windows-start-service.html).
- [Параметры сервера и validate-config](https://dev.mysql.com/doc/refman/8.4/en/server-options.html).
- [Подключения](https://dev.mysql.com/doc/refman/8.4/en/connecting.html).
- [Имена учётных записей](https://dev.mysql.com/doc/refman/8.4/en/account-names.html), [GRANT](https://dev.mysql.com/doc/refman/8.4/en/grant.html), [REVOKE](https://dev.mysql.com/doc/refman/8.4/en/revoke.html).
- [Кодировки](https://dev.mysql.com/doc/refman/8.4/en/charset-applications.html).
- [Блокировки InnoDB](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking.html), [обработка ошибок](https://dev.mysql.com/doc/refman/8.4/en/innodb-error-handling.html).
- [Связи ожиданий](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-lock-waits-table.html).
- [KILL](https://dev.mysql.com/doc/refman/8.4/en/kill.html), [SLEEP](https://dev.mysql.com/doc/refman/8.4/en/miscellaneous-functions.html#function_sleep).
- [Журнал ошибок](https://dev.mysql.com/doc/refman/8.4/en/error-log.html).

Учебные числа и синтетические записи журналов обозначены в материале. Рабочая схема блокировок ограничена точным поиском двух PK и явными транзакциями; выбор жертвы в ней не предсказывает решение настоящего InnoDB.

[Материалы 3 курса](https://disk.yandex.ru/d/dUq9czY8Gd0FRg). Фирменные логотипы сохранены отдельными ресурсами. Новый маскот 3 курса: `public/brand/mascot/uiabd3-installation.png`; он подключает учебный сервер и работает с конфигурацией.
