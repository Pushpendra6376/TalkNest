# Backend Setup – Group Chat Application

This README explains step-by-step backend setup for the Group Chat App using Node.js, Express, MySQL, Sequelize, Socket.io, designed to run only on localhost.

---

## 🛠 Tech Stack (Backend)

* **Node.js** – Runtime
* **Express.js** – REST API framework
* **MySQL** – Database
* **Sequelize ORM** – DB modeling & queries
* **Socket.io** – Real-time chat & notifications
* **JWT** – Authentication
* **CryptoJS** – End-to-End Encryption (E2EE)
* **Multer** – Local file uploads
* **Nodemailer** – Email & OTP
* **Passport.js** – Google / GitHub OAuth

---

📁 Backend Folder Structure (High Level)

```
backend/
├── app.js
├── server.js
├── config/
├── models/
├── routes/
├── controllers/
├── services/
├── sockets/
├── middlewares/
├── utils/
└── uploads/
├── .env
├── package.json
└── README.md
```

---

## 🧩 Prerequisites

Make sure you have installed:

* Node.js (v18+ recommended)
* MySQL Server (8.x)
* npm (comes with Node)

Check versions:

```bash
node -v
npm -v
mysql --version
```

---

## ⚙️ Step 1: Initialize Backend Project

```bash
mkdir backend
cd backend
npm init -y
```

---

## 📦 Step 2: Install Required Dependencies

### Core Dependencies

```bash
npm install express mysql2 sequelize dotenv cors
```

### Authentication & Security

```bash
npm install jsonwebtoken bcryptjs crypto-js passport passport-google-oauth20 passport-github2
```

### Real-time & Communication

```bash
npm install socket.io
```

### File Upload & Email

```bash
npm install multer nodemailer
```

### Utilities

```bash
npm install uuid
```

---

## 🧪 Step 3: Install Dev Dependencies

```bash
npm install -D nodemon
```

Update `package.json`:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js"
}
```

---

## 🔐 Step 4: Environment Variables (.env)

Create `.env` file in backend root:

```
PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=group_chat_app

JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=7d

EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_app_password

GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx

GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx
```

⚠️ **Never push `.env` to GitHub**

---

## 🗄 Step 5: MySQL Database Setup

Login to MySQL:

```bash
mysql -u root -p
```

Create database:

```sql
CREATE DATABASE group_chat_app;
```

---

## 🔗 Step 6: Sequelize Connection Setup

`src/config/db.js`

```js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;
```

---

## 🚦 Step 7: Express App Setup

`src/app.js`

```js
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

module.exports = app;
```

---

## 🌐 Step 8: Server + Socket.io Setup

`src/server.js`

```js
const http = require('http');
const app = require('./app');
const sequelize = require('./config/db');
const { Server } = require('socket.io');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

sequelize.authenticate()
  .then(() => console.log('MySQL Connected'))
  .catch(err => console.error(err));

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
```

---

## ▶️ Step 9: Run Backend Server

```bash
npm run dev
```

Test in browser:

```
http://localhost:5000/
```

---

## ✅ Next Steps (Day 1 Scope)

* Sequelize Models (Users, Groups, Messages, OTP)
* Signup/Login APIs
* OTP Email Flow
* JWT Middleware

---

## 👨‍💻 Author

**Pushpendra Patel**
Backend Developer – Group Chat App Project

---

🔥 This backend is structured for scalability, security, and mentor-level evaluation.
