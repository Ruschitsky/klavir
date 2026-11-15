import { pairWeakness, rankWeak, samples, weakness, meanLatency, type KeyMap } from "@/lib/typing/analysis";
import { accepts, resolveChar, type LayoutId } from "@/lib/typing/keys";

export type Mode = "basics" | "smart" | "check" | "words" | "flow" | "tempo" | "stats";

export type Lesson = {
  id: string;
  title: { ru: string; en: string };
  blurb: { ru: string; en: string };
  allow: string;
  fresh: string;
  focus?: string;
  patterns: string[];
  fixed?: string;
  len: number;
};

const uniq = (text: string) => [...new Set(text.trim().split(/\s+/).filter(Boolean))];

export const RU_WORDS = uniq(`
вода вал вол лад дол ода фал овал жало лава два повар пора пара двор жар правда провод дрова
право порода опора рука река куда уже кафе дело вера лев урок кедр цена сила поле окно нога
море горе кора дача чаша щека ноша шар шаг шарф нож нора гора сок лес вес село тело лето
место слово стол стул книга город работа человек время жизнь глаз дом мир путь ночь день год
земля лицо конец вопрос страна свет хлеб сыр суп рис мясо рыба молоко яблоко дерево цветок
трава лист птица кот пес озеро небо солнце луна звезда утро вечер сон дверь комната кухня
сад двор улица машина поезд мост парк школа учитель ученик тетрадь ручка карандаш бумага
письмо буква цифра число ответ мысль идея час минута неделя месяц весна осень зима погода
дождь снег тепло холод ветер облако туман гроза радуга семья мама папа брат сестра сын дочь
друг любовь радость смех тишина музыка песня голос звук тень цвет белый черный красный синий
зеленый желтый серый большой маленький новый старый добрый тихий быстрый медленный верный
простой сложный легкий тяжелый теплый холодный чистый ясный ровный точный ещё ёлка моё её
всё орёл полёт мёд лёд берёза жёлтый зелёный даёт тёплый ёж заход ключ стол чай двор пальцы
экран буква строка ровно спокойно начало конец фраза текст темп урок клавиатура макбук
работать читать писать думать говорить слушать смотреть видеть знать хотеть могу должен нужно можно
после перед между через около всегда никогда иногда сегодня завтра вчера сейчас потом тогда здесь
там везде где когда почему потому очень совсем почти уже ещё тоже также только даже будто словно
вместе рядом далеко близко высоко низко глубоко широко узкий длинный короткий светлый тёмный
мягкий твёрдый острый гладкий свежий горячий сладкий горький кислый солёный вкусный красивый
умный весёлый грустный сильный слабый богатый бедный пустой полный открытый закрытый свободный
занятый готовый главный первый второй третий последний каждый любой другой такой этот тот наш ваш
дорога путешествие вокзал билет чемодан карта маршрут остановка площадь проспект набережная
магазин рынок аптека больница библиотека музей театр кино концерт выставка праздник подарок
завтрак обед ужин чайник чашка тарелка ложка вилка нож кастрюля плита холодильник стол стул
диван кровать шкаф окно стена пол потолок лестница балкон крыша подъезд этаж квартира дом
компьютер телефон программа файл папка письмо сообщение пароль сеть сайт ссылка кнопка мышь
пальцы ладонь запястье плечо спина осанка дыхание ритм точность скорость практика привычка
вопрос ответ причина следствие пример правило закон порядок система метод способ результат
цель задача проект команда встреча решение выбор вариант план срок отчёт заметка список
`);

export const EN_WORDS = uniq(`
a as sad add dad fad ads ask lad fall all flask salad glass hall flag half dash glad hash
gall water threat drew wear few quest draft west tree were eat tea sweat your power port
pretty worry pull oil reply youth house our you the and for that with this from have they
word time look make like just about into them then than could other which their people
would write sound water first been call who oil its now find long down day did get come
made may part over said such only year well work know take see him back give most very
after thing our just form sentence great help line differ turn cause much mean before
move right boy old too same tell does set three want air well also play small end put
home read hand port large spell add even land here must big high such follow act why
ask men change went light kind off need house picture try us again animal point mother
world near build self earth father head stand own page should country plant school
start city earth eye tree farm hard start story saw far sea draw left late run dont
while press close night real life few stop open seem together next white children
begin walk example ease paper often always music those both mark book letter until
mile river car feet care second group carry took rain eat room friend began idea
fish mountain stop once book carry state face book cut done door sure watch farm
keyboard finger typing practice speed accuracy rhythm focus screen window coffee morning evening
station ticket bridge garden street market museum library kitchen table chair paper pencil number
message password network website button folder program project team meeting plan report result
question answer reason example rule order system method simple clear steady quiet bright warm cold
fresh strong light heavy quick slow early later never always sometimes today tomorrow yesterday
because between through around behind beside across along inside outside before after during
travel journey market summer winter spring autumn weather cloud river forest island valley road
write reading thinking speaking listening watching learning working moving building talking
`);

export type Passage = { title: { ru: string; en: string }; body: string };

export const RU_PASSAGES: Passage[] = [
  {
    title: { ru: "Утро", en: "Morning" },
    body: "Утро тихое. На столе чай, за окном серый двор. Пальцы стоят на середине клавиатуры. Взгляд остаётся на экране, и каждая буква ложится ровно. Не спешу: сначала нахожу ритм, потом держу его. Чай остывает медленно, и этого как раз хватает на ровный абзац. Если ошибся, не возвращаюсь назад, а просто продолжаю следующую фразу спокойно.",
  },
  {
    title: { ru: "Ёлка", en: "Spruce" },
    body: "Ещё один заход. Где лежит ёлка? Она у окна, рядом с книгой. Я печатаю медленно и ровно, без спешки. Моё дело простое: смотреть вперёд и не искать клавиши глазами. В книге закладка на середине главы, а за окном уже темно. Повторяю трудные слова ещё раз, пока пальцы сами не вспомнят дорогу. Так короткий текст становится длинной спокойной работой.",
  },
  {
    title: { ru: "Город", en: "City" },
    body: "Вечером город светлеет окнами. Мы идём вдоль реки, говорим мало и слушаем воду. Дома ждёт тёплый свет, чашка и короткая запись дня. Так и складывается спокойный текст. На мосту кто-то остановился посмотреть на отражения, а мы идём дальше. Дома я сажусь к клавиатуре и записываю день целиком, не пропуская мелкие подробности. Длинная фраза тоже даётся легко, если не смотреть вниз.",
  },
  {
    title: { ru: "Код", en: "Code" },
    body: "Хороший код читается как ясный текст. Имена говорят сами за себя, функции делают одно дело, а ошибки не прячутся под ковёр. Если строка слишком длинная, её стоит разделить. Если шаг неясен, его стоит описать словами. Печатать такой текст приятно: пальцы идут ровно, а мысль не отстаёт от рук.",
  },
  {
    title: { ru: "Дорога", en: "Road" },
    body: "Поезд уходит рано утром, когда город ещё спит. В вагоне тепло, за стеклом тянутся поля и редкие огни. Я достаю блокнот и записываю первые строки письма. Дорога длинная, и это хорошо: можно спокойно подумать, выпить чаю и ни о чём не спешить. К полудню солнце выходит из-за облаков, и страницы становятся светлыми.",
  },
];

export const EN_PASSAGES: Passage[] = [
  {
    title: { ru: "Утро", en: "Morning" },
    body: "The morning is quiet. A cup of tea sits on the desk, and the yard outside is still grey. Fingers rest on the home row. Eyes stay on the screen, and each word lands clean. I do not rush. First I find a pace, then I keep it until the cup is cool. A mistake does not send me back. I finish the line and start the next one with the same steady hands.",
  },
  {
    title: { ru: "Река", en: "River" },
    body: "Where does the river turn? It bends past the old bridge, slow and sure. I type without hunting for keys. The work is simple: look ahead, keep a steady pace, and let the letters fall. The path along the bank is longer than it looks from the road. I stay with the sentence until it ends, then take the next one without lifting my eyes. Long words are only short steps placed in a row.",
  },
  {
    title: { ru: "Вечер", en: "Evening" },
    body: "Evening fills the city with window light. We walk along the water and talk very little. At home a warm lamp waits, and a short note about the day. That is how a calm page begins. Someone stops on the bridge to watch the lights, but we keep walking. Later I sit down and write the whole day, including the small things. A long line is easy when the fingers already know the way.",
  },
  {
    title: { ru: "Код", en: "Code" },
    body: "Good code reads like clear writing. Names say what they mean, each function does one job, and errors are not swept under the rug. If a line grows too long, split it. If a step is unclear, explain it in plain words. Typing such text feels calm: the fingers move evenly, and the mind keeps pace with the hands.",
  },
  {
    title: { ru: "Дорога", en: "Road" },
    body: "The train leaves early, while the city is still asleep. It is warm inside, and fields slide past the window with a few lonely lights. I take out a notebook and write the first lines of a letter. The road is long, and that is fine: there is time to think, to drink tea, and to hurry nowhere. By noon the sun leaves the clouds, and the pages grow bright.",
  },
];

const bi = (ru: string, en: string) => ({ ru, en });

export const RU_LESSONS: Lesson[] = [
  {
    id: "ru-l",
    title: bi("Левая опора", "Left home"),
    blurb: bi("ФЫВА — мизинец, безымянный, средний, указательный.", "Ф Ы В А under the left hand."),
    allow: "фыва",
    fresh: "фыва",
    patterns: ["фыва", "аваф", "фава", "выф", "фыва фыва", "вава"],
    len: 72,
  },
  {
    id: "ru-r",
    title: bi("Правая опора", "Right home"),
    blurb: bi("ОЛДЖ. Указательные стоят на А и О.", "О Л Д Ж. Index fingers rest on А and О."),
    allow: "фываолдж",
    fresh: "олдж",
    focus: "олдж",
    patterns: ["олдж", "фыва олдж", "дож", "жал", "вода"],
    len: 96,
  },
  {
    id: "ru-home",
    title: bi("Домашний ряд", "Home row"),
    blurb: bi("Обе руки вместе. Короткие слова только из этих букв.", "Both hands. Short words from the home row only."),
    allow: "фываолдж",
    fresh: "",
    patterns: ["фыва олдж", "вода", "жало", "овал", "лад"],
    len: 120,
  },
  {
    id: "ru-pr",
    title: bi("Указательные", "Index reach"),
    blurb: bi("П и Р — шаг указательных вверх к центру.", "П and Р, a short reach from the index fingers."),
    allow: "фываолджпр",
    fresh: "пр",
    focus: "пр",
    patterns: ["пр", "папа", "жара", "пора", "правда", "провод"],
    len: 120,
  },
  {
    id: "ru-tl",
    title: bi("Верх слева", "Top left"),
    blurb: bi("Й Ц У К Е. Е — самая частая буква, её стоит поставить сразу.", "Й Ц У К Е. Е is the letter you will use most."),
    allow: "фываолджпрйцуке",
    fresh: "йцуке",
    focus: "йцуке",
    patterns: ["йцуке", "уже", "рука", "река", "кафе", "куда"],
    len: 130,
  },
  {
    id: "ru-tr",
    title: bi("Верх справа", "Top right"),
    blurb: bi("Н Г Ш Щ З Х Ъ. Щ и Ъ встречаются реже — просто запомните палец.", "Н Г Ш Щ З Х Ъ. Rare letters, same fingers every time."),
    allow: "фываолджпрйцукенгшщзхъ",
    fresh: "нгшщзхъ",
    focus: "нгшщзх",
    patterns: ["нгш", "цена", "нога", "шаг", "окно", "щено"],
    len: 140,
  },
  {
    id: "ru-bl",
    title: bi("Низ слева", "Bottom left"),
    blurb: bi("Я Ч С М И. Мизинец уходит вниз на Я.", "Я Ч С М И. The left pinky drops to Я."),
    allow: "фываолджпрйцукенгшщзхъячсми",
    fresh: "ячсми",
    focus: "ячсми",
    patterns: ["ячсм", "час", "сила", "моя", "семья", "чиж"],
    len: 140,
  },
  {
    id: "ru-br",
    title: bi("Низ справа", "Bottom right"),
    blurb: bi("Т Ь Б Ю. Точка ещё не здесь: на ПК она на клавише вопросительного знака.", "Т Ь Б Ю. The period is not this row."),
    allow: "фываолджпрйцукенгшщзхъячсмитьбю",
    fresh: "тьбю",
    focus: "тьбю",
    patterns: ["тьб", "тут", "быть", "юла", "мать", "стол"],
    len: 150,
  },
  {
    id: "ru-yo",
    title: bi("Буква ё", "The letter ё"),
    blurb: bi("На «Русской ПК» ё слева от 1. На «Русской» — клавиша \\.", "On Russian PC, ё is left of 1. On Russian, it is the \\ key."),
    allow: "фываолджпрйцукенгшщзхъячсмитьбюё",
    fresh: "ё",
    focus: "ё",
    patterns: ["ёлка", "ещё", "моё", "её", "мёд", "берёза"],
    len: 130,
  },
  {
    id: "ru-num",
    title: bi("Цифры", "Numbers"),
    blurb: bi("Верхний ряд. Те же пальцы, что и у букв под ними.", "The number row. Same fingers as the letters below."),
    allow: "0123456789",
    fresh: "0123456789",
    patterns: ["10 20 30", "12 34 56", "90 81 72", "2026", "100 250", "07 08 09", "45 67 89"],
    len: 100,
  },
  {
    id: "ru-punct",
    title: bi("Знаки", "Punctuation"),
    blurb: bi("Заглавные через Shift. Точка и запятая зависят от выбранной русской раскладки.", "Capitals use Shift. Period and comma follow the Russian layout you picked."),
    allow: "",
    fresh: ".,!?:;",
    patterns: [],
    fixed: "Да, уже пора. Где ключ? Он здесь: на столе! Я жду и начинаю снова. Нет, не так: сначала точка, потом запятая. Кто открыл дверь? Я. Смотрите: чай, книга, окно. Всё на месте; можно продолжать. Ещё раз: спокойно, ровно, без спешки!",
    len: 80,
  },
  {
    id: "ru-enter",
    title: bi("Новая строка", "New line"),
    blurb: bi(
      "Клавиша ввода (Enter) — правый мизинец. В конце каждой строки нажимайте её и возвращайте руку домой.",
      "Enter is pressed with the right pinky. Press it at the end of every line and bring the hand back home.",
    ),
    allow: "",
    fresh: "\n",
    patterns: [],
    fixed:
      "Утро.\nЧай.\nОкно.\nДом.\nТишина.\nЗавтра снова.\nКаждая строка кончается клавишей ввода.\nПравый мизинец тянется к ней и возвращается домой.\nСпокойно.\nРовно.\nБез спешки.\nЕщё одна строка.\nИ ещё одна.\nГотово.",
    len: 150,
  },
  {
    id: "ru-phrase",
    title: bi("Фразы", "Phrases"),
    blurb: bi("Связный текст подлиннее. Смотрите на экран, не на клавиши.", "A longer connected text. Eyes on the screen."),
    allow: "",
    fresh: "",
    patterns: [],
    fixed:
      "Утро тихое. На столе чай, за окном серый двор. Пальцы стоят на середине клавиатуры. Взгляд остаётся на экране, и каждая буква ложится ровно. Не спешу: сначала нахожу ритм, потом держу его. Чай остывает медленно, и этого как раз хватает на ровный абзац. Если ошибся, не возвращаюсь назад, а просто продолжаю следующую фразу спокойно.",
    len: 160,
  },
];

export const EN_LESSONS: Lesson[] = [
  {
    id: "en-l",
    title: bi("Левая опора", "Left home"),
    blurb: bi("A S D F. Указательный на F, там небольшая риска.", "A S D F. Index finger on F, where the little bump is."),
    allow: "asdf",
    fresh: "asdf",
    patterns: ["asdf", "afaf", "sad", "dad", "fad", "add"],
    len: 72,
  },
  {
    id: "en-r",
    title: bi("Правая опора", "Right home"),
    blurb: bi("J K L и точка с запятой. Указательный на J.", "J K L and semicolon. Index finger on J."),
    allow: "asdfjkl;",
    fresh: "jkl;",
    focus: "jkl",
    patterns: ["jkl;", "asdf jkl;", "ask", "lad", "all", "fall"],
    len: 96,
  },
  {
    id: "en-home",
    title: bi("Домашний ряд", "Home row"),
    blurb: bi("Обе руки. Слова только из домашнего ряда.", "Both hands. Words from the home row only."),
    allow: "asdfjkl;",
    fresh: "",
    patterns: ["asdf jkl;", "salad", "flask", "fall", "ask"],
    len: 120,
  },
  {
    id: "en-gh",
    title: bi("Указательные", "Index reach"),
    blurb: bi("G и H — шаг к центру.", "G and H, a short reach to the middle."),
    allow: "asdfjkl;gh",
    fresh: "gh",
    focus: "gh",
    patterns: ["gh", "glass", "hall", "flag", "dash", "glad"],
    len: 120,
  },
  {
    id: "en-tl",
    title: bi("Верх слева", "Top left"),
    blurb: bi("Q W E R T.", "Q W E R T."),
    allow: "asdfjkl;ghqwert",
    fresh: "qwert",
    focus: "qwert",
    patterns: ["qwert", "wear", "tree", "water", "quest", "draft"],
    len: 130,
  },
  {
    id: "en-tr",
    title: bi("Верх справа", "Top right"),
    blurb: bi("Y U I O P.", "Y U I O P."),
    allow: "asdfjkl;ghqwertyuiop",
    fresh: "yuiop",
    focus: "yuiop",
    patterns: ["yuiop", "you", "your", "port", "pull", "reply"],
    len: 140,
  },
  {
    id: "en-bl",
    title: bi("Низ слева", "Bottom left"),
    blurb: bi("Z X C V B.", "Z X C V B."),
    allow: "asdfjkl;ghqwertyuiopzxcvb",
    fresh: "zxcvb",
    focus: "zxcvb",
    patterns: ["zxcv", "back", "cave", "zebra", "verb", "exact"],
    len: 140,
  },
  {
    id: "en-br",
    title: bi("Низ справа", "Bottom right"),
    blurb: bi("N M и знаки запятой, точки, слэша.", "N M and the comma, period, slash."),
    allow: "asdfjkl;ghqwertyuiopzxcvbnm,./",
    fresh: "nm,./",
    focus: "nm",
    patterns: ["nm", "man", "name", "zoom", "next", "calm"],
    len: 140,
  },
  {
    id: "en-all",
    title: bi("Все буквы", "All letters"),
    blurb: bi("Смесь частых слов. Без цифр и знаков.", "A mix of common words. No digits yet."),
    allow: "abcdefghijklmnopqrstuvwxyz",
    fresh: "",
    patterns: ["the", "and", "you", "that", "with"],
    len: 160,
  },
  {
    id: "en-num",
    title: bi("Цифры", "Numbers"),
    blurb: bi("Верхний ряд. Те же пальцы, что у букв под цифрами.", "The number row. Same fingers as the letters below."),
    allow: "0123456789",
    fresh: "0123456789",
    patterns: ["10 20 30", "12 34 56", "90 81 72", "2026", "100 250", "07 08 09", "45 67 89"],
    len: 100,
  },
  {
    id: "en-punct",
    title: bi("Знаки", "Punctuation"),
    blurb: bi("Заглавные через Shift. Запятая и точка — нижний ряд справа.", "Capitals use Shift. Comma and period sit on the bottom right."),
    allow: "",
    fresh: ",.!?:;",
    patterns: [],
    fixed: "Yes, go. Wait! Where is it? Look: the desk is clear; the page is ready. No, not yet: first the comma, then the period. Who opened the door? I did. See: tea, a book, a window. Everything is in place; we can go on. Once more: steady, quiet, and without a rush!",
    len: 80,
  },
  {
    id: "en-enter",
    title: bi("Новая строка", "New line"),
    blurb: bi(
      "Клавиша ввода (Enter) — правый мизинец. В конце каждой строки нажимайте её и возвращайте руку домой.",
      "Enter is pressed with the right pinky. Press it at the end of every line and bring the hand back home.",
    ),
    allow: "",
    fresh: "\n",
    patterns: [],
    fixed:
      "Morning.\nTea.\nWindow.\nHome.\nSilence.\nTomorrow again.\nEvery line ends with the return key.\nThe right pinky reaches for it and goes back home.\nCalm.\nSteady.\nNo rush.\nOne more line.\nAnd one more.\nDone.",
    len: 130,
  },
  {
    id: "en-phrase",
    title: bi("Фразы", "Phrases"),
    blurb: bi("Связный текст подлиннее.", "A longer connected text."),
    allow: "",
    fresh: "",
    patterns: [],
    fixed:
      "The morning is quiet. A cup of tea sits on the desk, and the yard outside is still grey. Fingers rest on the home row. Eyes stay on the screen, and each word lands clean. I do not rush. First I find a pace, then I keep it until the cup is cool. A mistake does not send me back. I finish the line and start the next one with the same steady hands.",
    len: 180,
  },
];

export function lessonsFor(layout: LayoutId): Lesson[] {
  return layout === "en" ? EN_LESSONS : RU_LESSONS;
}

export function isUnlocked(lessons: Lesson[], stats: Record<string, { clears: number } | undefined>, id: string) {
  const index = lessons.findIndex((lesson) => lesson.id === id);
  if (index <= 0) return true;
  const prev = lessons[index - 1];
  return (stats[prev.id]?.clears ?? 0) > 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function sanitize(text: string, layout: LayoutId): string {
  const kept = [...text.replace(/\r\n?/g, "\n")].filter(
    (ch) => ch === " " || resolveChar(layout, ch) || equivalentsSafe(ch, layout),
  );
  // Line breaks stay (they are typed with Enter); stray spaces around them and empty lines go.
  return kept.join("").replace(/ *\n */g, "\n").replace(/\n+/g, "\n").replace(/ +/g, " ").trim();
}

function equivalentsSafe(ch: string, layout: LayoutId): boolean {
  return ch === "Ё" || ch === "Ë" ? !!resolveChar(layout, "Ё") || !!resolveChar(layout, "Ë") : false;
}

function wordsFor(lesson: Lesson): string[] {
  const dict = lesson.id.startsWith("en") ? EN_WORDS : RU_WORDS;
  const allow = new Set([...lesson.allow]);
  let pool = dict.filter((word) => [...word].every((ch) => allow.has(ch)));
  if (lesson.focus) {
    const focus = new Set([...lesson.focus]);
    const narrowed = pool.filter((word) => [...word].some((ch) => focus.has(ch)));
    if (narrowed.length >= 4) pool = narrowed;
  }
  return pool;
}

function generate(lesson: Lesson, seed: number): string {
  const rng = mulberry32(seed + hash(lesson.id));
  const patterns = lesson.patterns;
  const pool = wordsFor(lesson);
  const letters = [...lesson.allow];
  const parts: string[] = [];
  if (patterns[0]) parts.push(patterns[0]);
  let guard = 0;
  while (parts.join(" ").length < lesson.len * 3 && guard < 400) {
    guard += 1;
    const roll = rng();
    if (patterns.length && (pool.length === 0 || roll < 0.42)) {
      parts.push(patterns[Math.floor(rng() * patterns.length)]);
    } else if (pool.length) {
      parts.push(pool[Math.floor(rng() * pool.length)]);
    } else if (letters.length) {
      const n = 2 + Math.floor(rng() * 3);
      parts.push(Array.from({ length: n }, () => letters[Math.floor(rng() * letters.length)]).join(""));
    } else {
      break;
    }
  }
  return parts.join(" ");
}

type Extras = { punct?: boolean; nums?: boolean; lines?: boolean };

/** Capital letters, commas, full stops and numbers, like Monkeytype's punctuation and numbers toggles. */
function decorate(words: string[], rng: () => number, extras: Extras): string[] {
  if (!extras.punct && !extras.nums) return words;
  const ends = [".", ".", ".", "?", "!"];
  let sentenceStart = true;
  let sinceEnd = 0;
  const out = words.map((word) => {
    let item = word;
    if (extras.nums && rng() < 0.12) {
      item = String(Math.floor(rng() * (rng() < 0.5 ? 100 : 10000)));
    }
    if (extras.punct) {
      if (sentenceStart && !/^\d/.test(item)) {
        item = item.charAt(0).toLocaleUpperCase("ru") + item.slice(1);
      }
      sentenceStart = false;
      sinceEnd += 1;
      const roll = rng();
      if (sinceEnd >= 5 && roll < 0.22) {
        item += ends[Math.floor(rng() * ends.length)];
        sentenceStart = true;
        sinceEnd = 0;
      } else if (roll > 0.88) {
        item += ",";
      }
    }
    return item;
  });
  if (extras.punct && out.length && !/[.?!]$/.test(out[out.length - 1])) out[out.length - 1] += ".";
  return out;
}

/** Joins words with spaces, or, with `lines`, breaks the text into lines of 5–9 words (or at a sentence end). */
function joinWords(parts: string[], rng: () => number, lines: boolean): string {
  if (!lines) return parts.join(" ");
  let out = "";
  let run = 0;
  let limit = 5 + Math.floor(rng() * 5);
  parts.forEach((word, i) => {
    if (i > 0) {
      if (run >= limit || (run >= 4 && /[.?!]$/.test(parts[i - 1]))) {
        out += "\n";
        run = 0;
        limit = 5 + Math.floor(rng() * 5);
      } else {
        out += " ";
      }
    }
    out += word;
    run += 1;
  });
  return out;
}

function makeWords(layout: LayoutId, seed: number, count: number, extras: Extras = {}): string {
  const dict = layout === "en" ? EN_WORDS : RU_WORDS;
  const rng = mulberry32(seed + (layout === "en" ? 17 : 91));
  const parts: string[] = [];
  for (let i = 0; i < count; i++) parts.push(dict[Math.floor(rng() * dict.length)] ?? "a");
  return sanitize(joinWords(decorate(parts, rng, extras), rng, Boolean(extras.lines)), layout);
}

/**
 * Letters the learner can already use: every letter of each lesson that is open.
 * Lessons open one after another, so this grows as lessons are cleared.
 */
export function unlockedLetters(
  lessons: Lesson[],
  stats: Record<string, { clears: number } | undefined>,
): string {
  const set = new Set<string>();
  for (const lesson of lessons) {
    if (!isUnlocked(lessons, stats, lesson.id)) break;
    for (const ch of lesson.allow) if (/\p{L}/u.test(ch)) set.add(ch);
  }
  if (set.size < 4) for (const ch of lessons[0]?.allow ?? "") set.add(ch);
  return [...set].join("");
}

function pickWeighted<T>(items: T[], weights: number[], rng: () => number): T {
  let total = 0;
  for (const w of weights) total += w;
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Letter-pair chain trained on the dictionary, so made-up words still sound like real ones. */
function buildChain(dict: string[], allowed: Set<string>): Map<string, Map<string, number>> {
  const chain = new Map<string, Map<string, number>>();
  const add = (from: string, to: string) => {
    const row = chain.get(from) ?? new Map<string, number>();
    row.set(to, (row.get(to) ?? 0) + 1);
    chain.set(from, row);
  };
  for (const word of dict) {
    for (const run of word.split(new RegExp(`[^${[...allowed].join("")}]+`, "u"))) {
      if (run.length < 2) continue;
      const chars = [...run];
      add("^", chars[0]);
      for (let i = 0; i < chars.length - 1; i++) add(chars[i], chars[i + 1]);
      add(chars[chars.length - 1], "$");
    }
  }
  return chain;
}

function chainWord(
  chain: Map<string, Map<string, number>>,
  letters: string[],
  weak: Map<string, number>,
  pairWeak: (from: string, to: string) => number,
  rng: () => number,
): string {
  const goal = 3 + Math.floor(rng() * 5);
  let out = "";
  let cur = "^";
  for (let guard = 0; guard < 12; guard++) {
    const row = chain.get(cur);
    const options: string[] = [];
    const weights: number[] = [];
    if (row) {
      for (const [next, count] of row) {
        if (next === "$" && out.length < 3) continue;
        options.push(next);
        weights.push(
          count *
            (next === "$"
              ? out.length >= goal
                ? 6
                : 0.6
              : (1 + 8 * (weak.get(next) ?? 0.45) ** 2) * (cur === "^" ? 1 : 1 + 6 * pairWeak(cur, next) ** 2)),
        );
      }
    }
    if (!options.length) {
      if (out.length >= 2) break;
      const ch = letters[Math.floor(rng() * letters.length)];
      out += ch;
      cur = ch;
      continue;
    }
    const next = pickWeighted(options, weights, rng);
    if (next === "$") break;
    out += next;
    cur = next;
    if (out.length >= 8) break;
  }
  return out || letters[Math.floor(rng() * letters.length)];
}

/** A short string of random letters, leaning on weak and new letters. Used while few letters are open. */
function drillWord(
  letters: string[],
  weak: Map<string, number>,
  pairWeak: (from: string, to: string) => number,
  rng: () => number,
): string {
  const length = 3 + Math.floor(rng() * 3);
  let out = "";
  for (let i = 0; i < length; i++) {
    const prev = out.slice(-1);
    const others = letters.filter((ch) => ch !== prev);
    const options = others.length ? others : letters;
    const weights = options.map(
      (ch) => (1 + 8 * (weak.get(ch) ?? 0.45) ** 2) * (prev ? 1 + 6 * pairWeak(prev, ch) ** 2 : 1),
    );
    out += pickWeighted(options, weights, rng);
  }
  return out;
}

/**
 * Adaptive practice (the Keybr idea). Words come only from unlocked letters. Roughly
 * 70% of them lean on the keys and letter pairs you find hard, about 20% bring in the
 * letters you are just learning, and 10% are plain review.
 */
function smartText(opts: {
  layout: LayoutId;
  letters: string;
  fresh: string;
  keys: KeyMap;
  pairs: KeyMap;
  seed: number;
  words: number;
  extras: Extras;
}): string {
  const rng = mulberry32(opts.seed * 7919 + 13);
  const dict = opts.layout === "en" ? EN_WORDS : RU_WORDS;
  const letters = [...new Set([...opts.letters])];
  if (!letters.length) return "";
  const allowed = new Set(letters);
  const freshSet = new Set([...opts.fresh].filter((ch) => allowed.has(ch)));
  const mean = meanLatency(opts.keys);
  const pairMean = meanLatency(opts.pairs);
  const weak = new Map(
    letters.map((ch) => {
      const w = weakness(opts.keys[ch], mean);
      // A letter that was just opened always gets attention.
      return [ch, freshSet.has(ch) ? Math.max(w, 0.65) : w] as const;
    }),
  );
  const top = new Set(rankWeak(opts.letters, opts.keys).slice(0, 2));
  const pairWeak = (from: string, to: string) => pairWeakness(opts.pairs, from + to, pairMean) ?? 0;

  const pool = dict.filter((word) => word.length >= 2 && [...word].every((ch) => allowed.has(ch)));
  const weights = pool.map((word) => {
    const chars = [...word];
    const avg = chars.reduce((sum, ch) => sum + (weak.get(ch) ?? 0.45), 0) / chars.length;
    let worstPair = 0;
    for (let i = 0; i < chars.length - 1; i++) worstPair = Math.max(worstPair, pairWeak(chars[i], chars[i + 1]));
    return 0.3 + 12 * avg * avg + (chars.some((ch) => top.has(ch)) ? 5 : 0) + 10 * worstPair * worstPair;
  });
  const freshPool = pool.filter((word) => [...word].some((ch) => freshSet.has(ch)));
  const chain = buildChain(dict, allowed);
  const realShare = pool.length >= 40 ? 0.7 : pool.length >= 8 ? 0.45 : 0;

  const parts: string[] = [];
  let prev = "";
  for (let guard = 0; parts.length < opts.words && guard < opts.words * 6; guard++) {
    const roll = rng();
    let word: string;
    if (pool.length && rng() < realShare) {
      if (roll < 0.2 && freshPool.length) word = freshPool[Math.floor(rng() * freshPool.length)];
      else if (roll < 0.9) word = pickWeighted(pool, weights, rng);
      else word = pool[Math.floor(rng() * pool.length)];
    } else {
      word = letters.length <= 8 ? drillWord(letters, weak, pairWeak, rng) : chainWord(chain, letters, weak, pairWeak, rng);
    }
    if (word === prev || word.length < 2) continue;
    parts.push(word);
    prev = word;
  }
  // Beginners with only a few letters do not get line breaks yet.
  const lines = Boolean(opts.extras.lines) && letters.length >= 7;
  return sanitize(joinWords(decorate(parts, rng, opts.extras), rng, lines), opts.layout);
}

const isLetter = (ch: string) => /\p{L}/u.test(ch);

/** The speed a lesson asks for, in characters per minute. It rises a little with every lesson. */
export const lessonTarget = (index: number) => 60 + 6 * Math.min(Math.max(index, 0), 11);

/** Letters a lesson is about; a review lesson (no new letters) covers everything it allows. */
const lessonLetters = (lesson: Lesson) => [...(lesson.fresh || lesson.allow)].filter(isLetter);

/**
 * Keybr-style unlocking: when the letters of the first lesson not yet cleared are typed
 * accurately and fast enough, that lesson counts as cleared and its letters join the
 * practice. Returns the lesson to clear, or null.
 */
export function autoAdvance(
  lessons: Lesson[],
  stats: Record<string, { clears: number } | undefined>,
  keys: KeyMap,
): Lesson | null {
  const index = lessons.findIndex((lesson) => (stats[lesson.id]?.clears ?? 0) === 0);
  if (index < 0) return null;
  const lesson = lessons[index];
  const letters = lessonLetters(lesson);
  if (!letters.length) return null;
  const limitMs = 60_000 / lessonTarget(index);
  const ready = letters.every((ch) => {
    const stat = keys[ch];
    const total = samples(stat);
    if (!stat || total < 15) return false;
    if (stat.miss / total > 0.08) return false;
    return !(stat.lat >= 5 && stat.ms / stat.lat > limitMs);
  });
  return ready ? lesson : null;
}

/**
 * Level check: how many lessons from the start are already known, judged from the keys
 * typed in one run. Stops at the first lesson with a letter that was slow or error-prone.
 */
export function placeLessons(lessons: Lesson[], keys: KeyMap): number {
  let known = 0;
  for (const lesson of lessons) {
    const letters = lessonLetters(lesson);
    if (!letters.length) break;
    const ok = letters.every((ch) => {
      const stat = keys[ch];
      const total = samples(stat);
      if (!stat || total < 3) return false;
      if (stat.miss / total > 0.12) return false;
      return !(stat.lat >= 3 && stat.ms / stat.lat > 1100);
    });
    if (!ok) break;
    known += 1;
  }
  return known;
}

/** A short text that makes every letter of the layout appear at least three times. */
export function diagnosticText(layout: LayoutId, seed: number): string {
  const letters = new Set<string>();
  for (const lesson of lessonsFor(layout)) for (const ch of lessonLetters(lesson)) letters.add(ch);
  const dict = layout === "en" ? EN_WORDS : RU_WORDS;
  const usable = dict.filter((word) => word.length >= 3 && word.length <= 8);
  const rng = mulberry32(seed * 104729 + 7);
  const need = new Map<string, number>([...letters].map((ch) => [ch, 3] as [string, number]));
  const words: string[] = [];
  while (words.length < 60) {
    const target = [...need].find(([, count]) => count > 0)?.[0];
    if (!target) break;
    const options = usable.filter((word) => word.includes(target));
    if (!options.length) {
      need.set(target, 0);
      continue;
    }
    const word = options[Math.floor(rng() * options.length)];
    words.push(word);
    for (const ch of word) if (need.has(ch)) need.set(ch, (need.get(ch) ?? 0) - 1);
  }
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  return sanitize(words.join(" "), layout);
}

export function exerciseText(opts: {
  mode: Mode;
  layout: LayoutId;
  lesson: Lesson;
  seed: number;
  passage: number;
  /** Length of a tempo run; sets how much text is prepared. */
  seconds?: number;
  punct?: boolean;
  nums?: boolean;
  /** Break the text into lines, so Enter has to be pressed. */
  lines?: boolean;
  /** Needed for the adaptive mode. */
  smart?: { letters: string; fresh?: string; keys: KeyMap; pairs?: KeyMap };
}): string {
  const extras = { punct: opts.punct, nums: opts.nums, lines: opts.lines };
  if (opts.mode === "basics") {
    if (opts.lesson.fixed) return sanitize(opts.lesson.fixed, opts.layout);
    return sanitize(generate(opts.lesson, opts.seed), opts.layout);
  }
  if (opts.mode === "smart") {
    return smartText({
      layout: opts.layout,
      letters: opts.smart?.letters ?? opts.lesson.allow,
      fresh: opts.smart?.fresh ?? "",
      keys: opts.smart?.keys ?? {},
      pairs: opts.smart?.pairs ?? {},
      seed: opts.seed,
      words: 70,
      extras,
    });
  }
  if (opts.mode === "check") return diagnosticText(opts.layout, opts.seed);
  if (opts.mode === "words") return makeWords(opts.layout, opts.seed, 60, extras);
  if (opts.mode === "tempo") return makeWords(opts.layout, opts.seed, Math.round((opts.seconds ?? 60) * 5), extras);
  const passages = opts.layout === "en" ? EN_PASSAGES : RU_PASSAGES;
  const body = passages[opts.passage % passages.length]?.body ?? "";
  // With line breaks on, every sentence starts on a new line.
  return sanitize(opts.lines ? body.replace(/([.!?]) /g, "$1\n") : body, opts.layout);
}

export function passagesFor(layout: LayoutId): Passage[] {
  return layout === "en" ? EN_PASSAGES : RU_PASSAGES;
}

export function weakDrill(letters: string[], layout: LayoutId): string {
  const clean = letters.filter((ch) => ch.trim() && resolveChar(layout, ch)).slice(0, 6);
  if (!clean.length) return "";
  const parts: string[] = [];
  for (let i = 0; i < 18; i++) {
    const a = clean[i % clean.length];
    const b = clean[(i + 1) % clean.length];
    const c = clean[(i + 2) % clean.length];
    parts.push(`${a}${a} ${b}${b}`, `${a}${b}${c}`, `${a}${b} ${c}${a} ${b}${c}`);
  }
  return sanitize(parts.join(" "), layout);
}

export function grade(expected: string, typed: string): boolean {
  return accepts(expected, typed);
}
