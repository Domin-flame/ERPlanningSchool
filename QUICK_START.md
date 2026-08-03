# CampusWorkflow - Quick Start Guide

## 🎯 30-Second Startup

### Windows
```cmd
start.bat
```

### macOS/Linux
```bash
chmod +x verify-and-run.sh
./verify-and-run.sh
```

**Wait 30-60 seconds for services to initialize...**

Then open your browser to: **http://localhost:5173**

---

## 🔑 Login

```
Email: admin@campus.edu
Password: password123
```

## 📍 What's Running

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:5173 | 5173 |
| API Gateway | http://localhost:3000 | 3000 |
| Auth Service | http://localhost:8001 | 8001 |
| Academic Service | http://localhost:8002 | 8002 |
| Finance Service | http://localhost:8003 | 8003 |
| HR Service | http://localhost:8004 | 8004 |

## 🧪 Test the API

### 1. Login and Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.edu","password":"password123"}' | jq .
```

This returns:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### 2. Get Courses
```bash
curl http://localhost:3000/api/academic/courses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Get Invoices
```bash
curl http://localhost:3000/api/finance/invoices \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get Employees
```bash
curl http://localhost:3000/api/hr/employees \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🛑 Stop Everything

```bash
docker-compose stop
```

## 🔄 Full Reset (⚠️ Deletes data)

```bash
docker-compose down -v
docker-compose up -d
```

## 📋 Other Test Accounts

| Email | Password | Role |
|-------|----------|------|
| student@campus.edu | password123 | Student |
| staff@campus.edu | password123 | Staff |
| professor@campus.edu | password123 | Admin |
| test@campus.edu | password123 | Student |

## ⚠️ Troubleshooting

### All services running but frontend won't load?
- Clear browser cache: `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Refresh page: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

### Can't login?
```bash
# Check auth service logs
docker-compose logs auth-service

# Check gateway logs
docker-compose logs gateway
```

### Services not starting?
```bash
# Check if port 5173, 3000 are in use
netstat -ano | findstr :5173
netstat -ano | findstr :3000

# Kill process if needed (Windows)
taskkill /PID <PID> /F
```

### Database connection error?
```bash
# Restart databases
docker-compose restart academic-db finance-db hr-db

# Wait 10 seconds, then restart services
docker-compose restart
```

## 📚 Documentation

See these files for more details:
- **`README_SETUP.md`** - Complete setup and configuration
- **`CONNECTIVITY_STATUS.md`** - Module connectivity verification
- **`DESIGN_IMPLEMENTATION_SUMMARY.md`** - Architecture overview

## ✨ Features

### Academic Module
- ✅ Course management
- ✅ Student enrollments
- ✅ Program management
- ✅ Assignment tracking

### Finance Module
- ✅ Invoice management
- ✅ Payment tracking
- ✅ Payroll management

### HR Module
- ✅ Employee management
- ✅ Leave requests
- ✅ Asset tracking
- ✅ Payroll management

### Authentication
- ✅ User registration
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Token expiration handling

## 🚀 Next Steps

1. **Explore Academic Module**
   - Go to Dashboard → Academic
   - View available courses
   - Enroll in a course as student

2. **Explore Finance Module**
   - Go to Dashboard → Finance
   - View invoices
   - Record payments

3. **Explore HR Module**
   - Go to Dashboard → HR
   - View employees
   - Request leave

---

**Happy learning! 🎉**

For issues or questions, check the logs:
```bash
docker-compose logs -f
```
