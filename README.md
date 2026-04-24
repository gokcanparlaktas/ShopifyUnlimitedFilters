# 🚀 Unlimited Filters (Shopify App)

Unlimited Filters is a custom Shopify application designed to overcome the limitations of the Storefront API by providing a fully dynamic and configurable filtering system for collection pages.

## ✨ Overview

This project started as an attempt to bypass filtering limitations in Shopify’s Storefront API using Liquid. It has since evolved into a reusable and scalable Shopify app with a dedicated admin panel, backend API, and dynamic storefront integration.

---

![Demo](assets/demo-2.gif)
![AdminPanel](assets/demo.gif)

## 🧩 Features

### 🔧 Admin Panel (Shopify Embedded App)

- Manage filters directly inside Shopify Admin
- Select, sort, and configure:
  - Standard filters
  - Metafield-based custom filters
- Drag-and-drop support for reordering filters
- Session token validation for secure access
- Real-time configuration updates reflected in storefront

#### Configurable UI Options:

- Accordion (open/closed by default)
- Search input toggle
- Sorting options
- Grid column layout

---

### ⚙️ Backend (Node.js API)

- Built with **Node.js**
- Stores app settings using **Shopify Metafields**
- Provides controlled data flow between:
  - Shopify Admin
  - Storefront

- Deployed on **Vercel**

---

### 🛍️ Storefront Integration

- Fetches products via **Shopify Storefront API**
- Dynamically generates filters based on product data
- Supports:
  - 🔍 Search
  - ↕️ Sorting
  - 🎚️ Range filters
  - ✅ Boolean filters
  - 🔘 Multi-select filters

---

### 🧱 Custom Product Grid

- Fully custom-built product listing system
- Works seamlessly with filtering logic
- Planned improvements:
  - Multiple card designs
  - Flexible layout options

---

## 🏗️ Architecture

```
Shopify Admin (Embedded App)
        ↓
   Node.js Backend (API)
        ↓
Shopify Metafields (Storage)
        ↓
Storefront (Dynamic Filters + Product Grid)
```

---

## 🔐 Security

- Session token validation implemented in admin panel
- API access restricted to authenticated Shopify sessions
- Sensitive keys managed via environment variables

---

## ⚡ Tech Stack

- **Frontend:** React (Shopify Embedded App)
- **Backend:** Node.js / Express
- **Deployment:** Vercel
- **API:** Shopify Storefront API & Admin API
- **State Management:** Context API / Redux Toolkit
- **Styling:** Tailwind CSS

---

## 🚀 Roadmap

- Advanced filter UI components
- Multiple product card templates
- Theme customization support
- Performance optimizations
- Shopify App Store release

---

## 🎯 Goals

- Build a reusable and scalable filtering system
- Provide better UX than default Shopify filters
- Create a production-ready Shopify app

---

## 📌 Status

🧪 Works perfectly in my 4 Shopify projects
🚀 Planned release on Shopify App Store soon

---
