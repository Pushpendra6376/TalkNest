# 🎨 Frontend Setup – Group Chat Application

This README explains **complete frontend setup from scratch** for the Group Chat App using **React.js + Tailwind CSS + Socket.io + WebRTC (PeerJS)**. The frontend is designed to work with the previously defined backend on **localhost**.

---

## 🛠 Tech Stack (Frontend)

* **React.js (Vite)** – UI framework
* **Tailwind CSS** – Styling
* **Lucide-react** – Icons
* **Socket.io-client** – Real-time chat
* **Axios** – API calls
* **CryptoJS** – Client-side encryption (E2EE)
* **PeerJS** – Audio/Video calling (WebRTC)

---

## 📁 Frontend Folder Structure (High Level)

```
frontend/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── context/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── styles/
│   └── constants/
├── index.html
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── README.md
```

---

## 🧩 Prerequisites

Ensure you have:

* **Node.js (v18+)**
* **npm**

Check:

```bash
node -v
npm -v
```

---

## ⚙️ Step 1: Create React App (Vite)

```bash
npm create vite@latest frontend
```

Choose options:

```
✔ Project name: frontend
✔ Framework: React
✔ Variant: JavaScript
```

Then:

```bash
cd frontend
npm install
```

---

## 📦 Step 2: Install Required Dependencies

### Core Dependencies

```bash
npm install axios socket.io-client crypto-js peerjs lucide-react
```

### Routing (optional but recommended)

```bash
npm install react-router-dom
```

---

## 🎨 Step 3: Setup Tailwind CSS

Install Tailwind:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configure `tailwind.config.js`

```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Update `src/styles/tailwind.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Import Tailwind in `main.jsx`:

```js
import './styles/tailwind.css';
```

---

## 🌐 Step 4: Environment Variables

Create `.env` file in frontend root:

```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_PEER_HOST=localhost
VITE_PEER_PORT=3001
```

⚠️ Prefix with `VITE_` is mandatory

---

## 🔗 Step 5: Axios API Instance

`src/services/api.js`

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true
});

export default api;
```

---

## 🔌 Step 6: Socket.io Client Setup

`src/context/SocketContext.jsx`

```js
import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
    return () => socketRef.current.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
```

---

## 🔐 Step 7: Client-side Encryption Utils (E2EE)

`src/utils/encrypt.js`

```js
import CryptoJS from 'crypto-js';

export const encryptMessage = (message, key) => {
  return CryptoJS.AES.encrypt(message, key).toString();
};
```

`src/utils/decrypt.js`

```js
import CryptoJS from 'crypto-js';

export const decryptMessage = (cipher, key) => {
  const bytes = CryptoJS.AES.decrypt(cipher, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};
```

---

## 📞 Step 8: PeerJS Setup (WebRTC)

`src/hooks/usePeer.js`

```js
import Peer from 'peerjs';
import { useEffect, useRef } from 'react';

export const usePeer = (userId) => {
  const peerRef = useRef(null);

  useEffect(() => {
    peerRef.current = new Peer(userId, {
      host: import.meta.env.VITE_PEER_HOST,
      port: import.meta.env.VITE_PEER_PORT,
      path: '/peerjs'
    });

    return () => peerRef.current.destroy();
  }, [userId]);

  return peerRef.current;
};
```

---

## ▶️ Step 9: Run Frontend Server

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

## ✅ Next Steps (Frontend – Day 1)

* Auth pages (Login / Signup)
* AuthContext & Protected Routes
* API integration with backend
* Basic Dashboard layout

---

## 👨‍💻 Author

**Pushpendra Patel**
Frontend – Group Chat App

---

🔥 This frontend setup is **production-aligned, scalable, and mentor-ready**.
