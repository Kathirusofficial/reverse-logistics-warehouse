# Reverse Logistics & Returns Warehouse Management System

A premium full-stack warehouse solution featuring a unique **Glassmorphism UI** to manage the lifecycle of returned products.

## ✨ Project Highlights
- **Stunning UI**: Modern dark theme with transparent, blurred panels and smooth transitions.
- **Lifecycle Tracking**: Monitor items as they transition through: `Received` → `Inspection` → `Repair` → `Resale` / `Scrap`.
- **Dynamic Analytics**: Real-time stats cards powered by MongoDB aggregation.
- **Full Inventory Control**: Search by name, filter by status, change lifecycle stages, and delete records.
- **Responsive Design**: Clean and professional layout that adapts to all screen sizes.

## 📁 Technical Architecture
- **Backend**: Node.js/Express.js (Modular routes, Mongoose schemas).
- **Database**: MongoDB (Automatic seeding of admin and sample products).
- **Frontend**: Vanilla JS, Pure CSS (Glassmorphism), Font Awesome Icons.

## 🚀 Setup & Launch (VS Code)

### 1. Database
Ensure **MongoDB** is running locally at `mongodb://127.0.0.1:27017`.

### 2. Backend Installation
1.  Open terminal in the `backend` folder:
    ```powershell
    cd backend
    npm install express mongoose cors
    ```
2.  Start the server:
    ```powershell
    node server.js
    ```
    *The system will automatically seed an admin and sample data on first run.*

### 3. Frontend Experience
1.  Navigate to the `frontend` folder.
2.  Open **`login.html`** in any modern web browser.
3.  **Credentials**:
    - **Email**: `admin@gmail.com`
    - **Password**: `1234`

## 📡 API Reference
- `POST /api/auth/register` - Create new user.
- `POST /api/auth/login` - Simple authentication check.
- `GET /api/returns` - List products with pagination/filters.
- `POST /api/returns/add` - Register a new returned product.
- `PUT /api/returns/:id/status` - Move item to a different lifecycle stage.
- `DELETE /api/returns/:id` - Permanently remove record.
- `GET /api/stats` - Fetch summary counts by status.

## 🛠️ Testing with Postman/CURL
Example of updating status to 'Repair':
```json
PUT http://127.0.0.1:5000/api/returns/<id>/status
{ "status": "Repair" }
```
