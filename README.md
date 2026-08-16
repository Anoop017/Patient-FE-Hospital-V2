# Unified Hospital Portal

A modern, unified frontend portal serving Patients, Doctors, and Staff. Access, navigation, and features are dynamically rendered based on the logged-in user's role.

## Features

- **Unified Authentication:** A single login page that intelligently routes users to their respective dashboards based on their role (Patient, Doctor, or Staff).
- **Patient Portal:** 
  - View upcoming appointments and health summary.
  - Book new appointments.
  - Read-only access to personal medical records, prescriptions, lab tests, and hospital bed availability.
- **Doctor Portal:**
  - View today's schedule and manage pending appointments (Accept/Complete/Cancel/No Show).
  - Create and manage patient medical records, prescriptions, and lab tests.
  - Manage patient admissions and assign hospital beds.
- **Staff & Admin Portal:**
  - Complete hospital overview with quick stats.
  - View all registered patients, doctors, and system-wide appointments.
  - Manage all medical records, admissions, and bed status updates.
- **Strict Grayscale Aesthetics:** A clean, premium black-and-white UI designed with Tailwind CSS v4 and `shadcn/ui`.

## Tech Stack

- **Framework:** Next.js 16.3 (App Router)
- **Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Components:** `shadcn/ui`, `lucide-react`, Base UI
- **HTTP Client:** Axios

## Getting Started

### Prerequisites

Ensure you have Node.js installed. You will also need the backend API running locally or remotely for the portal to fetch real data.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Anoop017/Patient-FE-Hospital-V2.git
   ```

2. Navigate into the project directory:
   ```bash
   cd "FE-Patient portal"
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure environment variables:
   Create a `.env.local` file in the root directory and specify the backend API URL.
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3042/api/v1
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `app/(dashboard)`: Contains the protected route groups partitioned by role (`/patient/dashboard`, `/doctor/dashboard`, `/staff/dashboard`).
- `components/layout`: Contains the Topbar and role-aware Sidebar components.
- `components/ui`: Reusable, accessible UI components (Tables, Dialogs, Selects, Badges, etc.) built with Tailwind CSS.
- `context/AuthContext.tsx`: Manages user authentication state, role-based logic, and profile data across the portal.
- `lib/api.ts`: Axios configuration with request/response interceptors for attaching JWT tokens.
