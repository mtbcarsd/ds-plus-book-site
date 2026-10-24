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
