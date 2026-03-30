# RV2Class - Professional English Tutoring Platform

RV2Class is a specialized web application for professional English tutors, designed to facilitate 1-on-1 lessons with integrated homework management and a seamless transition to video conferencing via Zoom.

## 🚀 Features

- **Teacher Dashboard**: Manage students, start lessons, and review homework.
- **Student Dashboard**: Access personalized welcome pages with "Join Lesson" and "Homeworks" buttons.
- **Zoom Integration**: Dynamic redirection to the appropriate Zoom classroom for each teacher.
- **Homework System**: Built-in system for students to complete and submit homework, and for teachers to mark them.
- **Firebase Backend**: Real-time data synchronization using Google Firebase.

## 🛠️ Local Development

### Prerequisites
- Node.js (v18 or later recommended)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   - **Teacher View**: [http://localhost:3000](http://localhost:3000)
   - **Student View**: [http://localhost:3000/student/[STUDENT_ID]](http://localhost:3000/student/[STUDENT_ID])

## 📂 Project Structure

- `app/`: Next.js pages and API routes.
- `components/`: Reusable React components.
- `lib/`: Firebase configuration and utility functions.
- `public/`: Static assets.
- `scripts/`: Utility scripts for maintenance and data management.

## 📝 Configuration

The application uses Firebase for data persistence. Configuration is located in `firebase_config.js`.

---

*Note: All legacy video infrastructure (BBB, Jitsi, LiveKit) has been removed in favor of direct Zoom integration.*
