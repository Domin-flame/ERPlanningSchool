# Globetrotter API Documentation

## Base URL
```
http://localhost:5000
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication

### Register
```http
POST /register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securePassword123",
  "preferences": ["nature", "food", "culture"]
}
```

**Response** (201):
```json
{
  "message": "User created successfully"
}
```

### Login
```http
POST /login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securePassword123"
}
```

**Response** (200):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🗺️ Destinations

### Get All Destinations
```http
GET /destinations
GET /destinations?q=bali&tag=nature&max_cost=150&continent=Asia
```

**Query Parameters**:
- `q` (string): Search query
- `tag` (string): Filter by tag (nature, culture, food, etc.)
- `max_cost` (number): Maximum daily cost
- `continent` (string): Filter by continent

**Response** (200):
```json
[
  {
    "name": "Bali",
    "country": "Indonesia",
    "continent": "Asia",
    "description": "Tropical paradise...",
    "tags": ["nature", "beach", "culture"],
    "avg_cost_per_day": 60,
    "image": "g1.jpg"
  }
]
```

---

## ⭐ Reviews (Public Comments)

### Get Reviews
```http
GET /reviews
GET /reviews?destination=Bali
```

**Response** (200):
```json
[
  {
    "id": "uuid-1234",
    "username": "john_doe",
    "destination_name": "Bali",
    "rating": 5,
    "comment": "Amazing experience! The beaches are incredible...",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
]
```

### Create Review
```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination_name": "Bali",
  "rating": 5,
  "comment": "Amazing experience! The beaches are incredible..."
}
```

**Response** (201):
```json
{
  "id": "uuid-1234",
  "username": "john_doe",
  "destination_name": "Bali",
  "rating": 5,
  "comment": "Amazing experience!...",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### Delete Review
```http
DELETE /reviews/{review_id}
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Review deleted"
}
```

---

## ✅ Visited Destinations

### Get Visited Destinations
```http
GET /visited
Authorization: Bearer <token>
```

**Response** (200):
```json
["Bali", "Paris", "Tokyo"]
```

### Mark as Visited
```http
POST /visited
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination_name": "Bali"
}
```

**Response** (200):
```json
{
  "message": "Destination marked as visited",
  "destination_name": "Bali"
}
```

### Remove from Visited
```http
DELETE /visited/{destination_name}
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Destination removed from visited"
}
```

---

## 📝 Favorite Notes (Personal Notes)

### Get All Notes
```http
GET /favorite-notes
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "Bali": {
    "note": "Je veux visiter pendant la saison sèche",
    "visit_date": "Été 2025",
    "companions": "En famille",
    "budget": 3000,
    "updated_at": "2024-01-15T10:30:00.000Z"
  },
  "Paris": {
    "note": "Pour notre anniversaire de mariage",
    "visit_date": "Printemps 2025",
    "companions": "Avec mon épouse",
    "budget": 2500,
    "updated_at": "2024-01-14T15:20:00.000Z"
  }
}
```

### Get Note for Destination
```http
GET /favorite-notes/{destination_name}
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "note": "Je veux visiter pendant la saison sèche",
  "visit_date": "Été 2025",
  "companions": "En famille",
  "budget": 3000,
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

### Create/Update Note
```http
POST /favorite-notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "destination_name": "Bali",
  "note": "Je veux visiter pendant la saison sèche et voir les rizières",
  "visit_date": "Été 2025",
  "companions": "En famille",
  "budget": 3000
}
```

**Response** (200):
```json
{
  "message": "Note saved",
  "destination_name": "Bali",
  "note": {
    "note": "Je veux visiter pendant la saison sèche...",
    "visit_date": "Été 2025",
    "companions": "En famille",
    "budget": 3000,
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Delete Note
```http
DELETE /favorite-notes/{destination_name}
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "message": "Note deleted"
}
```

---

## 💡 Recommendations

### Get Personalized Recommendations
```http
GET /recommendations?limit=10
Authorization: Bearer <token>
```

**Response** (200):
```json
[
  {
    "name": "Bali",
    "country": "Indonesia",
    "description": "...",
    "match_score": 8,
    "tags": ["nature", "culture"]
  }
]
```

---

## 🗓️ Itineraries

### Get User Itineraries
```http
GET /itineraries
Authorization: Bearer <token>
```

**Response** (200):
```json
[
  {
    "id": "uuid-1234",
    "username": "john_doe",
    "title": "Tour d'Asie",
    "destinations": ["Bali", "Tokyo", "Bangkok"],
    "start_date": "2025-06-01",
    "end_date": "2025-06-30",
    "notes": "Voyage de noces"
  }
]
```

### Create Itinerary
```http
POST /itineraries
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Tour d'Asie",
  "destinations": ["Bali", "Tokyo", "Bangkok"],
  "start_date": "2025-06-01",
  "end_date": "2025-06-30",
  "notes": "Voyage de noces"
}
```

**Response** (201):
```json
{
  "id": "uuid-1234",
  "username": "john_doe",
  "title": "Tour d'Asie",
  "destinations": ["Bali", "Tokyo", "Bangkok"],
  "start_date": "2025-06-01",
  "end_date": "2025-06-30",
  "notes": "Voyage de noces"
}
```

---

## 🔥 Error Responses

### 400 Bad Request
```json
{
  "error": "destination_name, rating, and comment are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Token is missing or invalid"
}
```

### 404 Not Found
```json
{
  "error": "Review not found or unauthorized"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## 📊 Data Storage

All data is stored in JSON files:

- `data/users.json` - User accounts
- `data/destinations.json` - Destination catalog
- `data/itineraries.json` - User itineraries
- `data/reviews.json` - Public reviews
- `data/visited.json` - Visited destinations per user
- `data/favorite_notes.json` - Personal notes per user

---

## 🔐 Security Notes

- Passwords are hashed using werkzeug security
- JWT tokens expire after 24 hours
- CORS is enabled for development
- Never expose the SECRET_KEY in production
- All user-specific endpoints require authentication

---

## 🚀 Rate Limiting

Currently no rate limiting is implemented. In production, consider:
- 100 requests per minute per IP
- 1000 requests per day per user
- Special limits for write operations

---

## 📝 Best Practices

1. Always include error handling in client code
2. Cache destination data (it rarely changes)
3. Store JWT token securely (AsyncStorage for mobile)
4. Validate all inputs before sending to API
5. Use pull-to-refresh for real-time data
6. Implement offline mode for favorites/notes

---

## 🆕 What's New (v2.0)

✅ **Reviews System** - Users can comment and rate destinations  
✅ **Visited Tracking** - Mark destinations as visited  
✅ **Personal Notes** - Add private notes to favorites with budget, dates, companions  
✅ **Enhanced Detail View** - Reviews display on destination pages  
✅ **Unified Favorites/Visited Screen** - Tab-based interface

---

## 📞 Support

For issues or questions, please contact the development team.
