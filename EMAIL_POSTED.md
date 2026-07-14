# Email Posted — Bulk Email Platform

A modern, full-featured bulk email sending platform with a responsive UI and powerful campaign management features.

---

## Features

- **Secure Authentication** — User registration and login with JWT tokens
- **Bulk Email Sending** — Send emails to multiple recipients using your own SMTP accounts
- **Rich Text Editor** — Create beautiful emails with a WYSIWYG editor
- **Contact Management** — Organize contacts into lists, import CSV files
- **Analytics** — Track open rates, click rates, and campaign performance
- **Email Templates** — Create and reuse email templates
- **Responsive Design** — Mobile-first design that works on all devices
- **Secure Credential Storage** — Encrypted storage of SMTP credentials (AES-256-GCM)
- **Scheduling** — Schedule campaigns for later sending
- **Image Upload** — Upload and manage images for your emails

---

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- React Router for navigation
- React Quill for rich text editing
- Recharts for analytics visualization
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- SQLite database (easily upgradeable to MySQL/PostgreSQL)
- Nodemailer for email sending
- JWT for authentication
- AES-256-GCM encryption for sensitive data

---

## Project Structure

```
email_posted/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service
│   │   └── App.tsx         # Main app component
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── database/       # Database setup
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   └── package.json
└── package.json            # Root package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd email_posted
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   Create `server/.env` file:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your-secret-key-change-in-production
   ENCRYPTION_KEY=your-encryption-key-change-in-production
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend development server on `http://localhost:3000`

5. **Open your browser**
   Navigate to `http://localhost:3000` and create an account.

---

## Usage Guide

### 1. Create an Account
- Register a new account or log in with existing credentials

### 2. Add Email Account
- Go to "Email Accounts" and add your SMTP credentials
- For Gmail, you may need to use an "App Password"
- Common SMTP providers are pre-configured for quick setup

### 3. Import Contacts
- Go to "Contacts" and create a contact list
- Add contacts manually or import from CSV
- CSV format: `email,first_name,last_name,company`

### 4. Create Campaign
- Go to "Campaigns" and click "New Campaign"
- Write your email using the rich text editor
- Select contact lists to send to
- Preview on desktop and mobile
- Save as draft or send immediately

### 5. View Analytics
- Go to "Analytics" to see campaign performance
- Track opens, clicks, and engagement rates

---

## Admin Panel (User Management)

- **Admin URL**: `/admin/users`
- **Bootstrap rule**: the **first registered user** becomes an **admin** automatically.
- Admins can **list users**, **create users**, **grant/remove admin**, and **delete users**.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start both backend and frontend in development mode |
| `npm run dev:server` | Start backend only |
| `npm run dev:client` | Start frontend only |
| `npm run build` | Build both backend and frontend |
| `npm run build:server` | Build backend only |
| `npm run build:client` | Build frontend only |
| `npm run install:all` | Install dependencies for root, server, and client |

---

## Security Notes

- SMTP credentials are encrypted using **AES-256-GCM**.
- Authentication is handled via **JWT tokens**.
- Always change `JWT_SECRET` and `ENCRYPTION_KEY` in production.
- Never commit `.env` files to version control.

---

## Deployment

The project includes deployment documentation:
- `LOCAL_DEPLOYMENT.md` — Local deployment guide
- `QUICKSTART.md` — Quick start guide
- Bluehost deployment instructions are available in the README.

---

## License

MIT
