# activity-tracker-frontend

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white&style=flat-square)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white&style=flat-square)

Frontend for an AI-powered real-time activity monitoring system. Captures webcam frames at a fixed interval, dispatches them to a FastAPI inference backend, and renders the resulting activity descriptions on a live dashboard.

**Live:** [activity-tracker-frontend-eta.vercel.app](https://activity-tracker-frontend-eta.vercel.app) &nbsp;|&nbsp; **Backend:** [activity-tracker-backend](https://github.com/arham213/activity-tracker-backend)

---

<!-- Add a screenshot or GIF of the app here -->
<!-- ![Dashboard Preview](./docs/screenshot.png) -->

## How It Works

1. User initiates a session — browser MediaDevices API activates the webcam stream
2. A frame is captured every 10 seconds and dispatched to the FastAPI backend
3. Backend runs inference via Hugging Face image-to-text models
4. The generated activity caption is returned and rendered on the dashboard in real time
5. All frames, captions, and timestamps are logged for session review

---

## Features

- Live webcam streaming via browser MediaDevices API
- Periodic frame capture and backend dispatch every 10 seconds
- Real-time activity caption rendering on a live dashboard
- Session controls — start, pause, stop
- Session logs with image previews, captions, statistics, and history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React, TypeScript |
| Build | Vite |
| Inference | Hugging Face API (via backend) |
| Deployment | Vercel |

---

## Local Setup

### Prerequisites
- Node.js 18+
- [activity-tracker-backend](https://github.com/arham213/activity-tracker-backend) running locally or remotely *(required — must be running before starting the frontend)*

```bash
git clone https://github.com/arham213/activity-tracker-frontend.git
cd activity-tracker-frontend
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_BASE_URL=your_backend_url
```

```bash
npm run dev
```

See the [backend README](https://github.com/arham213/activity-tracker-backend#readme) for full backend setup instructions.

---

[LinkedIn](https://linkedin.com/in/arhamasjid) · arhamasjid213@gmail.com
