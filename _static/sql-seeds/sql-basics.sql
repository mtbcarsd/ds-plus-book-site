-- Демо-база для запуска запросов спринта «Основы SQL. Извлечение данных» в браузере (PGlite).
-- movies: строки, которые встречаются в примерах уроков (в курсе таблица больше — 1816 строк),
--         плюс несколько известных сериалов; у них id и google_users условные.
-- songs:  СИНТЕТИЧЕСКИЕ данные в схеме домашнего задания — цифры не совпадут с курсом.

CREATE TABLE movies (
    id           integer PRIMARY KEY,
    title        varchar,
    ru_title     varchar,
    episodes     integer,
    year         integer,
    channel      varchar,
    technique    varchar,
    rating       numeric,
    google_users numeric
);

INSERT INTO movies VALUES
    (1, '2 Stupid Dogs', 'Два глупых пса', 26, 1993, 'TBS', 'Traditional', 7.2, 91.3),
    (2, '3-2-1 Penguins!', '3-2-1 Пингвины!', 27, 2000, 'Direct to video', 'CGI', 6.5, 91.4),
    (3, '3-South', 'Неизвестно', 13, 2002, 'MTV', 'Traditional', 8.0, 87.16),
    (4, '3Below: Tales of Arcadia', 'Трое с небес: Истории Аркадии', 28, 2018, 'Netflix', 'CGI', 7.6, 77.2),
    (5, '3rd & Bird', 'Неизвестно', 51, 2008, 'Playhouse Disney', 'Flash', 7.8, 92.6),
    (6, 'The 7D', '7 гномов', 44, 2014, 'Disney XD', 'Traditional', 5.7, 85.41),
    (7, '12 oz. Mouse', 'Пол-литровая мышь', 31, 2005, 'Adult Swim', 'Flash', 6.5, 72.28),
    (8, 'The 13 Ghosts of Scooby-Doo', '13 привидений Скуби-Ду', 13, 1985, 'ABC', 'Traditional', 7.3, 91.62),
    (9, '101 Dalmatians: The Series', '101 далматинец', 65, 1997, 'ABC', 'Traditional', 6.1, 83.14),
    (10, 'Aaahh!!! Real Monsters', 'ААА!!! Настоящие монстры', 52, 1994, 'Nickelodeon', 'Traditional', 7.2, 86.56),
    (22, 'Adventure Time', 'Время приключений', 283, 2010, 'Cartoon Network', 'Traditional', 8.6, 95.7),
    (23, 'Adventure Time: Distant Lands', 'Время приключений: Далёкие земли', 4, 2020, 'HBO Max', 'Traditional', 8.7, 82.3),
    (24, 'Adventure Time: Fionna and Cake', 'Время приключений: Фиона и Кейк', 2, 2023, 'Max', 'Traditional', 8.9, 88.44),
    (29, 'The Adventures of Gulliver', 'Приключения Гулливера', 17, 1968, 'ABC', 'Traditional', 7.0, 89.67),
    (47, 'Alabama Jackson', 'Неизвестно', 7, 2022, 'YouTube', 'Stop-motion', 8.4, 89.84),
    (67, 'Amphibia', 'Амфибия', 58, 2019, 'Disney Channel', 'Traditional', 8.3, 89.2),
    (69, 'Animals', 'Звери.', 30, 2016, 'HBO', 'Traditional', 7.3, 84.51),
    (75, 'Aqua Teen Hunger Force', 'Команда Фастфуд', 139, 2000, 'Adult Swim', 'Flash', 7.7, 90.71),
    (76, 'Aquadonk Side Pieces', 'Неизвестно', 10, 2022, 'YouTube', 'Flash', 8.1, 92.13),
    (80, 'Archer', 'Арчер', 145, 2009, 'FX', 'Flash', 8.6, 91.59),
    (84, 'Ask the StoryBots', 'Спроси у Сториботов', 22, 2016, 'Netflix', 'CGI', 8.5, 83.13),
    (93, 'Avatar: The Last Airbender', 'Аватар: Легенда об Аанге', 61, 2005, 'Nickelodeon', 'Traditional', 9.3, 96.64),
    (95, 'The Avengers: Earth''s Mightiest Heroes', 'Мстители: Величайшие герои Земли', 52, 2010, 'Disney XD', 'Traditional', 8.3, 80.49),
    (99, 'Action Man (2000)', 'Экшн Мен', 26, 2000, 'Fox Kids', 'CGI', 6.4, 93.32),
    (122, 'As Told by Ginger', 'Как говорит Джинджер', 52, 2000, 'Nickelodeon', 'Traditional', 6.9, 92.85),
    (125, 'Baby Blues', 'Блюз малышки', 13, 2000, 'The WB', 'Traditional', 7.0, 72.36),
    (145, 'Baymax!', 'Бэймакс!', 6, 2022, 'Disney+', 'CGI', 7.2, 79.25),
    (157, 'Between the Lions', 'Неизвестно', 130, 2000, 'PBS Kids', 'Traditional', 7.1, 95.18),
    (180, 'The Bob Clampett Show', 'Неизвестно', 26, 2000, 'Cartoon Network', 'Traditional', 8.1, 84.41),
    (190, 'Braingames', 'Игры разума', 6, 1983, 'HBO', 'Traditional', 8.5, 98.39),
    (193, 'The Brak Show', 'Шоу Брака', 28, 2000, 'Adult Swim', 'Flash', 7.1, 87.13),
    (207, 'The Bugs Bunny Show', 'Шоу Багса Банни', 684, 1960, 'ABC', 'Traditional', 8.6, 95.8),
    (213, 'Buzz Lightyear of Star Command', 'Приключения Базза Лайтера из звездной команды', 62, 2000, 'UPNABC', 'Traditional', 6.7, 95.48),
    (261, 'Calvin and the Colonel', 'Неизвестно', 26, 1961, 'ABC', 'Traditional', 6.6, 88.77),
    (276, 'Cars on the Road', 'Тачки на дороге', 9, 2022, 'Disney+', 'CGI', 6.9, 72.56),
    (288, 'Cattanooga Cats', 'Неизвестно', 17, 1969, 'ABC', 'Traditional', 7.2, 95.28),
    (315, 'Clerks: The Animated Series', 'Клерки', 6, 2000, 'ABC', 'Traditional', 7.4, 91.84),
    (360, 'Chip ''n'' Dale: Park Life', 'Чип и Дейл', 24, 2021, 'Disney+', 'Flash', 6.0, 62.31),
    (449, 'Dug Days', 'Будни Дага', 5, 2021, 'Disney+', 'CGI', 8.0, 82.17),
    (497, 'Esme & Roy', 'Эсме и Рой', 52, 2018, 'HBO', 'Traditional', 7.6, 70.48),
    (519, 'Fantastic Four (1967)', 'Фантастическая четвёрка', 20, 1967, 'ABC', 'Traditional', 6.6, 75.54),
    (523, 'Fantastic Voyage', 'Фантастическое путешествие', 17, 1968, 'ABC', 'Traditional', 6.8, 86.6),
    (546, 'The Flintstones', 'Флинтстоуны', 166, 1960, 'ABC', 'Traditional', 7.5, 90.55),
    (550, 'Forky Asks a Question', 'Вилкинс задаёт вопросы', 10, 2019, 'Disney+', 'CGI', 6.6, 84.3),
    (609, 'George of the Jungle', 'Джордж из джунглей', 17, 1967, 'ABC', 'Traditional', 5.5, 79.46),
    (661, 'Happily Ever After: Fairy Tales for Every Child', 'Сказочные истории для всех детей', 39, 1995, 'HBO', 'Traditional', 6.8, 84.83),
    (674, 'HBO Storybook Musicals', 'Неизвестно', 18, 1987, 'HBO', 'Traditional', 8.5, 95.43),
    (711, 'Hoppity Hooper', 'Неизвестно', 104, 1964, 'ABC', 'Traditional', 7.8, 94.25),
    (714, 'Hot Wheels', 'Hot Wheels. За гранью воображения', 17, 1969, 'ABC', 'Traditional', 7.4, 84.23),
    (827, 'The Kids from Room 402', 'Детки из класса 402', 52, 2000, 'Fox Family', 'Traditional', 8.2, 95.22),
    (1010, 'Monsters at Work', 'Монстры за работой', 10, 2021, 'Disney+', 'CGI', 7.0, 72.51),
    (1011, 'Monsters vs. Aliens', 'Монстры против пришельцев', 26, 2013, 'Nickelodeon', 'CGI', 6.4, 71.52),
    (1402, 'Spy Groove', 'Неизвестно', 16, 2000, 'MTV', 'Traditional', 8.3, 96.7),
    (1816, 'The Zula Patrol', 'Неизвестно', 52, 2005, 'PBS Kids', 'CGI', 6.9, 93.27),
    -- встречаются в уроках без id и google_users — здесь эти значения условные
    (1900, 'Ada Twist, Scientist', 'Ада Твист, учёный', 41, 2021, 'Netflix', 'CGI', 6.5, 81.2),
    (1901, 'The Adventures of Jimmy Neutron, Boy Genius', 'Приключения Джимми Нейтрона, мальчика-гения', 61, 2002, 'Nickelodeon', 'CGI', 6.7, 88.4),
    (1902, 'The Adventures of Puss in Boots', 'Приключения Кота в сапогах', 78, 2015, 'Netflix', 'CGI', 6.5, 85.1),
    (1903, 'Agent Elvis', 'Агент Элвис', 10, 2023, 'Netflix', 'Traditional', 6.8, 74.6),
    (1904, 'All Grown Up!', 'Детки подросли', 55, 2003, 'Nickelodeon', 'Traditional', 5.5, 83.9),
    (1905, 'All Hail King Julien', 'Да здравствует король Джулиан', 78, 2014, 'Netflix', 'CGI', 7.1, 86.7),
    (1906, 'The Angry Beavers', 'Крутые бобры', 62, 1997, 'Nickelodeon', 'Traditional', 7.2, 92.3),
    (1907, 'Big Mouth', 'Большой рот', 61, 2017, 'Netflix', 'Traditional', 7.8, 79.8),
    (1908, 'BoJack Horseman', 'Конь БоДжек', 77, 2014, 'Netflix', 'Flash', 8.8, 95.1),
    (1909, 'Castlevania', 'Кастлвания', 32, 2017, 'Netflix', 'Traditional', 8.3, 92.6),
    (1910, 'The Cuphead Show!', 'Шоу Чашека!', 36, 2022, 'Netflix', 'Traditional', 7.4, 88.9);

CREATE TABLE songs (
    id       integer PRIMARY KEY,
    user_id  integer,
    track    varchar,
    artist   varchar,
    genre    varchar,
    city     varchar,
    day      varchar,
    duration integer,
    listen   numeric
);

SELECT setseed(0.17);

INSERT INTO songs
SELECT i,
       1000 + floor(random() * 150)::int,
       'Трек ' || (1 + (i * 7) % 60),
       CASE WHEN (i * 7) % 60 % 9 = 0 THEN 'неизвестный исполнитель'
            ELSE 'Исполнитель ' || chr(65 + ((i * 7) % 60) % 14) END,
       (ARRAY['pop', 'rock', 'jazz', 'dance', 'electronic', 'hiphop', 'classical', 'alternative'])[1 + ((i * 7) % 60) % 8],
       CASE WHEN random() < 0.68 THEN 'Москва' ELSE 'Санкт-Петербург' END,
       (ARRAY['понедельник', 'среда', 'пятница'])[1 + floor(random() * 3)::int],
       10 + floor(random() * 390)::int,
       CASE WHEN random() < 0.05 THEN 0 ELSE round(random()::numeric, 2) END
FROM generate_series(1, 600) AS i;
