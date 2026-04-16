# TrackerHub

B2B SaaS платформа, совмещающая **трекер задач** (в стиле Jira) и **систему онбординга** сотрудников. Компании ведут спринты и тикеты, а параллельно создают обучающие модули и назначают их новым сотрудникам.

## Quick Start

```bash
cp .env.example .env
# Заполните MAIL_USERNAME, MAIL_PASSWORD, JWT_SECRET и другие переменные
docker compose up --build
```

Доступные адреса:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## Архитектура

```
Browser → Next.js (3000) → Spring Boot API (8080) → PostgreSQL (5432)
                                    ↓
                              /app/uploads  (вложения тикетов и модулей)
```

**Слои бэкенда:**
```
api/controller  — REST-контроллеры, DTO
service         — бизнес-логика
domain/model    — JPA-сущности
domain/repository — Spring Data репозитории
infrastructure  — Security, JWT, конфигурация
```

## Роли

| Роль | Возможности |
|------|-------------|
| OWNER | Полный доступ, управление компанией, тарифы, платежи, приглашение всех ролей |
| CO_OWNER | Заместитель владельца, приглашает CO_OWNER и MANAGER |
| MANAGER | Создание модулей/групп, назначение задач, приглашение DEVELOPER |
| DEVELOPER | Работа с тикетами и спринтами, прохождение назначенных модулей |
| ADMIN | Системный администратор, доступ ко всем компаниям |

## Функциональность

**Трекер задач (Jira-подобный)**
- Спринты со статусами: `PLANNING` → `ACTIVE` → `COMPLETED`
- Тикеты с типами: `TASK`, `BUG`, `STORY`, `EPIC`, `SUBTASK`
- Приоритеты: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Статусы тикетов: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`
- Комментарии и вложения к тикетам
- Story points, репортёр и исполнитель
- Уникальный номер тикета с префиксом компании (например, `PROJ-42`)
- Kanban-борды по спринтам

**Онбординг**
- Конструктор блоков: `text`, `video`, `image`, `file`, `callout`, `checklist`, `quiz`, `divider`
- Квизы: одиночный/множественный выбор, политики попыток (`SINGLE` / `UNLIMITED`)
- Группировка модулей с упорядочиванием
- Назначение модулей или групп конкретным пользователям с датами
- Отслеживание прогресса по каждому модулю и группе
- Email-уведомление менеджеру при завершении модуля

**Команда и приглашения**
- Приглашение по email с верификацией через токен
- Роли разработчика (`devRoles`) — специализации внутри компании
- Активация/деактивация участников
- Поддержка нескольких компаний на одного пользователя

**Тарифы и оплата**
- Тарифные планы с подписками
- Оплата криптовалютой (BTC, ETH, USDT ERC-20/BEP-20/TRC-20, SOL, TON)

## API

```
POST /api/auth/register                       — Регистрация + создание компании
POST /api/auth/login                          — Вход (HttpOnly cookie)
POST /api/auth/logout                         — Выход
GET  /api/auth/me                             — Текущий пользователь
GET  /api/auth/verify-email?token=            — Верификация email
POST /api/auth/forgot-password                — Запрос сброса пароля
POST /api/auth/reset-password                 — Сброс пароля

GET  /api/sprints?companyId=                  — Список спринтов
POST /api/sprints?companyId=                  — Создать спринт
PATCH /api/sprints/{id}/status                — Изменить статус спринта
DELETE /api/sprints/{id}                      — Удалить спринт

GET  /api/tickets?companyId=&sprintId=        — Список тикетов
GET  /api/tickets/{id}                        — Получить тикет
POST /api/tickets?companyId=                  — Создать тикет
PUT  /api/tickets/{id}                        — Обновить тикет
PATCH /api/tickets/{id}/status                — Изменить статус тикета
DELETE /api/tickets/{id}                      — Удалить тикет
POST /api/tickets/{id}/comments               — Добавить комментарий
DELETE /api/tickets/comments/{commentId}      — Удалить комментарий
POST /api/tickets/{id}/attachments            — Добавить вложение
DELETE /api/tickets/attachments/{attachmentId} — Удалить вложение

GET  /api/modules?companyId=                  — Список модулей компании
GET  /api/modules/{id}                        — Получить модуль
POST /api/modules?companyId=                  — Создать модуль
PUT  /api/modules/{id}                        — Обновить модуль
DELETE /api/modules/{id}                      — Удалить модуль

GET  /api/groups?companyId=                   — Список групп
POST /api/groups?companyId=                   — Создать группу
PUT  /api/groups/{id}                         — Обновить группу
DELETE /api/groups/{id}                       — Удалить группу
POST /api/groups/{groupId}/modules/{moduleId} — Добавить модуль в группу
DELETE /api/groups/{groupId}/modules/{moduleId} — Убрать модуль из группы
PATCH /api/groups/{groupId}/modules/reorder   — Изменить порядок модулей

POST /api/assignments                         — Назначить группу пользователю
POST /api/assignments/module                  — Назначить модуль пользователю
GET  /api/assignments/my?companyId=           — Мои назначения (группы)
GET  /api/assignments/my/modules              — Мои назначения (модули)
DELETE /api/assignments/{id}                  — Снять назначение группы
DELETE /api/assignments/module/{id}           — Снять назначение модуля

POST /api/progress/modules/{id}/start         — Начать модуль
POST /api/progress/modules/{id}/complete      — Завершить модуль
GET  /api/progress/my/modules                 — Мой прогресс по модулям
GET  /api/progress/my/groups                  — Мой прогресс по группам

POST /api/quiz/questions/{id}/attempt         — Ответить на вопрос квиза

POST /api/files/upload                        — Загрузить файл

POST /api/invitations?companyId=              — Пригласить пользователя
GET  /api/invitations?companyId=              — Список приглашений
DELETE /api/invitations/{id}                  — Отменить приглашение
GET  /api/invitations/validate?token=         — Проверить токен приглашения
POST /api/invitations/accept                  — Принять приглашение

GET  /api/team?companyId=                     — Список участников команды
PATCH /api/team/{userId}/dev-roles            — Обновить роли разработчика
PATCH /api/team/{userId}/deactivate           — Деактивировать участника
PATCH /api/team/{userId}/activate             — Активировать участника

GET  /api/plans                               — Доступные тарифы
GET  /api/wallet                              — Реквизиты для оплаты
GET  /api/profile                             — Профиль пользователя
PUT  /api/profile                             — Обновить профиль
POST /api/contact                             — Форма обратной связи
GET  /api/admin/users                         — Все пользователи (admin)
```

## Стек

- **Backend**: Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA, Flyway, MapStruct, JavaMailSender
- **Auth**: JWT в HttpOnly cookies, верификация email, сброс пароля
- **Database**: PostgreSQL 16 (Flyway, 1 миграция)
- **Frontend**: Next.js 14 App Router, TypeScript, TailwindCSS, TanStack Query v5, React Hook Form + Zod
- **i18n**: next-intl (English, Russian, Ukrainian)
- **Infrastructure**: Docker, Docker Compose, Spring Actuator (healthcheck)

## Тесты

```bash
cd backend && mvn test
```

## Переменные окружения

| Переменная | Описание |
|-----------|----------|
| `POSTGRES_DB / USER / PASSWORD` | Параметры PostgreSQL |
| `JWT_SECRET` | Секрет для подписи токенов (минимум 64 символа) |
| `JWT_EXPIRY_HOURS` | Срок жизни токена (по умолчанию 24) |
| `CORS_ALLOWED_ORIGINS` | Разрешённые origins для CORS |
| `FRONTEND_URL` | URL фронтенда (для ссылок в письмах) |
| `NEXT_PUBLIC_API_URL` | URL бэкенда для фронтенда |
| `MAIL_HOST / PORT / USERNAME / PASSWORD` | SMTP для уведомлений |
| `CONTACT_RECIPIENT_EMAIL` | Email получателя формы обратной связи |
| `WALLET_*` | Адреса криптокошельков для оплаты |

## Production

- Замените `JWT_SECRET` на длинную случайную строку
- Настройте SMTP-провайдера (Gmail App Password или другой)
- Включите HTTPS и обновите `CORS_ALLOWED_ORIGINS` и `FRONTEND_URL`
- Настройте volume для `/app/uploads` с резервным копированием
- Смените адреса кошельков в переменных `WALLET_*`
