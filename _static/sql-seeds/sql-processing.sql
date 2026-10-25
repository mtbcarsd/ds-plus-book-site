-- Демо-база для запуска запросов спринта «SQL. Обработка данных» в браузере (PGlite).
-- Схема повторяет telecom из тренажёра, данные СИНТЕТИЧЕСКИЕ: цифры не совпадут с курсом.
-- setseed делает данные одинаковыми при каждой загрузке страницы.

CREATE SCHEMA telecom;

CREATE TABLE telecom.tariffs (
    tariff_name           text PRIMARY KEY,
    messages_included     int,
    mb_per_month_included int,
    minutes_included      int,
    rub_monthly_fee       int,
    rub_per_gb            int,
    rub_per_message       int,
    rub_per_minute        int
);
INSERT INTO telecom.tariffs VALUES
    ('smart', 50, 15360, 500, 550, 200, 3, 3),
    ('ultra', 1000, 30720, 3000, 1950, 150, 1, 1);

CREATE TABLE telecom.users (
    user_id    int PRIMARY KEY,
    age        int,
    churn_date date,
    city       text,
    first_name text,
    last_name  text,
    reg_date   date,
    tariff     text REFERENCES telecom.tariffs (tariff_name)
);
CREATE TABLE telecom.calls    (id text PRIMARY KEY, call_date date, duration real, user_id int);
CREATE TABLE telecom.internet (id text PRIMARY KEY, mb_used real, session_date date, user_id int);
CREATE TABLE telecom.messages (id text PRIMARY KEY, message_date date, user_id int);

SELECT setseed(0.42);

INSERT INTO telecom.users
SELECT 1000 + i,
       18 + floor(random() * 57)::int,
       CASE WHEN random() < 0.15 THEN date '2018-12-31' - floor(random() * 60)::int END,
       (ARRAY['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск', 'Екатеринбург'])[1 + floor(random() * 5)::int],
       'Клиент', '№' || (1000 + i),
       date '2018-01-01' + floor(random() * 300)::int,
       CASE WHEN random() < 0.65 THEN 'smart' ELSE 'ultra' END
FROM generate_series(0, 39) AS i;

-- Месяцы активности каждого клиента: от регистрации до конца 2018 года
CREATE TEMP TABLE active_months AS
SELECT u.user_id, u.tariff, m::date AS month_start
FROM telecom.users AS u,
     generate_series(date_trunc('month', u.reg_date), date '2018-12-01', interval '1 month') AS m;

INSERT INTO telecom.calls
SELECT a.user_id || '_c' || row_number() OVER (),
       a.month_start + floor(random() * 28)::int,
       round((random() * 15)::numeric, 2),
       a.user_id
FROM active_months AS a,
     generate_series(1, 30 + (a.user_id * 7 + extract(month FROM a.month_start)::int * 13) % 60) AS g;

INSERT INTO telecom.internet
SELECT a.user_id || '_i' || row_number() OVER (),
       round((random() * 1000)::numeric, 2),
       a.month_start + floor(random() * 28)::int,
       a.user_id
FROM active_months AS a,
     generate_series(1, 20 + (a.user_id * 11 + extract(month FROM a.month_start)::int * 5) % 40) AS g;

INSERT INTO telecom.messages
SELECT a.user_id || '_m' || row_number() OVER (),
       a.month_start + floor(random() * 28)::int,
       a.user_id
FROM active_months AS a,
     generate_series(1, (a.user_id * 3 + extract(month FROM a.month_start)::int * 17) % 80) AS g
WHERE (a.user_id * 3 + extract(month FROM a.month_start)::int * 17) % 80 > 0;

DROP TABLE active_months;

-- ============================================================================
-- Схема rest_orders — сервис доставки ресторанного холдинга (теория и практика спринта).
-- Структура и типы как в курсе (order_dt — timestamp, даты статусов и клиентов — строки), данные СИНТЕТИЧЕСКИЕ.

CREATE SCHEMA rest_orders;

CREATE TABLE rest_orders.cities (city_id int PRIMARY KEY, city_name varchar(128));
INSERT INTO rest_orders.cities VALUES
    (0, 'нет данных'), (1, 'Владивосток'), (2, 'Мурино'), (3, 'Барнаул'), (4, 'Красногорск'),
    (5, 'Сочи'), (6, 'Саранск'), (7, 'Новосибирск'), (8, 'Калининград');  -- в Калининграде заказов нет

CREATE TABLE rest_orders.statuses (status_id int PRIMARY KEY, status_name varchar);
INSERT INTO rest_orders.statuses VALUES
    (1, 'создан'), (2, 'оплачен'), (3, 'подтверждён рестораном'), (4, 'приготовлен'), (5, 'передан курьеру'), (6, 'доставлен');

CREATE TABLE rest_orders.dishes (object_id bigint PRIMARY KEY, name varchar(128), spicy int, fish int, meat int);
INSERT INTO rest_orders.dishes
SELECT 1000 + i, n, s, f, m
FROM (VALUES
    (1, 'pishnie sirniki', 0, 0, 0), (2, 'letnij salat s fetoj i zelenju', 0, 0, 0),
    (3, 'salat iz redki s govjadinoj i karamelizovannim lukom', 0, 0, 1), (4, 'tom yam s krevetkami', 1, 1, 0),
    (5, 'pad thai s kuricej', 1, 0, 1), (6, 'losos na grile', 0, 1, 0), (7, 'chili con carne', 1, 0, 1),
    (8, 'borsch s pampushkami', 0, 0, 1), (9, 'sushi set filadelfija', 0, 1, 0), (10, 'shawarma ostraja', 1, 0, 1),
    (11, 'grecheskij salat', 0, 0, 0), (12, 'pelmeni domashnie', 0, 0, 1), (13, 'ramen s govjadinoj', 1, 0, 1),
    (14, 'treska v kljare', 0, 1, 0), (15, 'ovoschnoe ragu', 0, 0, 0), (16, 'kurinye krylyshki baffalo', 1, 0, 1),
    (17, 'paella s moreproduktami', 0, 1, 1), (18, 'kesadilja s govjadinoj', 1, 0, 1), (19, 'syrnyj sup', 0, 0, 0),
    (20, 'tartar iz tunca', 1, 1, 0), (21, 'limonad domashnij', 0, 0, 0), (22, 'chizkejk n''ju-jork', 0, 0, 0)
) AS d(i, n, s, f, m);

CREATE TABLE rest_orders.dishes_prices (
    dishes_id bigint REFERENCES rest_orders.dishes (object_id),
    price numeric(14, 2), date_begin timestamptz, date_end timestamptz
);

CREATE TABLE rest_orders.users (
    user_id uuid PRIMARY KEY, first_name varchar, last_name varchar, city_id int,
    gender varchar, birth_date varchar, registration_date varchar
);

CREATE TABLE rest_orders.orders (
    order_id bigint PRIMARY KEY, order_dt timestamp, user_id uuid, device_type varchar, city_id int,
    total_cost numeric(14, 2), discount numeric(14, 2), final_cost numeric(14, 2)
);

CREATE TABLE rest_orders.order_items (order_id bigint, item bigint, count bigint);
CREATE TABLE rest_orders.order_statuses (order_id bigint, status_id int, status_dt varchar);

SELECT setseed(0.31);

-- Прайсы по полугодиям; последняя цена действует до сих пор (date_end IS NULL)
INSERT INTO rest_orders.dishes_prices
SELECT d.object_id,
       round((150 + random() * 1500)::numeric, 2),
       p.b, p.e
FROM rest_orders.dishes AS d,
     (VALUES ('2019-12-31 17:00+03'::timestamptz, '2020-06-29 17:00+03'::timestamptz),
             ('2020-06-30 17:00+03', '2020-12-30 17:00+03'),
             ('2020-12-31 17:00+03', '2021-06-29 17:00+03'),
             ('2021-06-30 17:00+03', NULL)) AS p(b, e);
-- немного пропусков в цене — для уроков про NULL и COALESCE
UPDATE rest_orders.dishes_prices SET price = NULL WHERE dishes_id IN (1007, 1015) AND date_end IS NOT NULL;

INSERT INTO rest_orders.users
SELECT md5('user' || i)::uuid,
       (ARRAY['Гелла', 'Влада', 'Зара', 'Ассоль', 'Людмила', 'Вениамин', 'Марфа', 'Авдей', 'Долорес', 'Аделина', 'Грета', 'Наталия'])[1 + i % 12],
       (ARRAY['МУХАТАЕВА', 'ЦИРУНОВА', 'СЕБЕЙКИНА', 'КЕДРИНА', 'АДОА', 'БУРУМОВА', 'АЛЕКСЕЕВА', 'НЕУМОЙЧЕВА', 'ПЕРЕПАНОВА', 'ТОПЛОВА'])[1 + (i * 7) % 10],
       i % 8,
       CASE WHEN random() < 0.55 THEN 'female' ELSE 'male' END,
       (date '1950-01-01' + floor(random() * 20000)::int)::text,
       (date '2018-06-01' + floor(random() * 1100)::int)::text
FROM generate_series(1, 300) AS i;

INSERT INTO rest_orders.orders (order_id, order_dt, user_id, device_type, city_id, total_cost, discount)
SELECT i,
       date_trunc('second', timestamp '2019-12-25' + random() * interval '584 days'),
       md5('user' || (1 + floor(random() * 260)::int))::uuid,   -- 40 клиентов без заказов
       CASE WHEN random() < 0.6 THEN 'Mobile' ELSE 'Desktop' END,
       NULL,
       NULL,
       CASE WHEN random() < 0.2 THEN round((0.01 + random() * 0.14)::numeric, 2) END
FROM generate_series(1, 1500) AS i;
UPDATE rest_orders.orders AS o SET city_id = u.city_id FROM rest_orders.users AS u WHERE u.user_id = o.user_id;
-- у части заказов город доставки отличается от города регистрации
UPDATE rest_orders.orders SET city_id = (city_id + 1) % 8 WHERE order_id % 17 = 0;

INSERT INTO rest_orders.order_items
SELECT o.order_id, 1001 + (o.order_id * 7 + k * 5) % 22, 1 + (o.order_id + k) % 3
FROM rest_orders.orders AS o, generate_series(1, 1 + (o.order_id % 4)) AS k;

-- Стоимость заказа = сумма по актуальным на момент заказа ценам
UPDATE rest_orders.orders AS o
SET total_cost = s.total
FROM (SELECT oi.order_id, SUM(COALESCE(dp.price, 600) * oi.count) AS total
      FROM rest_orders.order_items AS oi
      JOIN rest_orders.orders AS o2 ON o2.order_id = oi.order_id
      JOIN rest_orders.dishes_prices AS dp
        ON dp.dishes_id = oi.item
       AND o2.order_dt::timestamptz >= dp.date_begin
       AND (dp.date_end IS NULL OR o2.order_dt::timestamptz < dp.date_end)
      GROUP BY oi.order_id) AS s
WHERE s.order_id = o.order_id;
UPDATE rest_orders.orders SET total_cost = 1500 WHERE total_cost IS NULL;
UPDATE rest_orders.orders SET final_cost = round(total_cost * (1 - COALESCE(discount, 0)), 2);

-- Статусы: все заказы созданы, ~8% так и не оплачены, дальше цепочка обрывается случайно
INSERT INTO rest_orders.order_statuses
SELECT o.order_id, s,
       to_char(o.order_dt::timestamp + (s - 1) * interval '11 minutes' + random() * interval '9 minutes', 'YYYY-MM-DD HH24:MI:SS')
FROM rest_orders.orders AS o,
     generate_series(1, 6) AS s
WHERE s = 1 OR (o.order_id % 13 <> 0 AND s <= 3 + o.order_id % 4);

-- ============================================================================
-- Схема library — СИНТЕТИЧЕСКАЯ библиотека для задач «на понимание» (не из курса).
CREATE SCHEMA library;

CREATE TABLE library.books (book_id int PRIMARY KEY, title varchar, author varchar, genre varchar, year int);
INSERT INTO library.books VALUES
    (1, 'Мастер и Маргарита', 'Булгаков', 'роман', 1967), (2, 'Собачье сердце', 'Булгаков', 'роман', 1987),
    (3, 'Преступление и наказание', 'Достоевский', 'роман', 1866), (4, 'Идиот', 'Достоевский', 'роман', 1869),
    (5, 'Война и мир', 'Толстой', 'роман', 1869), (6, 'Анна Каренина', 'Толстой', 'роман', 1877),
    (7, 'Отцы и дети', 'Тургенев', 'роман', 1862), (8, 'Мёртвые души', 'Гоголь', 'роман', 1842),
    (9, 'Герой нашего времени', 'Лермонтов', 'роман', 1840), (10, 'Обломов', 'Гончаров', 'роман', 1859),
    (11, 'Убийство в «Восточном экспрессе»', 'Кристи', 'детектив', 1934), (12, 'Десять негритят', 'Кристи', 'детектив', 1939),
    (13, 'Собака Баскервилей', 'Конан Дойл', 'детектив', 1902), (14, 'Этюд в багровых тонах', 'Конан Дойл', 'детектив', 1887),
    (15, 'Азазель', 'Акунин', 'детектив', 1998), (16, 'Турецкий гамбит', 'Акунин', 'детектив', 1998),
    (17, 'Пикник на обочине', 'Стругацкие', 'фантастика', 1972), (18, 'Трудно быть богом', 'Стругацкие', 'фантастика', 1964),
    (19, 'Понедельник начинается в субботу', 'Стругацкие', 'фантастика', 1965), (20, 'Солярис', 'Лем', 'фантастика', 1961),
    (21, 'Дюна', 'Херберт', 'фантастика', 1965), (22, 'Основание', 'Азимов', 'фантастика', 1951),
    (23, '451 градус по Фаренгейту', 'Брэдбери', 'фантастика', 1953), (24, 'Марсианские хроники', 'Брэдбери', 'фантастика', 1950),
    (25, 'Евгений Онегин', 'Пушкин', 'поэзия', 1833), (26, 'Мцыри', 'Лермонтов', 'поэзия', 1840),
    (27, 'Двенадцать', 'Блок', 'поэзия', 1918), (28, 'Облако в штанах', 'Маяковский', 'поэзия', 1915),
    (29, 'Sapiens', 'Харари', 'нон-фикшн', 2011), (30, 'Думай медленно… решай быстро', 'Канеман', 'нон-фикшн', 2011),
    (31, 'Краткая история времени', 'Хокинг', 'нон-фикшн', 1988), (32, 'Эгоистичный ген', 'Докинз', 'нон-фикшн', 1976),
    (33, 'Ружья, микробы и сталь', 'Даймонд', 'нон-фикшн', 1997), (34, 'Как лгать при помощи статистики', 'Хафф', 'нон-фикшн', 1954),
    (35, 'Голая статистика', 'Уилан', 'нон-фикшн', 2013),
    -- эти книги пока никто не брал
    (36, 'Улисс', 'Джойс', 'роман', 1922), (37, 'Поминки по Финнегану', 'Джойс', 'роман', 1939),
    (38, 'Лунный камень', 'Коллинз', 'детектив', 1868), (39, 'Опус магнум', 'Неизвестный', 'поэзия', NULL),
    (40, 'Введение в теорию вероятностей', 'Феллер', 'нон-фикшн', 1950);

CREATE TABLE library.readers (reader_id int PRIMARY KEY, name varchar, city varchar, registered_at date);

CREATE TABLE library.loans (
    loan_id int PRIMARY KEY, book_id int, reader_id int,
    loan_date date, due_date date, return_date date   -- return_date IS NULL — книга ещё на руках
);

SELECT setseed(0.58);

INSERT INTO library.readers
SELECT i,
       (ARRAY['Анна', 'Борис', 'Вера', 'Глеб', 'Дарья', 'Егор', 'Жанна', 'Илья', 'Ксения', 'Лев'])[1 + i % 10]
           || ' ' || (ARRAY['К.', 'М.', 'С.', 'Т.', 'Р.', 'П.'])[1 + (i * 7) % 6],
       (ARRAY['Москва', 'Казань', 'Пермь'])[1 + floor(random() * 3)::int],
       date '2022-01-01' + floor(random() * 700)::int
FROM generate_series(1, 60) AS i;

INSERT INTO library.loans
SELECT i, b, r, ld, ld + 21,
       CASE WHEN random() < 0.1 THEN NULL ELSE ld + floor(random() * 36)::int END
FROM (
    SELECT i,
           1 + floor(power(random(), 1.6) * 35)::int AS b,      -- популярные книги берут чаще
           1 + floor(random() * 60)::int AS r,
           date '2024-01-01' + floor(random() * 345)::int AS ld
    FROM generate_series(1, 500) AS i
) AS g;
