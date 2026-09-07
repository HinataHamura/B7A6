# Roomly — API Test Report

**Target**: `https://b7a6.onrender.com` (live production deployment)
**Date**: 2026-09-07
**Result**: **61 passed, 0 failed**

Every endpoint was exercised against the live deployment — not a local instance. Each entry below shows the exact request that was sent (method, path, auth header, JSON body) and the full response the server returned.

Coverage goes beyond the happy path: authorization guards (401/403), input validation (400), not-found handling (404), duplicate conflicts (409), and business-rule enforcement are all verified.

> JWT values are redacted as `<JWT-token>` and auth headers are shown as `Bearer <role token>` so no live credentials are committed to the repository.

---

## Summary

| Module | Tests | Passed | Failed |
|---|---:|---:|---:|
| Auth | 11 | 11 | 0 |
| Users | 3 | 3 | 0 |
| Listings | 14 | 14 | 0 |
| Bookings | 7 | 7 | 0 |
| Payments | 7 | 7 | 0 |
| Roommates | 4 | 4 | 0 |
| Reviews | 3 | 3 | 0 |
| Messages | 3 | 3 | 0 |
| Notifications | 2 | 2 | 0 |
| Admin | 4 | 4 | 0 |
| Upload & Misc | 3 | 3 | 0 |
| **Total** | **61** | **61** | **0** |

---

## Additional Verification (manual)

Beyond the automated suite, these were verified by hand against the live deployment:

- **Concurrency safety** — 5 simultaneous booking requests were fired at the same listing; exactly 1 succeeded and 4 were rejected with `409 Conflict`. The database confirmed a single active booking row, proving the serializable transaction prevents double-booking.
- **Soft delete** — after `DELETE /listings/:id`, the row was confirmed still present in PostgreSQL with `deletedAt` set and `status = ARCHIVED`, while disappearing from every API read.
- **Payment integrity** — a full SSLCommerz sandbox payment was completed end-to-end with a test card; the backend re-validated the transaction id and amount against the gateway before marking the record `PAID`.
- **Email delivery** — registration triggered a welcome email that was confirmed received in a real inbox.

> **Note on cold starts**: the Render free tier spins the instance down after inactivity, so the very first request can time out. The test runner warms the server via `/health` before starting, so this does not affect results.

---

# Detailed Results

## 1. Auth

### PASS — Login as Admin

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@roomly.com",
  "password": "Admin123!"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "04dd696d-9387-463d-b9f1-841979e5e3c7",
      "email": "admin@roomly.com",
      "role": "ADMIN"
    },
    "accessToken": "<JWT-token>",
    "refreshToken": "<JWT-token>"
  }
}
```

### PASS — Login as Landlord

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "landlord.demo@roomly.com",
  "password": "Landlord123!"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
      "email": "landlord.demo@roomly.com",
      "role": "LANDLORD"
    },
    "accessToken": "<JWT-token>",
    "refreshToken": "<JWT-token>"
  }
}
```

### PASS — Login as Tenant

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "tenant.demo@roomly.com",
  "password": "Tenant123!"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "user": {
      "id": "db5b6037-3fec-4339-b49a-9623b58f8854",
      "email": "tenant.demo@roomly.com",
      "role": "TENANT"
    },
    "accessToken": "<JWT-token>",
    "refreshToken": "<JWT-token>"
  }
}
```

### PASS — Login with wrong password is rejected

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "tenant.demo@roomly.com",
  "password": "WRONGPASS"
}
```

**Response — `401` (expected `401`)**

```json
{
  "success": false,
  "message": "Invalid email or password",
  "errors": [
    {
      "path": "",
      "message": "Invalid email or password"
    }
  ]
}
```

### PASS — Get own profile

```http
GET /api/v1/auth/me
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "db5b6037-3fec-4339-b49a-9623b58f8854",
    "email": "tenant.demo@roomly.com",
    "role": "TENANT",
    "provider": "CREDENTIALS",
    "googleId": null,
    "status": "ACTIVE",
    "isVerified": true,
    "needsPasswordChange": false,
    "createdAt": "2026-09-05T14:46:44.385Z",
    "updatedAt": "2026-09-05T14:46:44.385Z",
    "tenantProfile": {
      "id": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
      "userId": "db5b6037-3fec-4339-b49a-9623b58f8854",
      "name": "Nusrat Jahan",
      "phone": "01722222222",
      "profilePhoto": null,
      "bio": "Full API test run",
      "dateOfBirth": null,
      "occupation": "QA Engineer",
      "gender": "FEMALE",
      "smoker": false,
      "hasPets": false,
      "sleepSchedule": "NIGHT_OWL",
      "cleanliness": "VERY_TIDY",
      "budgetMin": "8000",
      "budgetMax": "15000",
      "preferredAreas": [
        "Dhanmondi",
        "Mohammadpur"
      ],
      "isVerifiedTenant": false,
      "verificationDocumentUrl": null,
      "verificationStatus": "NOT_SUBMITTED",
      "createdAt": "2026-09-05T14:46:44.385Z",
      "updatedAt": "2026-09-07T12:37:54.490Z"
    }
    ... (truncated)
```

### PASS — Refresh access token

```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "<JWT-token>"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Access token retrieved successfully",
  "data": {
    "accessToken": "<JWT-token>"
  }
}
```

### PASS — Register with invalid payload returns validation errors

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "bad-email"
}
```

**Response — `400` (expected `400`)**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "path": "body.name",
      "message": "Name is required"
    },
    {
      "path": "body.email",
      "message": "Invalid email address"
    },
    {
      "path": "body.password",
      "message": "Password is required"
    },
    {
      "path": "body.role",
      "message": "Role is required"
    }
  ]
}
```

### PASS — Register with duplicate email is rejected

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "Dup Test",
  "email": "tenant.demo@roomly.com",
  "password": "Test1234!",
  "role": "TENANT"
}
```

**Response — `409` (expected `409`)**

```json
{
  "success": false,
  "message": "An account with this email already exists",
  "errors": [
    {
      "path": "",
      "message": "An account with this email already exists"
    }
  ]
}
```

### PASS — Google login with invalid token is rejected

```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "idToken": "invalid-token"
}
```

**Response — `401` (expected `401`)**

```json
{
  "success": false,
  "message": "Invalid or expired Google token",
  "errors": [
    {
      "path": "",
      "message": "Invalid or expired Google token"
    }
  ]
}
```

### PASS — Logout

```http
POST /api/v1/auth/logout
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### PASS — Protected route without token is rejected

```http
GET /api/v1/auth/me
```

**Response — `401` (expected `401`)**

```json
{
  "success": false,
  "message": "You are not authorized",
  "errors": [
    {
      "path": "",
      "message": "You are not authorized"
    }
  ]
}
```

## 2. Users

### PASS — Tenant updates own profile

```http
PATCH /api/v1/users/me
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "bio": "Updated via automated API test",
  "occupation": "Software Engineer"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
    "userId": "db5b6037-3fec-4339-b49a-9623b58f8854",
    "name": "Nusrat Jahan",
    "phone": "01722222222",
    "profilePhoto": null,
    "bio": "Updated via automated API test",
    "dateOfBirth": null,
    "occupation": "Software Engineer",
    "gender": "FEMALE",
    "smoker": false,
    "hasPets": false,
    "sleepSchedule": "NIGHT_OWL",
    "cleanliness": "VERY_TIDY",
    "budgetMin": "8000",
    "budgetMax": "15000",
    "preferredAreas": [
      "Dhanmondi",
      "Mohammadpur"
    ],
    "isVerifiedTenant": false,
    "verificationDocumentUrl": null,
    "verificationStatus": "NOT_SUBMITTED",
    "createdAt": "2026-09-05T14:46:44.385Z",
    "updatedAt": "2026-09-07T12:47:11.408Z"
  }
}
```

### PASS — Landlord updates own profile

```http
PATCH /api/v1/users/me
Authorization: Bearer <landlord token>
Content-Type: application/json

{
  "bio": "Verified host in Dhaka"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "9490e166-145f-4a67-9bf1-290a827534bc",
    "userId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
    "name": "Karim Rahman",
    "phone": "01711111111",
    "profilePhoto": null,
    "bio": "Verified host in Dhaka",
    "isVerifiedHost": true,
    "createdAt": "2026-09-05T14:46:42.069Z",
    "updatedAt": "2026-09-07T12:47:13.911Z"
  }
}
```

### PASS — Admin has no self-profile to update

```http
PATCH /api/v1/users/me
Authorization: Bearer <admin token>
Content-Type: application/json

{
  "bio": "should fail"
}
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

## 3. Listings

### PASS — List with pagination and filters

```http
GET /api/v1/listings?page=1&limit=3&city=Dhaka&minRent=5000&maxRent=25000
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listings retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 3,
    "totalPages": 1
  },
  "data": [
    {
      "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "Cozy Private Room in Dhanmondi",
      "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "12000",
      "securityDeposit": "12000",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Road 8, Dhanmondi",
      "city": "Dhaka",
      "area": "Dhanmondi",
      "latitude": 23.7461,
      "longitude": 90.3742,
      "amenities": [
        "WiFi",
        "AC",
        "Attached Bathroom",
        "Furnished"
      ],
      "images": [],
      "genderPreference": "FEMALE",
      "createdAt": "2026-09-05T14:46:47.092Z",
      "updatedAt": "2026-09-05T14:46:47.092Z",
      "deletedAt": null,
      "landlord": {
        "name": "Karim Rahman",
    ... (truncated)
```

### PASS — Search listings by keyword

```http
GET /api/v1/listings?searchTerm=Dhanmondi&limit=3
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listings retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "Cozy Private Room in Dhanmondi",
      "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "12000",
      "securityDeposit": "12000",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Road 8, Dhanmondi",
      "city": "Dhaka",
      "area": "Dhanmondi",
      "latitude": 23.7461,
      "longitude": 90.3742,
      "amenities": [
        "WiFi",
        "AC",
        "Attached Bathroom",
        "Furnished"
      ],
      "images": [],
      "genderPreference": "FEMALE",
      "createdAt": "2026-09-05T14:46:47.092Z",
      "updatedAt": "2026-09-05T14:46:47.092Z",
      "deletedAt": null,
      "landlord": {
        "name": "Karim Rahman",
    ... (truncated)
```

### PASS — Geolocation nearby search (Haversine)

```http
GET /api/v1/listings/nearby?latitude=23.7461&longitude=90.3742&radiusKm=10
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Nearby listings retrieved successfully",
  "data": [
    {
      "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "Cozy Private Room in Dhanmondi",
      "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "12000",
      "securityDeposit": "12000",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Road 8, Dhanmondi",
      "city": "Dhaka",
      "area": "Dhanmondi",
      "latitude": 23.7461,
      "longitude": 90.3742,
      "amenities": [
        "WiFi",
        "AC",
        "Attached Bathroom",
        "Furnished"
      ],
      "images": [],
      "genderPreference": "FEMALE",
      "createdAt": "2026-09-05T14:46:47.092Z",
      "updatedAt": "2026-09-05T14:46:47.092Z",
      "deletedAt": null,
      "landlord": {
        "name": "Karim Rahman",
        "profilePhoto": null,
        "isVerifiedHost": true
      },
      "distanceKm": 0
    },
    {
    ... (truncated)
```

### PASS — Landlord lists own listings

```http
GET /api/v1/listings/my-listings
Authorization: Bearer <landlord token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Your listings retrieved successfully",
  "data": [
    {
      "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "Cozy Private Room in Dhanmondi",
      "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "12000",
      "securityDeposit": "12000",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Road 8, Dhanmondi",
      "city": "Dhaka",
      "area": "Dhanmondi",
      "latitude": 23.7461,
      "longitude": 90.3742,
      "amenities": [
        "WiFi",
        "AC",
        "Attached Bathroom",
        "Furnished"
      ],
      "images": [],
      "genderPreference": "FEMALE",
      "createdAt": "2026-09-05T14:46:47.092Z",
      "updatedAt": "2026-09-05T14:46:47.092Z",
      "deletedAt": null
    },
    {
      "id": "747e6bf7-9a27-4e51-8da1-3af39e72e757",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "Entire Apartment in Mohammadpur",
      "description": "2-bedroom entire apartment, newly renovated, close to main road and markets.",
      "type": "ENTIRE_PLACE",
      "status": "PUBLISHED",
    ... (truncated)
```

### PASS — Landlord dashboard statistics

```http
GET /api/v1/listings/dashboard-stats
Authorization: Bearer <landlord token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalListings": 3,
    "publishedListings": 3,
    "totalBookings": 4,
    "pendingBookings": 1,
    "activeBookings": 2,
    "totalRevenue": "12000",
    "averageRating": 0
  }
}
```

### PASS — Tenant cannot access landlord dashboard

```http
GET /api/v1/listings/dashboard-stats
Authorization: Bearer <tenant token>
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

### PASS — Landlord creates a listing

```http
POST /api/v1/listings
Authorization: Bearer <landlord token>
Content-Type: application/json

{
  "title": "API Test Suite Listing",
  "description": "Created by the automated API test suite for verification purposes",
  "type": "PRIVATE_ROOM",
  "status": "PUBLISHED",
  "rentAmount": 7777,
  "securityDeposit": 7777,
  "bedrooms": 1,
  "bathrooms": 1,
  "maxOccupants": 1,
  "addressLine": "Test Road 1",
  "city": "Dhaka",
  "area": "Uttara",
  "latitude": 23.8759,
  "longitude": 90.3795,
  "amenities": [
    "WiFi"
  ],
  "images": []
}
```

**Response — `201` (expected `201`)**

```json
{
  "success": true,
  "message": "Listing created successfully",
  "data": {
    "id": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
    "title": "API Test Suite Listing",
    "description": "Created by the automated API test suite for verification purposes",
    "type": "PRIVATE_ROOM",
    "status": "PUBLISHED",
    "rentAmount": "7777",
    "securityDeposit": "7777",
    "bedrooms": 1,
    "bathrooms": 1,
    "maxOccupants": 1,
    "addressLine": "Test Road 1",
    "city": "Dhaka",
    "area": "Uttara",
    "latitude": 23.8759,
    "longitude": 90.3795,
    "amenities": [
      "WiFi"
    ],
    "images": [],
    "genderPreference": null,
    "createdAt": "2026-09-07T12:47:32.367Z",
    "updatedAt": "2026-09-07T12:47:32.367Z",
    "deletedAt": null
  }
}
```

### PASS — Tenant cannot create a listing

```http
POST /api/v1/listings
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "title": "Tenant cannot create",
  "description": "This request should be rejected with a forbidden status",
  "type": "PRIVATE_ROOM",
  "rentAmount": 1000,
  "securityDeposit": 1000,
  "bedrooms": 1,
  "bathrooms": 1,
  "addressLine": "X Road",
  "city": "Dhaka",
  "area": "Y",
  "latitude": 23.8,
  "longitude": 90.4
}
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

### PASS — Get listing by id

```http
GET /api/v1/listings/29ed08b6-c3ef-46ef-9767-c569503cd070
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listing retrieved successfully",
  "data": {
    "id": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
    "title": "API Test Suite Listing",
    "description": "Created by the automated API test suite for verification purposes",
    "type": "PRIVATE_ROOM",
    "status": "PUBLISHED",
    "rentAmount": "7777",
    "securityDeposit": "7777",
    "bedrooms": 1,
    "bathrooms": 1,
    "maxOccupants": 1,
    "addressLine": "Test Road 1",
    "city": "Dhaka",
    "area": "Uttara",
    "latitude": 23.8759,
    "longitude": 90.3795,
    "amenities": [
      "WiFi"
    ],
    "images": [],
    "genderPreference": null,
    "createdAt": "2026-09-07T12:47:32.367Z",
    "updatedAt": "2026-09-07T12:47:32.367Z",
    "deletedAt": null,
    "landlord": {
      "id": "9490e166-145f-4a67-9bf1-290a827534bc",
      "name": "Karim Rahman",
      "phone": "01711111111",
      "profilePhoto": null,
      "bio": "Verified host in Dhaka",
      "isVerifiedHost": true
    },
    "reviews": []
  }
}
```

### PASS — Nonexistent listing returns 404

```http
GET /api/v1/listings/00000000-0000-0000-0000-000000000000
```

**Response — `404` (expected `404`)**

```json
{
  "success": false,
  "message": "Listing not found",
  "errors": [
    {
      "path": "",
      "message": "Listing not found"
    }
  ]
}
```

### PASS — Owner updates their listing

```http
PATCH /api/v1/listings/29ed08b6-c3ef-46ef-9767-c569503cd070
Authorization: Bearer <landlord token>
Content-Type: application/json

{
  "rentAmount": 8888
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listing updated successfully",
  "data": {
    "id": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
    "title": "API Test Suite Listing",
    "description": "Created by the automated API test suite for verification purposes",
    "type": "PRIVATE_ROOM",
    "status": "PUBLISHED",
    "rentAmount": "8888",
    "securityDeposit": "7777",
    "bedrooms": 1,
    "bathrooms": 1,
    "maxOccupants": 1,
    "addressLine": "Test Road 1",
    "city": "Dhaka",
    "area": "Uttara",
    "latitude": 23.8759,
    "longitude": 90.3795,
    "amenities": [
      "WiFi"
    ],
    "images": [],
    "genderPreference": null,
    "createdAt": "2026-09-07T12:47:32.367Z",
    "updatedAt": "2026-09-07T12:47:40.200Z",
    "deletedAt": null
  }
}
```

### PASS — Non-owner cannot update the listing

```http
PATCH /api/v1/listings/29ed08b6-c3ef-46ef-9767-c569503cd070
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "rentAmount": 1
}
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

### PASS — Tenant saves a listing

```http
POST /api/v1/listings/29ed08b6-c3ef-46ef-9767-c569503cd070/save
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listing saved",
  "data": {
    "saved": true
  }
}
```

### PASS — Saving again unsaves (toggle)

```http
POST /api/v1/listings/29ed08b6-c3ef-46ef-9767-c569503cd070/save
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listing removed from saved",
  "data": {
    "saved": false
  }
}
```

## 4. Bookings

### PASS — Tenant lists own bookings

```http
GET /api/v1/bookings/my-bookings
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Your bookings retrieved successfully",
  "data": [
    {
      "id": "3886a729-374f-4471-a955-45f0b0ccf0fd",
      "tenantId": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
      "listingId": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "status": "CONFIRMED",
      "moveInDate": "2027-05-01T00:00:00.000Z",
      "message": "Live demo booking during video walkthrough",
      "createdAt": "2026-09-07T11:50:35.213Z",
      "updatedAt": "2026-09-07T11:52:31.071Z",
      "listing": {
        "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
        "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
        "title": "Cozy Private Room in Dhanmondi",
        "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
        "type": "PRIVATE_ROOM",
        "status": "PUBLISHED",
        "rentAmount": "12000",
        "securityDeposit": "12000",
        "bedrooms": 1,
        "bathrooms": 1,
        "maxOccupants": 1,
        "addressLine": "Road 8, Dhanmondi",
        "city": "Dhaka",
        "area": "Dhanmondi",
        "latitude": 23.7461,
        "longitude": 90.3742,
        "amenities": [
          "WiFi",
          "AC",
          "Attached Bathroom",
          "Furnished"
        ],
        "images": [],
        "genderPreference": "FEMALE",
        "createdAt": "2026-09-05T14:46:47.092Z",
        "updatedAt": "2026-09-05T14:46:47.092Z",
    ... (truncated)
```

### PASS — Landlord lists bookings on their listings

```http
GET /api/v1/bookings/landlord-bookings
Authorization: Bearer <landlord token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Bookings for your listings retrieved successfully",
  "data": [
    {
      "id": "3886a729-374f-4471-a955-45f0b0ccf0fd",
      "tenantId": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
      "listingId": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
      "status": "CONFIRMED",
      "moveInDate": "2027-05-01T00:00:00.000Z",
      "message": "Live demo booking during video walkthrough",
      "createdAt": "2026-09-07T11:50:35.213Z",
      "updatedAt": "2026-09-07T11:52:31.071Z",
      "listing": {
        "id": "4fa3f2a4-2a24-4d37-ac45-588779a1efba",
        "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
        "title": "Cozy Private Room in Dhanmondi",
        "description": "A well-lit private room in a 3-bedroom apartment, close to Dhanmondi Lake. Ideal for working professionals.",
        "type": "PRIVATE_ROOM",
        "status": "PUBLISHED",
        "rentAmount": "12000",
        "securityDeposit": "12000",
        "bedrooms": 1,
        "bathrooms": 1,
        "maxOccupants": 1,
        "addressLine": "Road 8, Dhanmondi",
        "city": "Dhaka",
        "area": "Dhanmondi",
        "latitude": 23.7461,
        "longitude": 90.3742,
        "amenities": [
          "WiFi",
          "AC",
          "Attached Bathroom",
          "Furnished"
        ],
        "images": [],
        "genderPreference": "FEMALE",
        "createdAt": "2026-09-05T14:46:47.092Z",
        "updatedAt": "2026-09-05T14:46:47.092Z",
    ... (truncated)
```

### PASS — Tenant creates a booking

```http
POST /api/v1/bookings
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "listingId": "29ed08b6-c3ef-46ef-9767-c569503cd070",
  "moveInDate": "2027-06-01",
  "message": "Automated test booking"
}
```

**Response — `201` (expected `201`)**

```json
{
  "success": true,
  "message": "Booking request created successfully",
  "data": {
    "id": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
    "tenantId": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
    "listingId": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "status": "PENDING",
    "moveInDate": "2027-06-01T00:00:00.000Z",
    "message": "Automated test booking",
    "createdAt": "2026-09-07T12:47:57.679Z",
    "updatedAt": "2026-09-07T12:47:57.679Z",
    "listing": {
      "id": "29ed08b6-c3ef-46ef-9767-c569503cd070",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "API Test Suite Listing",
      "description": "Created by the automated API test suite for verification purposes",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "8888",
      "securityDeposit": "7777",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Test Road 1",
      "city": "Dhaka",
      "area": "Uttara",
      "latitude": 23.8759,
      "longitude": 90.3795,
      "amenities": [
        "WiFi"
      ],
      "images": [],
      "genderPreference": null,
      "createdAt": "2026-09-07T12:47:32.367Z",
      "updatedAt": "2026-09-07T12:47:40.200Z",
      "deletedAt": null,
      "landlord": {
        "id": "9490e166-145f-4a67-9bf1-290a827534bc",
        "userId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
    ... (truncated)
```

### PASS — Booking with a past move-in date is rejected

```http
POST /api/v1/bookings
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "listingId": "29ed08b6-c3ef-46ef-9767-c569503cd070",
  "moveInDate": "2020-01-01",
  "message": "past date"
}
```

**Response — `400` (expected `400`)**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "path": "body.moveInDate",
      "message": "Move-in date must be in the future"
    }
  ]
}
```

### PASS — Get booking by id

```http
GET /api/v1/bookings/dabcb477-5c9b-49b6-ae73-78c193bf200d
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Booking retrieved successfully",
  "data": {
    "id": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
    "tenantId": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
    "listingId": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "status": "PENDING",
    "moveInDate": "2027-06-01T00:00:00.000Z",
    "message": "Automated test booking",
    "createdAt": "2026-09-07T12:47:57.679Z",
    "updatedAt": "2026-09-07T12:47:57.679Z",
    "listing": {
      "id": "29ed08b6-c3ef-46ef-9767-c569503cd070",
      "landlordId": "9490e166-145f-4a67-9bf1-290a827534bc",
      "title": "API Test Suite Listing",
      "description": "Created by the automated API test suite for verification purposes",
      "type": "PRIVATE_ROOM",
      "status": "PUBLISHED",
      "rentAmount": "8888",
      "securityDeposit": "7777",
      "bedrooms": 1,
      "bathrooms": 1,
      "maxOccupants": 1,
      "addressLine": "Test Road 1",
      "city": "Dhaka",
      "area": "Uttara",
      "latitude": 23.8759,
      "longitude": 90.3795,
      "amenities": [
        "WiFi"
      ],
      "images": [],
      "genderPreference": null,
      "createdAt": "2026-09-07T12:47:32.367Z",
      "updatedAt": "2026-09-07T12:47:40.200Z",
      "deletedAt": null,
      "landlord": {
        "id": "9490e166-145f-4a67-9bf1-290a827534bc",
        "userId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
    ... (truncated)
```

### PASS — Tenant cannot confirm their own booking

```http
PATCH /api/v1/bookings/dabcb477-5c9b-49b6-ae73-78c193bf200d/status
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "Only the landlord can confirm or reject a booking",
  "errors": [
    {
      "path": "",
      "message": "Only the landlord can confirm or reject a booking"
    }
  ]
}
```

### PASS — Landlord confirms the booking

```http
PATCH /api/v1/bookings/dabcb477-5c9b-49b6-ae73-78c193bf200d/status
Authorization: Bearer <landlord token>
Content-Type: application/json

{
  "status": "CONFIRMED"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Booking status updated successfully",
  "data": {
    "id": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
    "tenantId": "f27b1f1e-d98f-47bd-ab2c-b0b154002598",
    "listingId": "29ed08b6-c3ef-46ef-9767-c569503cd070",
    "status": "CONFIRMED",
    "moveInDate": "2027-06-01T00:00:00.000Z",
    "message": "Automated test booking",
    "createdAt": "2026-09-07T12:47:57.679Z",
    "updatedAt": "2026-09-07T12:48:08.941Z"
  }
}
```

## 5. Payments

### PASS — Payment history (tenant scope)

```http
GET /api/v1/payments/history?page=1&limit=3
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 4,
    "totalPages": 2
  },
  "data": [
    {
      "id": "e59eca9b-448e-46c5-bb27-2958a6c82b16",
      "bookingId": "3886a729-374f-4471-a955-45f0b0ccf0fd",
      "transactionId": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
      "purpose": "BOOKING_ADVANCE",
      "amount": "12000",
      "status": "PAID",
      "gatewayResponse": {
        "amount": "12000.00",
        "status": "VALID",
        "val_id": "260907175553U7HrKnT81Z2P9tS",
        "card_no": "432155XXXXXX7491",
        "tran_id": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
        "value_a": "",
        "value_b": "",
        "value_c": "",
        "value_d": "",
        "currency": "BDT",
        "base_fair": "0.00",
        "card_type": "VISA-Dutch Bangla",
        "tran_date": "2026-09-07 17:54:25",
        "APIConnect": "DONE",
        "card_brand": "VISA",
        "emi_amount": "0.00",
        "emi_issuer": "STANDARD CHARTERED BANK",
        "gw_version": "",
        "risk_level": "0",
        "risk_title": "Safe",
        "card_issuer": "STANDARD CHARTERED BANK",
        "card_ref_id": "dc1da4f52669828139e81ef5eb0f48a5a99ea054a131e00a562887d455417dd917",
    ... (truncated)
```

### PASS — Payment history (landlord scope)

```http
GET /api/v1/payments/history?page=1&limit=3
Authorization: Bearer <landlord token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 4,
    "totalPages": 2
  },
  "data": [
    {
      "id": "e59eca9b-448e-46c5-bb27-2958a6c82b16",
      "bookingId": "3886a729-374f-4471-a955-45f0b0ccf0fd",
      "transactionId": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
      "purpose": "BOOKING_ADVANCE",
      "amount": "12000",
      "status": "PAID",
      "gatewayResponse": {
        "amount": "12000.00",
        "status": "VALID",
        "val_id": "260907175553U7HrKnT81Z2P9tS",
        "card_no": "432155XXXXXX7491",
        "tran_id": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
        "value_a": "",
        "value_b": "",
        "value_c": "",
        "value_d": "",
        "currency": "BDT",
        "base_fair": "0.00",
        "card_type": "VISA-Dutch Bangla",
        "tran_date": "2026-09-07 17:54:25",
        "APIConnect": "DONE",
        "card_brand": "VISA",
        "emi_amount": "0.00",
        "emi_issuer": "STANDARD CHARTERED BANK",
        "gw_version": "",
        "risk_level": "0",
        "risk_title": "Safe",
        "card_issuer": "STANDARD CHARTERED BANK",
        "card_ref_id": "dc1da4f52669828139e81ef5eb0f48a5a99ea054a131e00a562887d455417dd917",
    ... (truncated)
```

### PASS — Payment history (admin scope)

```http
GET /api/v1/payments/history?page=1&limit=3
Authorization: Bearer <admin token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Payment history retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 4,
    "totalPages": 2
  },
  "data": [
    {
      "id": "e59eca9b-448e-46c5-bb27-2958a6c82b16",
      "bookingId": "3886a729-374f-4471-a955-45f0b0ccf0fd",
      "transactionId": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
      "purpose": "BOOKING_ADVANCE",
      "amount": "12000",
      "status": "PAID",
      "gatewayResponse": {
        "amount": "12000.00",
        "status": "VALID",
        "val_id": "260907175553U7HrKnT81Z2P9tS",
        "card_no": "432155XXXXXX7491",
        "tran_id": "ROOMLY-b700de6d-b448-4d68-a7b8-23cd4dd8cd2e",
        "value_a": "",
        "value_b": "",
        "value_c": "",
        "value_d": "",
        "currency": "BDT",
        "base_fair": "0.00",
        "card_type": "VISA-Dutch Bangla",
        "tran_date": "2026-09-07 17:54:25",
        "APIConnect": "DONE",
        "card_brand": "VISA",
        "emi_amount": "0.00",
        "emi_issuer": "STANDARD CHARTERED BANK",
        "gw_version": "",
        "risk_level": "0",
        "risk_title": "Safe",
        "card_issuer": "STANDARD CHARTERED BANK",
        "card_ref_id": "dc1da4f52669828139e81ef5eb0f48a5a99ea054a131e00a562887d455417dd917",
    ... (truncated)
```

### PASS — Initiate SSLCommerz payment session

```http
POST /api/v1/payments/initiate
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "bookingId": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
  "purpose": "BOOKING_ADVANCE"
}
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Payment session created successfully",
  "data": {
    "paymentUrl": "https://sandbox.sslcommerz.com/EasyCheckOut/testcdefaed7ffc4713e100b8a80a59a8ecc872",
    "transactionId": "ROOMLY-4974502c-1d81-4b46-a1f2-d9121a5d5a95"
  }
}
```

### PASS — Payment cancel callback renders result page

```http
POST /api/v1/payments/cancel/ROOMLY-4974502c-1d81-4b46-a1f2-d9121a5d5a95
```

**Response — `200` (expected `200`)**

```json
<!DOCTYPE html> ... (payment result page rendered — full HTML omitted)```

### PASS — Payment fail callback renders result page

```http
POST /api/v1/payments/fail/ROOMLY-4974502c-1d81-4b46-a1f2-d9121a5d5a95
```

**Response — `200` (expected `200`)**

```json
<!DOCTYPE html> ... (payment result page rendered — full HTML omitted)```

### PASS — IPN webhook endpoint accepts requests

```http
POST /api/v1/payments/ipn
Content-Type: application/json

{}
```

**Response — `200` (expected `200`)**

```json
IPN received
```

## 6. Roommates

### PASS — Roommate compatibility matches

```http
GET /api/v1/roommates/matches
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Compatible roommates retrieved successfully",
  "data": []
}
```

### PASS — List sent roommate requests

```http
GET /api/v1/roommates/requests/sent
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Sent requests retrieved successfully",
  "data": []
}
```

### PASS — List received roommate requests

```http
GET /api/v1/roommates/requests/received
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Received requests retrieved successfully",
  "data": []
}
```

### PASS — Landlord cannot access roommate matching

```http
GET /api/v1/roommates/matches
Authorization: Bearer <landlord token>
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

## 7. Reviews

### PASS — Get reviews for a listing (with average rating)

```http
GET /api/v1/reviews/listing/29ed08b6-c3ef-46ef-9767-c569503cd070
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Listing reviews retrieved successfully",
  "data": {
    "reviews": [],
    "averageRating": 0,
    "totalReviews": 0
  }
}
```

### PASS — Cannot review a booking that is not completed

```http
POST /api/v1/reviews
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "bookingId": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
  "rating": 5,
  "comment": "Great stay"
}
```

**Response — `400` (expected `400`)**

```json
{
  "success": false,
  "message": "You can only review a completed stay",
  "errors": [
    {
      "path": "",
      "message": "You can only review a completed stay"
    }
  ]
}
```

### PASS — Rating outside 1-5 is rejected

```http
POST /api/v1/reviews
Authorization: Bearer <tenant token>
Content-Type: application/json

{
  "bookingId": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
  "rating": 99,
  "comment": "invalid rating"
}
```

**Response — `400` (expected `400`)**

```json
{
  "success": false,
  "message": "Validation Error",
  "errors": [
    {
      "path": "body.rating",
      "message": "Number must be less than or equal to 5"
    }
  ]
}
```

## 8. Messages

### PASS — List conversations

```http
GET /api/v1/messages/conversations
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": []
}
```

### PASS — Unread message count

```http
GET /api/v1/messages/unread-count
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unreadCount": 0
  }
}
```

### PASS — Get conversation with a specific user

```http
GET /api/v1/messages/db5b6037-3fec-4339-b49a-9623b58f8854
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Conversation retrieved successfully",
  "data": []
}
```

## 9. Notifications

### PASS — List own notifications

```http
GET /api/v1/notifications
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": [
    {
      "id": "11e417c0-aa12-466c-a176-0ea5b100217b",
      "userId": "db5b6037-3fec-4339-b49a-9623b58f8854",
      "type": "BOOKING",
      "title": "Booking status updated",
      "message": "Your booking for \"API Test Suite Listing\" is now CONFIRMED",
      "isRead": false,
      "meta": {
        "bookingId": "dabcb477-5c9b-49b6-ae73-78c193bf200d"
      },
      "createdAt": "2026-09-07T12:48:09.956Z"
    },
    {
      "id": "5f06df2f-246b-4131-ba93-040a8cb0b17c",
      "userId": "db5b6037-3fec-4339-b49a-9623b58f8854",
      "type": "BOOKING",
      "title": "Booking status updated",
      "message": "Your booking for \"API Test Suite Listing\" is now CONFIRMED",
      "isRead": true,
      "meta": {
        "bookingId": "c56fbcc5-9b6f-4602-885a-7ae799ca6acd"
      },
      "createdAt": "2026-09-07T12:38:45.999Z"
    },
    {
      "id": "00dc7b64-c28e-4b20-8aea-ba0a5985d2e0",
      "userId": "db5b6037-3fec-4339-b49a-9623b58f8854",
      "type": "BOOKING",
      "title": "Booking status updated",
      "message": "Your booking for \"API Test Suite Listing\" is now CONFIRMED",
      "isRead": true,
      "meta": {
        "bookingId": "352764fc-3e51-4cca-95a1-2ac6576781ca"
      },
      "createdAt": "2026-09-07T12:36:13.960Z"
    },
    ... (truncated)
```

### PASS — Mark all notifications as read

```http
PATCH /api/v1/notifications/read-all
Authorization: Bearer <tenant token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

## 10. Admin

### PASS — Admin lists all users

```http
GET /api/v1/admin/users
Authorization: Bearer <admin token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "4c98ab24-4ad9-4998-a0cd-7823e19b3b09",
      "email": "eshafarzana666+demo2@gmail.com",
      "role": "LANDLORD",
      "status": "ACTIVE",
      "provider": "CREDENTIALS",
      "createdAt": "2026-09-07T11:43:37.002Z",
      "landlordProfile": {
        "name": "Shahin Alam",
        "isVerifiedHost": false
      },
      "tenantProfile": null
    },
    {
      "id": "03d0e516-2c88-4dd6-b77b-8de12014b49f",
      "email": "eshafarzana666+demo1@gmail.com",
      "role": "TENANT",
      "status": "ACTIVE",
      "provider": "CREDENTIALS",
      "createdAt": "2026-09-07T11:42:51.604Z",
      "landlordProfile": null,
      "tenantProfile": {
        "name": "Rakib Hasan"
      }
    },
    {
      "id": "521b338e-a373-4d34-b48d-72479e9bd22a",
      "email": "eshafarzana666+roomlytest@gmail.com",
      "role": "TENANT",
      "status": "ACTIVE",
      "provider": "CREDENTIALS",
      "createdAt": "2026-09-05T17:20:53.391Z",
      "landlordProfile": null,
      "tenantProfile": {
        "name": "Email Test User"
      }
    ... (truncated)
```

### PASS — Tenant cannot access admin user list

```http
GET /api/v1/admin/users
Authorization: Bearer <tenant token>
```

**Response — `403` (expected `403`)**

```json
{
  "success": false,
  "message": "You do not have permission to access this resource",
  "errors": [
    {
      "path": "",
      "message": "You do not have permission to access this resource"
    }
  ]
}
```

### PASS — Admin platform statistics

```http
GET /api/v1/admin/stats
Authorization: Bearer <admin token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Dashboard stats retrieved successfully",
  "data": {
    "totalUsers": 6,
    "totalLandlords": 2,
    "totalTenants": 3,
    "totalListings": 4,
    "publishedListings": 4,
    "totalBookings": 5,
    "activeBookings": 4,
    "totalRevenue": "12000",
    "totalReviews": 0
  }
}
```

### PASS — Admin audit log trail

```http
GET /api/v1/admin/audit-logs?page=1&limit=3
Authorization: Bearer <admin token>
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Audit logs retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 3,
    "total": 9,
    "totalPages": 3
  },
  "data": [
    {
      "id": "afd4e1f4-0e55-430a-8d42-b4c8ad704825",
      "actorId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
      "actorRole": "LANDLORD",
      "action": "BOOKING_STATUS_UPDATED",
      "entityType": "Booking",
      "entityId": "dabcb477-5c9b-49b6-ae73-78c193bf200d",
      "metadata": {
        "newStatus": "CONFIRMED",
        "previousStatus": "PENDING"
      },
      "createdAt": "2026-09-07T12:48:10.464Z"
    },
    {
      "id": "c6096b22-fb11-4ace-9738-245181cca22f",
      "actorId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
      "actorRole": "LANDLORD",
      "action": "BOOKING_STATUS_UPDATED",
      "entityType": "Booking",
      "entityId": "c56fbcc5-9b6f-4602-885a-7ae799ca6acd",
      "metadata": {
        "newStatus": "CONFIRMED",
        "previousStatus": "PENDING"
      },
      "createdAt": "2026-09-07T12:38:46.511Z"
    },
    {
      "id": "31f8f032-8f38-4397-a352-6cd73f911c95",
      "actorId": "27fc96c3-bfa9-4346-99dd-8f1eca752826",
      "actorRole": "LANDLORD",
    ... (truncated)
```

## 11. Upload & Misc

### PASS — Upload without a file is rejected

```http
POST /api/v1/upload/images
Authorization: Bearer <tenant token>
```

**Response — `400` (expected `400`)**

```json
{
  "success": false,
  "message": "At least one image file is required",
  "errors": [
    {
      "path": "",
      "message": "At least one image file is required"
    }
  ]
}
```

### PASS — Unknown route returns structured 404

```http
GET /api/v1/nonexistent-route
```

**Response — `404` (expected `404`)**

```json
{
  "success": false,
  "message": "API Not Found",
  "errors": [
    {
      "path": "/api/v1/nonexistent-route",
      "message": "Route not found"
    }
  ]
}
```

### PASS — Health check reports database connectivity

```http
GET /health
```

**Response — `200` (expected `200`)**

```json
{
  "success": true,
  "message": "Service healthy",
  "data": {
    "database": "connected",
    "uptime": 861.178108207
  }
}
```
