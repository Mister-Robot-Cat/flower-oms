# Flower OMS: установка и обновление

## Требования

- Node.js 20.12 или новее
- MySQL 8 или MariaDB 10.6+
- npm

## Новая установка

```bash
# 1. Зависимости (заодно генерируется Prisma-клиент в ./prisma-client)
npm install

# 2. Настройки
cp .env.example .env        # в Windows: copy .env.example .env
#    заполните DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# 3. Создайте пустую базу (один раз)
#    CREATE DATABASE flower_oms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 4. Таблицы
npm run db:migrate

# 5. Первый администратор (пароль будет показан один раз)
npm run db:admin -- admin "Administrator"

# 6. Запуск
npm run dev            # разработка
npm run build && npm start   # боевой режим
```

Для локальной проверки можно создать демо-данные: `npm run db:seed-demo`.
Скрипт создаёт пользователей admin, operator1, florist1 и florist2, несколько цветов и заказов, а пароль выводит в консоль.
В боевом режиме (`NODE_ENV=production`) скрипт не запускается.

> **MySQL 8 на своём компьютере:** если при подключении появляется ошибка про `RSA public key`,
> добавьте в конец `DATABASE_URL` параметр `?allowPublicKeyRetrieval=true`.

## Обновление существующей установки (с версии до v1)

1. **Сделайте резервную копию базы и папок `uploads/` и `public/uploads/`.**
   Реальные фото заказов больше не хранятся в git. В новой версии они удалены из репозитория,
   поэтому при `git pull` git может удалить их из рабочей папки. Скопируйте их заранее и после обновления верните на место.
2. `npm install`
3. Обновите схему базы:
   - если раньше вы использовали `npx prisma db push`, выполните `npx prisma db push` ещё раз;
   - если использовали миграции: `npm run db:migrate`.
4. Свяжите старые заказы с карточками клиентов и приведите телефоны к единому формату:
   `npm run db:link-customers`
5. Если у кого-то был пароль `password123`, смените его: «İstifadəçilər» → редактировать.
   Можно и так: `npm run db:admin -- admin` (создаёт новый случайный пароль).
6. Проверьте `.env` по образцу `.env.example`. Важно: `NEXTAUTH_URL` должен совпадать
   с адресом, который открывают в браузере. Если адрес начинается с `https://`, куки будут защищёнными.

## Где хранятся фото

- Все фото лежат в папке `uploads/` (или в `UPLOAD_DIR`) и отдаются только через API и только сотрудникам, вошедшим в систему.
- Старые фото из `public/uploads/` продолжают открываться, новые туда больше не пишутся.
- Эту папку нужно включить в резервное копирование вместе с базой.

## Полезные команды

| Команда | Что делает |
|---|---|
| `npm run dev` | запуск для разработки |
| `npm run build` / `npm start` | сборка / запуск в боевом режиме |
| `npm run typecheck` | проверка типов TypeScript |
| `npm run lint` | ESLint |
| `npm run db:migrate` | применить миграции |
| `npm run db:admin -- <логин> "<Имя>" [пароль]` | создать админа или сбросить ему пароль |
| `npm run db:link-customers` | связать заказы с клиентами (разово после обновления) |
| `npm run db:seed-demo` | демо-данные (только для локальной проверки) |
| `npx prisma studio` | просмотр базы в браузере |

## Решение проблем

- **Порт занят (Windows):** `Get-Process -Name node | Stop-Process -Force`
- **`DATABASE_URL is not set`:** нет файла `.env` или в нём пустой `DATABASE_URL`.
- **Не получается войти после обновления:** проверьте `NEXTAUTH_URL` и `NEXTAUTH_SECRET`, очистите cookies сайта.
- **Ошибки `prisma-client` не найден:** выполните `npx prisma generate`.
