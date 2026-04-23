# Curry & Burger (C&B) Manager 🍔🥘

A professional-grade, real-time Restaurant Point-of-Sale (POS) ecosystem designed for high-performance hospitality environments. Built with a focus on speed, reliability, and intelligent business insights.

---

## 🚀 Vision
The C&B Manager is more than just a POS. It is a unified ecosystem that synchronizes every corner of the restaurant—from the Waiter taking the order to the Kitchen preparing the food, and the Manager analyzing the revenue.

## ✨ Key Features

### 🏛️ Unified Role-Based Access
- **Waiter View**: Intuitive table map, dynamic menu selection, and real-time cart management.
- **Kitchen View**: High-contrast, touch-optimized ticket system with "Pronto" (Ready) alerts.
- **Desk Dashboard**: Financial oversight, payment processing, and live table status monitoring.
- **Asporto Display**: Public-facing queue management for takeaway customers.
- **Admin Panel**: Full control over rooms, table layouts, menu items, and pricing.

### 🧠 C&B AI Assistant (Powered by Groq)
- **Real-time Analytics**: Instant insights into today's revenue and top-performing items.
- **Staff Support**: Answers operational questions and suggests upselling strategies.
- **Business Intelligence**: Context-aware assistance using live order data.

### ⚡ Real-Time Operations
- **Instant Sync**: Powered by Supabase Realtime, every status change (New Order, Preparing, Ready, Served) is reflected on all devices in milliseconds.
- **Push Notifications**: Waiters are instantly notified when the Kitchen marks an order as ready.

---

## 🛠️ Technology Stack
- **Framework**: [React Native](https://reactnative.dev/) with [Expo SDK 54](https://expo.dev/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (Next-generation file-based routing)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL + Realtime + Auth)
- **AI Engine**: [Groq](https://groq.com/) (Llama 3.3 70B Versatile)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Secure Data**: [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/secure-store/)

---

## 🔧 Bug Fixes & Refinement
The following optimizations have been implemented for production readiness:
- **Architecture Stability**: Resolved `folly` header conflicts in Xcode by optimizing the architecture for iOS builds.
- **Dependency Alignment**: Fixed version mismatches in `expo-device` and `expo-linking` for SDK 54 compatibility.
- **Database Resilience**: Implemented a "Clean Reset" schema with robust `DROP` and `CASCADE` logic to ensure zero-conflict deployments.
- **UI/UX Polish**: Added spring-based micro-animations for interactive elements.

---

## 👨‍💻 Credits
This ecosystem was architected and developed by:
- **Eiden / Farooq**

---

## 📜 License
Private Project for Curry & Burger. All rights reserved.
