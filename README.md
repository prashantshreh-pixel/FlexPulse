# FlexPulse Workout Tracker 🚀

![Workout Tracker Demo](./workout.gif)

FlexPulse is a modern, aesthetics-first workout tracking OS built with React, Vite, and TailwindCSS. It focuses on performance, local-first data persistence, and beautiful UI/UX, featuring custom CSS animations, rich data visualisations, and dynamic state management.

## 🌟 Key Features

- **Local-First Architecture:** All data (sessions, PRs, routines) persists instantly to `localStorage`. No accounts, no loading spinners, no backend delays.
- **Dynamic Live Workout Tracking:** Track your weights, reps, and RPE (Rate of Perceived Exertion) with automatic PR detection. Includes built-in rest timers with SVG progress rings.
- **Custom Routine Builder:** Pick from standard programs (PPL, Arnold Split) or build complex custom routines from scratch.
- **Rich Exercise Library:** 50+ exercises categorized by muscle group and type, featuring step-by-step instructions, form cues, common mistakes, and CSS-based movement animations.
- **Smart Dashboard:** View your lifetime stats, PRs, and explore deep-dive "Training Tips" panels right from the home screen.
- **Universal Unit Toggle:** Seamlessly switch between LBS and KG. Data is securely stored in a normalized format and converted on-the-fly.

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler:** Vite
- **Styling:** TailwindCSS 4 + Custom CSS keyframe animations
- **Icons:** Lucide React
- **State Management:** React Hooks (`useState`, `useEffect`) + `localStorage`

## 🚀 Getting Started

Follow these instructions to get FlexPulse running on your local machine.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/flexpulse.git
   cd flexpulse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: This project does not require any `.env` variables or API keys. Everything runs locally in the browser!)*

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000` to start tracking your gains!

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
```

This will generate a `dist` folder containing the minified and optimized static assets, ready to be deployed to Vercel, Netlify, or any static host.

## 🎨 Design Philosophy

FlexPulse abandons the generic "dashboard" look in favor of a brutalist, high-contrast, premium aesthetic. We use:
- **Oswald & Space Mono:** For typography that feels heavy, structured, and gym-ready.
- **Micro-animations:** Custom CSS keyframes to simulate exercise movements and celebrate PRs with slide-in toasts and glowing effects.
- **High Contrast:** Deep blacks, off-whites, and striking safety-orange accents to maintain focus.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
