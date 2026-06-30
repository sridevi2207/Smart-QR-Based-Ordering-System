# 🍽️ Greenet — Smart QR-Based Ordering System

A contactless, real-time restaurant ordering platform that lets customers scan a table QR code, browse the digital menu, place orders, and track preparation status — all from their own smartphone, with zero app downloads or sign-ups.

## 📌 Overview

Traditional restaurant ordering relies on waiters to relay orders to the kitchen, which leads to delays, miscommunication, and poor order tracking — especially during peak hours. **Greenet** solves this by digitizing the entire ordering workflow: each table gets a unique QR code that opens a dedicated digital menu, orders go straight to a live kitchen dashboard, and customers can track their order status in real time.

Built as a mini project for the B.Tech (Information Technology) curriculum at PSNA College of Engineering and Technology.

## ✨ Key Features

- **No app, no login** — scan the table QR code and start ordering instantly
- **Digital menu** with categories, pricing, descriptions, and prep times
- **Cart system** with add/remove/quantity controls
- **Real-time order tracking** for customers (Pending → Preparing → Ready)
- **Kitchen dashboard** showing live incoming orders with status controls
- **Admin panel** for menu management and per-table QR code generation
- **Zero dedicated hardware** — runs in any browser, on any device

## 🏗️ System Architecture

The application follows a layered architecture:

- **Presentation Layer** — Customer Interface, Kitchen Dashboard, Admin Panel (HTML, CSS, JavaScript)
- **Application Layer** — Node.js + Express.js handling business logic, order processing, and routing
- **Data Layer** — MySQL database storing menu items, orders, tables, and billing records

Customers scan a QR → access table-specific menu → place order → order is pushed to the kitchen dashboard in real time → kitchen updates status → customer sees live progress.

## 🧩 Modules

| Module | Description |
|---|---|
| Customer Interface | QR scan, digital menu, cart, order placement, order tracking |
| Order Management | Order creation, validation, status lifecycle, database storage |
| Real-Time Communication | Live sync between customer and kitchen via Socket.io |
| Kitchen Display | Centralized dashboard for managing incoming orders |
| Admin & QR Generation | Menu CRUD, table configuration, QR code generation |

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js, REST API
- **Database:** MySQL
- **Real-time updates:** Socket.io
- **IDE:** Visual Studio Code

## 🔄 Order Lifecycle

```
Pending → Preparing → Ready → Completed
```

Each transition is reflected instantly on both the customer's tracking page and the kitchen dashboard.

## 📊 Performance

- Page load / response time: **< 2 seconds**
- Order processing: **instant (real-time)**
- System reliability: **stable under continuous usage**
- Validated through unit, integration, and performance testing (all test cases passing)

## 🚀 Future Enhancements

- Online payment gateway integration
- WebSocket-based real-time updates (replacing polling)
- Analytics & reporting dashboard for order trends and peak hours
- AI-powered kitchen prep prioritization
- Multi-restaurant SaaS deployment
- Voice ordering and customer preference/allergy profile

## 📄 License

This project was developed for academic purposes as part of a mini project submission.
