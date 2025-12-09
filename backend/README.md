# Hotpot Kiosk Backend API

Backend API server for Hotpot Kiosk System built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- RESTful API endpoints
- PostgreSQL database integration
- JWT authentication
- Real-time updates with Socket.io
- Image upload support
- Error handling middleware

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update the values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hotpot_kiosk_db
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_secret_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Health Check
- `GET /api/health` - Check server and database status

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

### Menu
- `GET /api/menu/addons` - Get all addons
- `GET /api/menu/soups` - Get all soups
- `GET /api/menu/spice-levels` - Get all spice levels

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get all orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `PUT /api/orders/:id/status` - Update order status (protected)

### Kitchen
- `GET /api/kitchen` - Get kitchen orders (protected)
- `PUT /api/kitchen/:id/status` - Update kitchen order status (protected)

### Queue
- `GET /api/queue/ready` - Get ready orders
- `GET /api/queue/in-progress` - Get in-progress orders

### Settings
- `GET /api/settings` - Get all settings (protected)
- `PUT /api/settings/:key` - Update setting (admin only)

## Database

The backend connects to PostgreSQL database. Make sure:
1. PostgreSQL is running
2. Database `hotpot_kiosk_db` exists
3. All tables are created
4. Seed data is inserted

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts      # Database connection
│   ├── controllers/         # Request handlers
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── middleware/          # Middleware functions
│   ├── types/               # TypeScript types
│   └── app.ts               # Main application
├── .env                     # Environment variables
├── package.json
└── tsconfig.json
```

