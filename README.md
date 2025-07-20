# React + Vite + Tailwind CSS App

## Description

A responsive and secure web application for managing employee attendance and production reports. Built with React, Vite, Tailwind CSS, and integrated with Firebase for backend services including authentication and data storage.

## Features

- 🔐 Login/Signup system with Firebase Authentication
- 📊 Attendance tracking system (punch in/out)
- 🧑‍💼 Admin dashboard to view and manage attendance reports
- ⚙️ Firebase Firestore integration
- 📈 Production report pages
- 🎨 Responsive UI using Tailwind CSS
- 📂 Modular file structure with reusable components/hooks

## Installation

```bash
git clone <your-repo-url>
cd your-project-folder
npm install
```

## Usage

```bash
npm run dev
```

Visit: `http://localhost:5173`

## Build for Production

```bash
npm run build
```

Output will be in the `/dist` folder.

## Deployment

- GitHub Pages: Push the `/dist` content to a `gh-pages` branch.
- Netlify: Connect your repo and configure build as `npm run build` and publish directory as `dist`.
- GoDaddy: Upload `dist` content via FTP or file manager.

## Folder Highlights

| Folder            | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `src/components/` | Reusable UI components                     |
| `src/hooks/`      | Custom React hooks (Firebase, Auth, etc.)  |
| `src/pages/`      | Main page logic for attendance, auth, etc. |
| `src/screens/`    | User and admin dashboards                  |
| `src/constant/`   | Static data and constants                  |
| `public/`         | Static files and redirects                 |

## Authors

Developed by Swift ProSys Pvt. Ltd.

## License

MIT License
