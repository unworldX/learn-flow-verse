# StudentLib - Student Library Management System

A modern, full-featured student library platform built with React, TypeScript, and Supabase.

## 🚀 Features

- **📚 Resource Sharing** - Upload, download, and share educational materials
- **💬 Real-time Chat** - Direct messaging and group conversations
- **🤖 AI Assistant** - Integrated AI chat with multiple provider support (OpenAI, Anthropic, Google, OpenRouter)
- **📝 Note Taking** - Rich text editor with markdown support
- **🎯 Study Groups** - Collaborative learning spaces
- **🗓️ Reminders** - Never miss assignments or study sessions
- **📊 Forums** - Community discussions and Q&A
- **⚡ Optimized Performance** - Intelligent caching and RLS-optimized database queries

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **State Management**: Zustand, React Query
- **Rich Text**: TipTap Editor
- **PDF Viewing**: React-PDF
- **Diagrams**: Mermaid, TLDraw

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed ([Download](https://nodejs.org/))
- npm or bun package manager
- A Supabase account ([Sign up free](https://supabase.com))
- Git installed

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/GURSHARN219/library.git
cd library
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Set Up Environment Variables

**IMPORTANT**: Never commit `.env` or `.env.local` to git!

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual Supabase credentials
```

Your `.env.local` should look like this:

```bash
# Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api

VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key-here"
VITE_SUPABASE_ANON_KEY="your-anon-key-here"
```

### 4. Set Up Supabase Database

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_ID

# Run migrations
supabase db push --include-all
```

This will create all necessary tables, RLS policies, and functions.

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## 🏗️ Build for Production

```bash
# Build web version
npm run build

# Build Electron desktop app (Windows)
npm run build:electron:win

# Preview production build
npm run preview
```

## 📁 Project Structure

```
library/
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Supabase client and types
│   ├── lib/              # Utility functions
│   ├── pages/            # Page components
│   ├── routes/           # React Router configuration
│   └── types/            # TypeScript type definitions
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
├── public/               # Static assets
└── electron/            # Electron app files
```

## 🔐 Security Notes

### Environment Variables

- ✅ **Safe to expose** (VITE_ prefix): Anon key, Project URL
- ❌ **NEVER expose**: Service role key, passwords, tokens

### What NOT to put in .env

```bash
# ❌ NEVER EXPOSE THESE TO FRONTEND:
VITE_SUPABASE_SERVICE_ROLE_KEY  # Admin access - backend only!
VITE_SUPABASE_EMAIL             # Don't hardcode credentials
VITE_SUPABASE_PASSWORD          # NEVER store passwords
TOKEN                           # Obtained at runtime
```

See [SECURITY_FIXES_URGENT.md](SECURITY_FIXES_URGENT.md) for detailed security guidance.

## 🧪 Testing

```bash
# Run unit tests (setup in progress)
npm run test

# Run linter
npm run lint
```

## 📚 Available Scripts

```json
{
  "dev": "Start development server",
  "build": "Build for production",
  "preview": "Preview production build",
  "lint": "Run ESLint",
  "build:electron:win": "Build Windows desktop app",
  "supabase:keys": "Print Supabase configuration"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### "406 Not Acceptable" errors

Clear browser cache and local storage:
```javascript
// In DevTools Console:
localStorage.clear();
location.reload();
```

### "Invalid API key" errors

1. Verify your `.env.local` has the correct keys
2. Restart the development server
3. Check Supabase dashboard for key validity

### Database connection issues

```bash
# Reset local database
supabase db reset

# Re-run migrations
supabase db push --include-all
```

## 📖 Documentation

All detailed documentation has been organized in the `docs/` folder:

### 🔒 Security & Setup

- [START_HERE_SECURITY.md](docs/START_HERE_SECURITY.md) - **Read this first!** Critical security checklist
- [SECURITY_FIXES_URGENT.md](docs/SECURITY_FIXES_URGENT.md) - Step-by-step security guide
- [QUICK_START_ENV.md](docs/QUICK_START_ENV.md) - 10-minute environment setup
- [ENVIRONMENT_SECURITY_SUMMARY.md](docs/ENVIRONMENT_SECURITY_SUMMARY.md) - Security overview

### 🚀 Production & Deployment

- [PRODUCTION_READINESS_ASSESSMENT.md](docs/PRODUCTION_READINESS_ASSESSMENT.md) - Comprehensive production checklist
- [DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md) - Pre-deployment verification

### 🗄️ Database & Backend

- [MIGRATION_SUCCESS.md](docs/MIGRATION_SUCCESS.md) - Database migration history
- [RLS_FIXES_SUMMARY.md](docs/RLS_FIXES_SUMMARY.md) - Row-level security improvements
- [SUPABASE_OPTIMIZATION.md](docs/SUPABASE_OPTIMIZATION.md) - Performance optimization guide
- [SUPABASE_CONFIG.md](docs/SUPABASE_CONFIG.md) - Supabase configuration reference

### 🎨 Frontend & Features

- [FRONTEND_RLS_IMPROVEMENTS.md](docs/FRONTEND_RLS_IMPROVEMENTS.md) - Frontend database integration
- [CONVERSATIONS_MIGRATION.md](docs/CONVERSATIONS_MIGRATION.md) - Chat system architecture
- [INVITE_LINKS_FEATURE.md](docs/INVITE_LINKS_FEATURE.md) - Invite links implementation

### 🐛 Issue Resolution

- [FIX_403_FORUMS_RESOURCES.md](docs/FIX_403_FORUMS_RESOURCES.md) - Fix 403 permission errors
- [FIX_406_ERRORS.md](docs/FIX_406_ERRORS.md) - Fix 406 API errors
- [QUICK_START_406_FIX.md](docs/QUICK_START_406_FIX.md) - Quick 406 error resolution

### 📊 Architecture & Planning

- [ARCHITECTURE_DIAGRAM.md](docs/ARCHITECTURE_DIAGRAM.md) - System architecture overview
- [SCHEMA_ANALYSIS.md](docs/SCHEMA_ANALYSIS.md) - Database schema documentation
- [IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) - Feature implementation tracker

## 💡 AI Assistant Setup

To use the AI chat feature:

1. Go to Settings → AI
2. Configure your preferred AI provider (OpenAI, Anthropic, Google, or OpenRouter)
3. Add your API key
4. Select a model
5. Start chatting!

API keys are encrypted and stored securely in your Supabase database.

## 🌟 Features in Development

- [ ] Unit and E2E testing suite
- [ ] CI/CD pipeline
- [ ] Error monitoring integration
- [ ] Performance optimizations (lazy loading)
- [ ] Mobile app (Capacitor)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/GURSHARN219/library/issues)
- **Email**: <allwork.gursharn@gmail.com>

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) for the incredible backend platform
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- All open-source contributors

---

Built with ❤️ by GURSHARN219
