# 🚗 Booking Ve Thoi App

**Safe Ride Booking Application - Ứng dụng đặt xe an toàn**

A comprehensive ride booking application built with Angular featuring safe transportation services including regular rides and designated driver services.

## Features

- 🗺️ **Interactive Map Integration** - Real-time location tracking with Leaflet maps
- 🚖 **Multiple Vehicle Types** - Car and motorbike options
- 👨‍✈️ **Designated Driver Service** - Professional drivers for your vehicle
- 💳 **Multiple Payment Methods** - Cash, card, and e-wallet support
- 📱 **Real-time Notifications** - Live updates on ride status
- 🏆 **Rewards System** - Earn points for rides
- 📊 **Ride History** - Track all your past rides
- 👤 **User Profile Management** - Complete profile and settings

## 🚀 Getting Started

**Prerequisites:** Node.js (v18 or higher)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ivsjsc/booking-ve-thoi-app.git
   cd booking-ve-thoi-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## 🛠️ Tech Stack

- **Frontend:** Angular 20.3.0
- **Maps:** Leaflet with routing machine
- **Styling:** Tailwind CSS
- **Build Tool:** Angular CLI with Vite
- **Language:** TypeScript

## 📱 App Screens

- **Home:** Main booking interface
- **Map:** Interactive map with route planning
- **In-Ride:** Real-time ride tracking
- **Profile:** User profile management
- **Settings:** App configuration
- **Rewards:** Points and loyalty program
- **History:** Past ride records
- **Notifications:** Real-time updates

## 🔧 Project Structure

```
src/
├── app.component.ts          # Main app component
├── booking.service.ts        # Booking logic and API
├── auth.service.ts          # Authentication service
├── map.component.ts         # Interactive map component
├── notifications.service.ts # Push notifications
├── rewards.service.ts       # Rewards and loyalty
├── driver.service.ts        # Driver-related services
└── [other components]       # UI components
```

## ⚡ Firebase — Hosting & Analytics

This project uses Firebase for hosting (vethoi.web.app / vethoi.firebaseapp.com) and optional analytics.

Steps to setup and deploy to Firebase:

1. Install the Firebase SDK (we added it to `package.json` as `firebase`) and optionally the CLI:

```pwsh
npm install
npm install -g firebase-tools   # optional: for deploy via CLI
```

2. Initialize Firebase locally (choose the existing project `ivs-159a7` or the `vethoi` hosting site):

```pwsh
firebase login
firebase init hosting
# choose project -> ivs-159a7, set public directory to `dist`, and configure as a single-page app
```

3. Build and deploy (recommended: build into `dist`):

```pwsh
npm run build
firebase deploy --only hosting

To deploy specifically to the `vethoi` site (instead of the default site for your project), use:

```pwsh
firebase deploy --only hosting:vethoi
```

If `firebase.json` has `public: public`, you can copy `dist` contents into `public` before deploy. Example:

```pwsh
Remove-Item -Recurse -Force public
Copy-Item -Path dist -Destination public -Recurse
firebase deploy --only hosting
```
```

4. The app will be published to:

- https://vethoi.web.app
- https://vethoi.firebaseapp.com

Note: We added `src/firebase.ts` and `src/environments/firebaseConfig.ts` to initialize the Firebase app at runtime — this uses the modern modular Firebase SDK and safe-guards analytics initialization so it runs only in the browser.

## 🔐 Secrets & environment variables

To protect keys/secrets:

- Never commit `.env`, secret JSONs (service account files), or private keys to the repo. Add them to `.gitignore`.
- We include a `.env.example` in this repository to show which variables are required — copy it to `.env` and fill with real values.
- Example env variables you should set locally: `FIREBASE_API_KEY`, `GOOGLE_MAPS_API_KEY`, `STRIPE_SECRET_KEY`, and `ADMIN_SERVICE_ACCOUNT_PATH`.

If you want to move firebase config into env vars, update `src/environments/firebaseConfig.ts` to read from env (or `import.meta.env` for Vite) and add your `.env` values to your local environment.
