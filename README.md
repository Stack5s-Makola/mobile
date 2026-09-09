# Makola Mobile

React Native (Expo) app for Buyer and Seller experiences.

## Folder Structure

```
mobile/
├── App.tsx                     # Entry point: wraps AuthProvider + NavigationContainer
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx     # Switches between Auth/Buyer/Seller (Step 4)
│   │   ├── AuthNavigator.tsx     # Register → OTP → Role select (Step 3)
│   │   ├── BuyerNavigator.tsx    # Buyer tab bar
│   │   └── SellerNavigator.tsx   # Seller tab bar — Daniel's territory
│   ├── screens/
│   │   ├── onboarding/
│   │   ├── auth/
│   │   ├── buyer/
│   │   └── seller/
│   ├── components/               # Shared, presentational, prop-driven
│   ├── services/
│   │   ├── api/                  # Real backend calls (NestJS on Render)
│   │   └── mocks/                # Mocked data until Promise's endpoints are live
│   ├── context/
│   │   └── AuthContext.tsx       # user, role, isOnboarded
│   ├── constants/
│   ├── types/
│   │   ├── user.ts
│   │   └── api.ts                # ApiResponse<T> = { success, message, data }
│   └── utils/
└── assets/
```

## Key decisions

- **Mock-first:** Every service in `src/services/mocks` returns the same
  `ApiResponse<T>` shape the real API uses, so swapping in Promise's
  endpoints later only means changing an import, not rewriting screens.
- **Role-based nav is a locked skeleton:** `RootNavigator` /
  `SellerNavigator` are the coordination point with Daniel's
  seller-experience work. Changes to these files go through review, not
  silent edits.
- **Path aliases** (`@navigation/*`, `@screens/*`, etc.) are set up in
  `tsconfig.json` — keeps imports short and stable if files move.

## Setup

```bash
npm install
cp .env.example .env
npx expo start
```

## Branching (per github-rules.md)

This scaffold should be its own PR: `feat/mobile-project-setup`.

