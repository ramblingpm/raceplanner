# Race Planner

A cycling race time calculator that helps you plan your race strategy. Calculate finish times and required speeds based on race distance and your goals.

## 🚀 Build in Public

This project is being built in public! Follow along with the development process.

## 🛠️ Tech Stack

- **Frontend**: Next.js (TypeScript)
- **Backend**: Node.js + Express (TypeScript)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (Frontend)
- **Code Quality**: ESLint + Prettier

## 📋 Features (MVP)

- ✅ Secure user authentication (signup/login/logout)
- ✅ View race map
- ✅ Enter planned start time
- ✅ Enter estimated race time
- ✅ Calculate finish time and required speed
- ✅ Mobile-friendly interface

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd raceplanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` with your Supabase credentials:
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Copy your project URL and anon key from Settings > API

4. **Run the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 📁 Project Structure

```
raceplanner/
├── frontend/          # Next.js TypeScript frontend
├── backend/           # Express TypeScript API
├── .env.example       # Environment variables template
├── .gitignore         # Git ignore rules
└── package.json       # Root workspace configuration
```

## 🔒 Security

**IMPORTANT**: Never commit `.env` files or secrets to the repository. Always use `.env.example` as a template.

## 📱 Mobile First

This app is designed mobile-first to provide the best experience for cyclists on the go.

## 🧮 Calculation Logic

- All distances are in kilometres
- All time calculations use seconds internally
- Speed is calculated as km/h

## 📝 License

MIT
