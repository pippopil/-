# 🍺 МастерВарка — Калькулятор и Лаборатория Пивовара

> Профессиональное приложение для домашних и крафтовых пивоваров с офлайн-базой 34 стилей BJCP, калькулятором засыпи и хмеля, базой аналогов Курского солода, ИИ-генератором этикеток и автоматической синхронизацией.

---

## 📱 Скачать готовое приложение и релиз

Официальный релиз опубликован на GitHub:

- 🚀 **[Страница релиза v1.0.0](https://github.com/pippopil/-/releases/tag/v1.0.0)**
- 📦 **[Скачать архив приложения mastervarka-v1.0.0.zip](https://github.com/pippopil/-/releases/download/v1.0.0/mastervarka-v1.0.0.zip)** (исходный код + готовая папка `android/` для сборки в APK)
- ⚡ **[Все релизы репозитория](https://github.com/pippopil/-/releases)**

### 📱 1. Мгновенная установка на телефон как мобильное приложение (PWA)
Приложение поддерживает режим Progressive Web App — устанавливается в 1 клик прямо из браузера смартфона (Chrome, Safari, Samsung Internet) и работает **100% офлайн без интернета**:
- Откройте сайт приложения на смартфоне и нажмите **«Установить приложение»** (на iPhone: Поделиться -> На экран «Домой»).

### 🛠️ 2. Сборка собственного .APK через Android Studio
В репозитории уже добавлена готовая native-папка `android/`:
1. Скачайте репозиторий или разархивируйте `mastervarka-v1.0.0.zip`.
2. Откройте папку `android/` в **Android Studio**.
3. Нажмите в меню: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
4. Готовый файл появится в `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🚀 Быстрый запуск на компьютере (Локально)

```bash
# 1. Клонирование репозитория
git clone https://github.com/pippopil/-.git
cd -

# 2. Установка зависимостей
npm install

# 3. Запуск сервера разработки
npm run dev
```
Откройте в браузере: `http://localhost:3000`

---

## 📱 Сборка APK на своем компьютере (Capacitor + Android Studio)

В проект уже интегрирован **Capacitor 8** и настроен `capacitor.config.json`:

```bash
# 1. Сборка веб-приложения и создание Android платформы
npm run cap:android

# 2. Открытие сгенерированного Android-проекта в Android Studio
npm run cap:open
```

В открывшемся Android Studio:
- Нажмите в верхнем меню: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
- Готовый установочный `.apk` будет создан в папке: `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## ⚙️ Автоматическая сборка APK на GitHub Actions

В папке `ci/build-apk.yml` подготовлен готовый конфигурационный файл для сборки APK на серверах GitHub Actions.

Чтобы запустить сборку:
1. В интерфейсе вашего репозитория на GitHub перейдите в `ci/build-apk.yml`.
2. Скопируйте его содержимое в новый файл `.github/workflows/build-apk.yml` (или переместите файл).
3. Во вкладке **Actions** запустится автоматическая сборка и появится файл `mastervarka.apk` для скачивания!

---

## 🛠 Доступные команды

- `npm run dev` — Запуск локального full-stack сервера (Node.js + Vite + Gemini API)
- `npm run build` — Сборка продакшн веб-приложения в папку `dist`
- `npm run start` — Запуск готового сервера Node.js
- `npm run cap:android` — Сборка и синхронизация платформы Android
- `npm run cap:open` — Запуск Android Studio для сборки APK

---

## 📄 Лицензия
Apache-2.0
