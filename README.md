# 🔐 SecureApps - Enterprise Application Access Portal

<div align="center">
  <h3>🚀 Secure application access management with PIN authentication</h3>
  <p>Centralize app access, manage users, and control application provisioning with approval workflows</p>

  [![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
</div>

---

## ✨ Features

### 🎯 Core Functionality
- **🔐 PIN Authentication** - 4-digit PIN gate for app access with rate limiting
- **📱 Application Dashboard** - Personal app tiles with quick launch
- **🏪 App Store** - Browse and request access to applications
- **👥 User Management** - Full user CRUD with role-based access

### 👨‍💼 Admin Features
- **📊 Admin Dashboard** - System statistics and overview
- **🔑 Manage Access** - Search users and assign apps with autocomplete
- **📋 Request Queue** - Approve/deny app access requests
- **📈 User Activity** - Live analytics and user tracking
- **🛡️ Audit Logs** - Complete action history

### 🔒 Security
- **JWT Authentication** with server-side session validation
- **bcrypt Password Hashing** (cost factor 10)
- **RBAC** - 15+ granular permissions
- **Rate Limiting** - PIN attempts: 5 per 5 minutes
- **Security Headers** - HSTS, X-Frame-Options, X-XSS-Protection

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js 18+, Express.js 4.x |
| **Database** | PostgreSQL 14+ |
| **Authentication** | JWT (jsonwebtoken) + bcrypt |
| **Logging** | Winston |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/guyyuso/otka.git
cd otka

# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Configure Environment

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

**Backend** (`server/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
DB_HOST=localhost
DB_PORT=5432
DB_NAME=secureapps
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-super-secret-key-min-32-chars
```

### 3. Setup Database

```bash
# Create PostgreSQL database
createdb secureapps

# Tables are auto-created on first server start
```

### 4. Run Development

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
npm run dev
```

Visit `http://localhost:5173`

### 5. Create Admin User

Register a new user, then update their role in the database:
```sql
UPDATE users SET role = 'super_admin' WHERE email = 'your@email.com';
```

---

## 🐳 Docker Deployment

```bash
docker-compose up -d
```

This starts:
- Frontend on port 80
- Backend on port 3001
- PostgreSQL on port 5432

---

## 👥 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full system access, system settings, audit logs, all admin features |
| **Admin** | User management, app catalog, app assignments, request approvals |
| **User** | Personal dashboard, app store, request access, settings |

### Permission Slugs

| Category | Permissions |
|----------|-------------|
| **Users** | `users.view`, `users.create`, `users.edit`, `users.delete` |
| **Apps** | `apps.view`, `apps.create`, `apps.edit`, `apps.delete`, `apps.assign` |
| **Logs** | `logs.view` |
| **Settings** | `settings.view`, `settings.edit` |

---

## 📊 Database Schema

### Core Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles and status |
| `sessions` | JWT session tracking |
| `roles` | Role definitions (user, admin, super_admin) |
| `permissions` | Permission slugs |
| `role_permissions` | Role-permission mappings |
| `applications` | Personal user applications |
| `application_tiles` | Admin-managed app catalog |
| `user_app_assignments` | App assignments with PIN hash |
| `app_requests` | Store access requests |
| `pin_attempts` | Rate limiting for PIN verification |
| `audit_logs` | Action history |
| `system_settings` | System configuration |

### Key Relationships

```
users ──< sessions
users ──< applications (personal apps)
users ──< user_app_assignments >── application_tiles
users ──< app_requests >── application_tiles
users ──< pin_attempts
users ──< audit_logs
roles ──< role_permissions >── permissions
```

---

## 📚 Documentation

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/api/auth/me` | Get current user |
| `GET` | `/api/users/search` | User autocomplete search |
| `GET` | `/api/admin/apps` | List app catalog |
| `POST` | `/api/admin/assignments/users/:id` | Assign app with PIN |
| `POST` | `/api/dashboard/apps/:id/verify-pin` | PIN verification |
| `GET` | `/api/store` | Browse app store |
| `POST` | `/api/store/:id/request` | Request app access |
| `GET` | `/api/admin/requests` | List access requests |
| `POST` | `/api/admin/requests/:id/approve` | Approve request |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret key for JWT signing | ✅ Yes |
| `DB_HOST` | PostgreSQL host | ✅ Yes |
| `DB_NAME` | Database name | ✅ Yes |
| `DB_USER` | Database user | ✅ Yes |
| `DB_PASSWORD` | Database password | ✅ Yes |
| `FRONTEND_URL` | CORS allowed origin | ✅ Yes |
| `NODE_ENV` | Environment (production/development) | No |

---

## 🎯 Roadmap

### ✅ Completed (v1.0)
- [x] User authentication & authorization
- [x] Role-based access control (RBAC)
- [x] Application dashboard
- [x] App Store with request workflow
- [x] PIN authentication system
- [x] Admin user management
- [x] Audit logging
- [x] Docker deployment

### 🔄 In Progress (v1.1)
- [ ] Username autocomplete for all forms
- [ ] Email notifications for approvals
- [ ] Bulk user import

### 🚀 Planned (v2.0)
- [ ] SSO integration (SAML, OIDC)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-factor authentication (MFA)
- [ ] API rate limiting
- [ ] Webhooks for integrations

---

## 📁 Project Structure

```
otka/
├── src/                    # React frontend
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   │   └── admin/          # Admin pages
│   ├── contexts/           # React contexts (Auth, AppData)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # API client
│   └── types.ts            # TypeScript types
├── server/                 # Express backend
│   ├── routes/             # API routes (12 files)
│   ├── middleware/         # Auth & RBAC middleware
│   ├── utils/              # Utilities
│   ├── db.js               # Database connection & schema
│   └── logger.js           # Winston logger
├── deploy/                 # Deployment configs
└── docker-compose.yml      # Docker setup
```

---

## � Acknowledgments

- [React](https://reactjs.org/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library
- [Express.js](https://expressjs.com/) - Web framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Docker](https://www.docker.com/) - Containerization

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/guyyuso">guyyuso</a></p>
  <p>
    <a href="https://github.com/guyyuso/otka/issues">Report Bug</a> •
    <a href="https://github.com/guyyuso/otka/issues">Request Feature</a>
  </p>
</div>