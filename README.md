# 🚀 RealTime Chat

A lightning-fast, modern real-time chat application built with cutting-edge web technologies. Experience seamless communication with instant messaging, robust authentication, and a sleek responsive interface.

## ✨ Features

### 🔥 Core Features
- **Real-time messaging** - Instant communication powered by Socket.IO
- **JWT Authentication** - Secure user registration and login system
- **Persistent chat history** - Never lose a conversation with MongoDB storage
- **Responsive design** - Beautiful UI that works on all devices
- **User management** - Complete registration and authentication flow

### 🛠 Tech Stack

```
Frontend  │ React, Socket.IO Client
Backend   │ Node.js, Express.js, Socket.IO
Database  │ MongoDB
Auth      │ JSON Web Tokens (JWT)
```

## 🎯 Planned Features

- [ ] **Message Management**
  - Edit messages in real-time
  - Delete messages with confirmation
  - Message threading support

- [ ] **Admin Dashboard**
  - User management panel
  - Chat moderation tools
  - Analytics and insights

- [ ] **Enhanced UX**
  - Read receipts for messages
  - Push notifications
  - Typing indicators
  - Enhanced responsive design

- [ ] **Advanced Features**
  - File sharing capabilities
  - Emoji reactions
  - Dark/light theme toggle

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "REAL TIME CHAT APP"
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` in the backend directory:
   ```env
   JWT_SECRET=your-super-secret-jwt-key
   ```

4. **Start the application**
   ```bash
   # Terminal 1 - Backend server
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend development server
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3000`


## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login



## 🎨 UI Features

- **Clean, minimal interface** inspired by modern chat applications
- **Responsive design** that adapts to desktop, tablet, and mobile
- **Real-time updates** with smooth animations
- **Intuitive user experience** with clear visual feedback

## 🧪 Development

### Available Scripts

**Backend:**
- `npm run dev` - Start development server with nodemon


**Frontend:**
- `npm run dev` - Start development server
- `npm build` - Create production build


## 🚦 Status

- ✅ Real-time messaging
- ✅ User authentication
- ✅ Message persistence
- ✅ Responsive UI
- 🚧 Message editing/deletion
- 🚧 Admin panel
- 🚧 Read receipts
- 🚧 Enhanced notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.IO team for real-time communication
- MongoDB team for robust data storage
- React community for the amazing frontend framework

---

<div align="center">
  <strong>Built with ❤️ and lots of ☕</strong>
</div>
