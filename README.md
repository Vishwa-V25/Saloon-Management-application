# Maison Aurum – Salon Management & Appointment Booking System

A full-stack MERN application designed to streamline salon operations and simplify online appointment booking. Maison Aurum provides a centralized platform for managing appointments, customers, salon services, staff, payments, expenses, and business operations.

Built with React, Node.js, Express.js, and MongoDB Atlas, the application uses JWT-based authentication, INR currency formatting, and the Asia/Kolkata timezone.

## Project Overview

Maison Aurum aims to simplify salon management by bringing essential salon operations into a single web application. It provides an intuitive interface for customers and salon owners, supported by a RESTful backend and a cloud-hosted MongoDB database.

## Key Capabilities

- **Online Appointment Booking:** Manage salon appointments and booking operations.
- **Customer Management:** Maintain customer information and appointment records.
- **Service Management:** Manage salon services and related details.
- **Staff Management:** Organize salon staff information.
- **Dashboard:** Access salon management information through a centralized dashboard.
- **Payment Management:** Handle payment-related records.
- **Expense Tracking:** Maintain salon expense records.
- **Notifications:** Support appointment and application notifications.
- **Authentication:** Secure user access using JWT-based authentication.
- **Regional Configuration:** INR currency formatting and Asia/Kolkata timezone support.

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React 18, JavaScript, HTML, CSS |
| UI & Styling | Tailwind CSS, Lucide React |
| Frontend Tooling | Vite, React Router v6 |
| API Integration | Axios, REST APIs |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| Security | Helmet, Express Rate Limit |
| Deployment | Vercel (Frontend), Render (Backend) |

## System Architecture

The application follows a client-server architecture with a cloud-hosted database.

```text
             Customer / Salon Owner
                       |
                       v
              React Frontend
                 (Vercel)
                       |
                       v
              RESTful API
             Node.js + Express
                 (Render)
                       |
                       v
               Mongoose ODM
                       |
                       v
                MongoDB Atlas
```

## Project Structure

```text
maison-aurum/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── seed/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── api/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

## Local Installation & Setup

### Prerequisites

- Node.js and npm
- MongoDB Atlas account
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/maison-aurum.git
cd maison-aurum
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` and configure the following variables:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_random_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Configure the initial owner details in the local environment before running the owner creation script.

Start the backend:

```bash
npm run dev
```

The backend runs on:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

Create a `.env` file using `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend runs on:

`http://localhost:5173`

## Sample Dataset (Optional)

The backend includes scripts for generating sample salon data for development and testing.

```bash
cd backend
npm run seed
```

To remove only seeded records:

```bash
npm run seed:clean
```

**Note:** Use a separate testing database for sample data. Do not run seed or clean scripts against a production database.

## Deployment

The application is structured for cloud deployment:

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

### Deployment Configuration

**MongoDB Atlas**
- Configure a cloud database and database user.
- Configure network access for the backend hosting environment.
- Store the database connection string securely.

**Render – Backend**
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Configure backend environment variables through the Render dashboard.

**Vercel – Frontend**
- Root Directory: `frontend`
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Configure `VITE_API_URL` with the deployed backend API URL.

## Security Considerations

- Environment variables are excluded from Git using `.gitignore`.
- Sensitive database credentials and authentication secrets should be configured through hosting environment settings.
- Passwords are handled using bcryptjs.
- JWT is used for authentication.
- Helmet and Express Rate Limit provide additional backend security protections.

## Author

**Vishwa V**

B.Tech – Information Technology | 2027 Batch

GitHub: [Vishwa-V25](https://github.com/Vishwa-V25)

---

*Maison Aurum – A MERN Stack Application for Modern Salon Management.*
