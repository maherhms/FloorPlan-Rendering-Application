# Raumorph – AI-Powered Interior Visualization

A modern web application that allows users to upload 2D floor plans and generate photorealistic 3D room renders. This project demonstrates a fully interactive UI, reusable components, and integration with backend services.

![Project Screenshot](./screenshot.png) coming! <!-- Replace with your own screenshot -->

---

## Update log 0.6.3
### New Features

Image hosting and upload with automatic hosting setup, multi-format handling, and PNG rendering for certain images.
Save projects from uploads; Home displays saved projects with dynamic timestamps and thumbnails.
Visualizer accepts routed project state and shows project title and source image.
Expanded public types/interfaces for components and hosting APIs.
### Updates
Added Key "Functionalities" section to README.
Package version updates for routing libraries.

## Update log 0.5.6
### New Features
Drag-and-drop and click-to-upload interface for floor plan images (JPG/PNG, 10 MB) with upload progress and completion flow
New visualizer view to process/display uploaded floor plans via a navigation-based upload flow
### Updates
Added application-wide constants for timing, UI, and rendering settings

---

## 🔗 Live Demo

<!-- Optional: Add if you deploy it somewhere -->
[Live Demo](#) coming!
---

## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend / API:** Serverless functions, AI image processing
- **State Management:** React Hooks, Context API
- **Styling & Components:** Reusable component architecture, responsive design

---
## ⚡ Key Functionalities

![functionality diagram.jpeg](public/functionality%20diagram.jpeg)

## ⚡ Key Features

- Upload 2D floor plans and generate AI-based 3D renders
- Responsive user interface with Tailwind CSS
- Reusable components with type-safe props (TypeScript)
- User authentication and session management
- Interactive before/after image comparisons
- Project gallery and download functionality

---

## 📁 Project Structure

```
src/
├─ components/           # Reusable UI components (buttons, modals, cards)
├─ context/              # Authentication and global state
├─ hooks/                # Custom React hooks
├─ pages/                # Route components (Dashboard, Upload, Gallery)
├─ services/             # API and backend integrations
└─ styles/               # Tailwind and custom styles
```

---

## 🚀 Installation & Setup

1. Clone the repository:

```bash
git clone https://github.com/maherhms/FloorPlan-Rendering-Application.git
cd FloorPlan-Rendering-Application
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```
---

## 📌 References

- Original GitHub repository: [Adrian Hajdin – Roomify](https://github.com/adrianhajdin/roomify)
- YouTube Tutorial: [JavaScript Mastery – Roomify Tutorial](https://www.youtube.com/watch?v=JiwTGGGIhDs&t=2179s)

---

## 📖 Notes

This project is part of my portfolio to showcase hands-on experience with modern web technologies, React patterns, and TypeScript best practices.
