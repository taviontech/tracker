# TrackerHub

A B2B SaaS project tracker for development teams. Plan sprints, manage tickets, and keep your team aligned — from backlog to done.

## Quick Start

```bash
cp .env.example .env
# Fill in MAIL_USERNAME, MAIL_PASSWORD, JWT_SECRET, and other variables
docker compose up --build
```

Available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

## Architecture

```
Browser → Next.js (3000) → Spring Boot API (8080) → PostgreSQL (5432)
                                    ↓
                              /app/uploads  (ticket attachments)
```

**Backend layers:**
```
api/controller    — REST controllers, DTOs
service           — business logic
domain/model      — JPA entities
domain/repository — Spring Data repositories
infrastructure    — Security, JWT, configuration
```

## Roles

| Role | Capabilities |
|------|-------------|
| OWNER | Full access, company management, plans, invite all roles |
| CO_OWNER | Deputy owner, invites CO_OWNER and MANAGER |
| MANAGER | Create sprints, assign tickets, invite DEVELOPER |
| DEVELOPER | Work with tickets and sprints |
| ADMIN | System administrator, access to all companies |

## Features

**Sprint Management**
- Sprint statuses: `PLANNING` → `ACTIVE` → `PAUSED` → `COMPLETED`
- Create, start, pause, resume, and complete sprints
- Kanban boards per sprint with customizable columns

**Ticket Tracking**
- Types: `TASK`, `BUG`, `STORY`, `EPIC`, `SUBTASK`
- Priorities: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- Statuses: `TODO` → `IN_PROGRESS` → `IN_REVIEW` → `DONE`
- Comments and file attachments
- Story points, reporter, and assignee
- Unique ticket number with company prefix (e.g. `PROJ-42`)
- Change history log

**Team & Invitations**
- Email invitations with token verification
- Member activation/deactivation
- Multiple companies per user

## API

```
POST /api/auth/register                        — Register + create company
POST /api/auth/login                           — Login (HttpOnly cookie)
POST /api/auth/logout                          — Logout
GET  /api/auth/me                              — Current user
GET  /api/auth/verify-email?token=             — Email verification
POST /api/auth/forgot-password                 — Request password reset
POST /api/auth/reset-password                  — Reset password

GET  /api/sprints?companyId=                   — List sprints
POST /api/sprints?companyId=                   — Create sprint
PATCH /api/sprints/{id}/status                 — Change sprint status
DELETE /api/sprints/{id}                       — Delete sprint

GET  /api/tickets?companyId=&sprintId=         — List tickets
GET  /api/tickets/{id}                         — Get ticket
POST /api/tickets?companyId=                   — Create ticket
PUT  /api/tickets/{id}                         — Update ticket
PATCH /api/tickets/{id}/status                 — Change ticket status
DELETE /api/tickets/{id}                       — Delete ticket
POST /api/tickets/{id}/comments                — Add comment
DELETE /api/tickets/comments/{commentId}       — Delete comment
POST /api/tickets/{id}/attachments             — Add attachment
DELETE /api/tickets/attachments/{attachmentId} — Remove attachment

POST /api/invitations?companyId=               — Invite user
GET  /api/invitations?companyId=               — List invitations
DELETE /api/invitations/{id}                   — Cancel invitation
GET  /api/invitations/validate?token=          — Validate invitation token
POST /api/invitations/accept                   — Accept invitation

GET  /api/team?companyId=                      — List team members
PATCH /api/team/{userId}/deactivate            — Deactivate member
PATCH /api/team/{userId}/activate              — Activate member

GET  /api/plans                                — Available plans
GET  /api/wallet                               — Crypto wallet addresses
GET  /api/profile                              — User profile
PUT  /api/profile                              — Update profile
POST /api/contact                              — Contact form
GET  /api/admin/users                          — All users (admin)
POST /api/files/upload                         — Upload file
```

## Stack

- **Backend**: Java 21, Spring Boot 3.2, Spring Security, Spring Data JPA, Flyway, MapStruct, JavaMailSender
- **Auth**: JWT in HttpOnly cookies, email verification, password reset
- **Database**: PostgreSQL 16 (Flyway migrations)
- **Frontend**: Next.js 14 App Router, TypeScript, TailwindCSS, React Hook Form + Zod
- **i18n**: next-intl (English, Russian, Ukrainian)
- **Infrastructure**: Docker, Docker Compose, Spring Actuator (healthcheck)

## Tests

```bash
cd backend && mvn test
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB / USER / PASSWORD` | PostgreSQL credentials |
| `JWT_SECRET` | Token signing secret (min 64 characters) |
| `JWT_EXPIRY_HOURS` | Token lifetime (default: 24) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins |
| `FRONTEND_URL` | Frontend URL (used in email links) |
| `NEXT_PUBLIC_API_URL` | Backend URL for the frontend |
| `MAIL_HOST / PORT / USERNAME / PASSWORD` | SMTP for notifications |
| `CONTACT_RECIPIENT_EMAIL` | Recipient email for the contact form |
| `WALLET_*` | Crypto wallet addresses for donations |

## Production

- Replace `JWT_SECRET` with a long random string
- Configure an SMTP provider (Gmail App Password or similar)
- Enable HTTPS and update `CORS_ALLOWED_ORIGINS` and `FRONTEND_URL`
- Mount a volume for `/app/uploads` with backups
