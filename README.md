# MerchantCore

A modern, responsive React dashboard application for merchant management. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Dashboard** - Real-time overview of revenue, sales, stock alerts, and critical notifications
- **Inventory Manager** - Track stock levels, SKUs, and automate reorder alerts
- **POS Terminal** - Point-of-sale system with product catalog, cart, and multi-payment support
- **Credit Ledger** - Manage customer credit accounts, payment logs, and debt aging
- **Customer Directory** - View customer profiles, purchase history, and loyalty tiers

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Icons | Lucide React |
| Linting | ESLint + typescript-eslint |

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10

### Installation

```bash
# Clone the repository
git clone https://github.com/anomalyco/merchant-core.git
cd merchant-core

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
merchant-core/
├── src/
│   ├── components/
│   │   └── layout/          # DesktopSidebar, DesktopHeader, MobileNavbar, MobileHeader
│   ├── data/
│   │   └── mockData.ts      # Mock data and TypeScript interfaces
│   ├── lib/
│   │   └── utils.ts         # Utility functions (cn helper)
│   ├── pages/
│   │   ├── dashboard/       # DashboardPage
│   │   ├── inventory/       # InventoryPage
│   │   ├── pos/             # POSPage
│   │   ├── credit/          # CreditLedgerPage
│   │   └── customers/       # CustomersPage
│   ├── App.tsx              # Main routing and layout
│   ├── index.css            # Global styles and Tailwind imports
│   └── main.tsx             # App entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Architecture

- **Mobile-first responsive design**: Desktop sidebar/header hidden on mobile; bottom tab navigation shown instead
- **Feature-based pages**: Each page is self-contained with its own components and state
- **Mock data layer**: All data flows through `mockData.ts` for easy swap to real APIs
- **Path aliases**: `@/*` maps to `src/*` for clean imports

## Design System

| Token | Value |
|-------|-------|
| Font Family | Inter (Google Fonts) |
| Primary Color | Slate 900 |
| Success | Emerald 500/600 |
| Warning | Amber 500/600 |
| Danger | Red 500/600 |
| Info | Blue 500/600 |

## License

MIT
