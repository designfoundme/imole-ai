# Imole AI - AI-Powered Teleradiology Platform

Imole AI is a modern React-based frontend application for teleradiology services, enabling secure medical imaging review and reporting with AI assistance.

## Features

- **User Authentication** - Multi-role support (Admin, Diagnostic Center, Radiologist)
- **DICOM Viewer** - Specialized viewer for medical imaging
- **Report Generation** - AI-assisted diagnostic reporting with PDF export
- **Case Management** - Complete workflow from upload to reporting
- **Dashboard** - Real-time metrics and case tracking
- **Secure File Upload** - DICOM file upload with validation

## Tech Stack

- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development
- **Vite** - Next-generation frontend tooling
- **TailwindCSS** - Utility-first CSS framework
- **React Hook Form** - Efficient form management
- **Shadcn/ui** - High-quality UI components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

### Build for Production

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Environment Configuration

Create environment files for different deployments:

- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment

See `.env.example` for available variables.

## Project Structure

```
src/
├── components/      # UI components
│   └── ui/         # Shadcn UI components
├── sections/       # Page sections
├── hooks/          # Custom React hooks
├── types/          # TypeScript types
└── lib/            # Utilities
```

## Test Credentials

- **Admin**: `admin@imole.ai` / `password`
- **Diagnostic Center**: `center@imole.ai` / `password`
- **Radiologist**: `radio@imole.ai` / `password`

## Documentation

See [IMOLE_AI_DEPLOYMENT_GUIDE.md](../IMOLE_AI_DEPLOYMENT_GUIDE.md) for deployment instructions.

## License

Proprietary - Health Intelligence Labs
