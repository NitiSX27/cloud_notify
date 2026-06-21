# Ticket Workflow API Documentation

## Overview
The Citizen Complaint Platform provides a complete ticket workflow system enabling citizens to report complaints, officers to manage investigations, and admins to oversee the process.

---

## Workflow Diagram

```
Citizen
   |
   | Create Complaint
   v
Ticket Created (OPEN)
   |
   | Admin assigns Officer
   v
Ticket Assigned (ASSIGNED)
   |
   | Officer investigates
   v
IN_PROGRESS
   |
   | Officer resolves
   v
RESOLVED
   |
   | Admin verifies
   v
CLOSED
```

---

## Database Schema

### Enums

**TicketStatus**
- OPEN
- ASSIGNED
- IN_PROGRESS
- RESOLVED
- CLOSED

**TicketPriority**
- LOW
- MEDIUM
- HIGH
- URGENT

### Models

#### User
- `id` - Unique identifier
- `name` - User name
- `email` - Unique email
- `role` - CITIZEN, OFFICER, or ADMIN
- `createdTickets` - Tickets created by user
- `assignedTickets` - Tickets assigned to officer
- `comments` - Comments made by user

#### Ticket
- `id` - Unique identifier
- `title` - Complaint title
- `description` - Detailed description
- `category` - Complaint category
- `priority` - LOW, MEDIUM, HIGH, URGENT
- `status` - Current status
- `imageUrl` - Optional image URL
- `locationText` - Location description
- `createdBy` - Reference to User who created it
- `assignments` - Officer assignments
- `comments` - Ticket comments
- `history` - Status change history
- `timestamps` - createdAt, updatedAt

#### TicketAssignment
- `id` - Unique identifier
- `ticketId` - Reference to Ticket
- `officerId` - Reference to Officer User
- `assignedAt` - Assignment timestamp

#### TicketComment
- `id` - Unique identifier
- `ticketId` - Reference to Ticket
- `userId` - Reference to commenting User
- `comment` - Comment text
- `createdAt` - Creation timestamp

#### TicketStatusHistory
- `id` - Unique identifier
- `ticketId` - Reference to Ticket
- `oldStatus` - Previous status
- `newStatus` - New status
- `changedBy` - User ID who made change
- `createdAt` - Change timestamp

---

## API Endpoints

### 1. Create Ticket (Citizen/Admin Only)

**Endpoint:** `POST /api/tickets`

**Authentication:** Required
**Authorization:** CITIZEN or ADMIN

**Request Body:**
```json
{
  "title": "Garbage Dump at Market",
  "description": "Large garbage dump forming at main market area",
  "category": "Sanitation",
  "priority": "HIGH",
  "imageUrl": "https://example.com/image.jpg",
  "locationText": "Sector 5, Market Road"
}
```

**Response (201 Created):**
```json
{
  "id": "ticket_123",
  "title": "Garbage Dump at Market",
  "description": "Large garbage dump forming at main market area",
  "category": "Sanitation",
  "priority": "HIGH",
  "status": "OPEN",
  "imageUrl": "https://example.com/image.jpg",
  "locationText": "Sector 5, Market Road",
  "createdById": "user_456",
  "createdAt": "2026-06-19T10:30:00Z",
  "updatedAt": "2026-06-19T10:30:00Z"
}
```

---

### 2. Get Tickets (Role-Based)

**Endpoint:** `GET /api/tickets`

**Authentication:** Required

**Response (200 OK):**

**Admin:** Returns all tickets
**Citizen:** Returns only tickets created by them
**Officer:** Returns tickets assigned to them

```json
[
  {
    "id": "ticket_123",
    "title": "Garbage Dump at Market",
    "description": "Large garbage dump forming at main market area",
    "category": "Sanitation",
    "priority": "HIGH",
    "status": "OPEN",
    "imageUrl": "https://example.com/image.jpg",
    "locationText": "Sector 5, Market Road",
    "createdById": "user_456",
    "createdBy": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "CITIZEN"
    },
    "assignments": [],
    "createdAt": "2026-06-19T10:30:00Z",
    "updatedAt": "2026-06-19T10:30:00Z"
  }
]
```

---

### 3. Get Ticket Details

**Endpoint:** `GET /api/tickets/:id`

**Authentication:** Required
**Authorization:** Creator (if CITIZEN), Assigned Officer, or ADMIN

**Response (200 OK):**
```json
{
  "id": "ticket_123",
  "title": "Garbage Dump at Market",
  "description": "Large garbage dump forming at main market area",
  "category": "Sanitation",
  "priority": "HIGH",
  "status": "ASSIGNED",
  "imageUrl": "https://example.com/image.jpg",
  "locationText": "Sector 5, Market Road",
  "createdById": "user_456",
  "createdBy": {
    "id": "user_456",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "CITIZEN"
  },
  "assignments": [
    {
      "id": "assign_789",
      "ticketId": "ticket_123",
      "officerId": "officer_101",
      "assignedAt": "2026-06-19T11:00:00Z",
      "officer": {
        "id": "officer_101",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "OFFICER"
      }
    }
  ],
  "comments": [
    {
      "id": "comment_1",
      "ticketId": "ticket_123",
      "userId": "officer_101",
      "comment": "Investigation started",
      "createdAt": "2026-06-19T11:15:00Z",
      "user": {
        "id": "officer_101",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "OFFICER"
      }
    }
  ],
  "history": [
    {
      "id": "hist_1",
      "ticketId": "ticket_123",
      "oldStatus": "OPEN",
      "newStatus": "ASSIGNED",
      "changedBy": "admin_789",
      "createdAt": "2026-06-19T11:00:00Z"
    }
  ],
  "createdAt": "2026-06-19T10:30:00Z",
  "updatedAt": "2026-06-19T11:15:00Z"
}
```

---

### 4. Assign Officer (Admin Only)

**Endpoint:** `POST /api/tickets/:id/assign`

**Authentication:** Required
**Authorization:** ADMIN only

**Request Body:**
```json
{
  "officerId": "officer_101"
}
```

**Response (200 OK):**
```json
{
  "message": "Assigned",
  "assignment": {
    "id": "assign_789",
    "ticketId": "ticket_123",
    "officerId": "officer_101",
    "assignedAt": "2026-06-19T11:00:00Z"
  },
  "ticket": {
    "id": "ticket_123",
    "title": "Garbage Dump at Market",
    "status": "ASSIGNED",
    "updatedAt": "2026-06-19T11:00:00Z"
  }
}
```

**Error Responses:**
- `400` - Officer not found or invalid officer role
- `404` - Ticket not found

---

### 5. Add Comment (Any Authenticated User)

**Endpoint:** `POST /api/tickets/:id/comment`

**Authentication:** Required
**Authorization:** Ticket creator (if CITIZEN), Assigned Officer, or ADMIN

**Request Body:**
```json
{
  "comment": "Investigation started. Visiting site tomorrow."
}
```

**Response (200 OK):**
```json
{
  "id": "comment_1",
  "ticketId": "ticket_123",
  "userId": "officer_101",
  "comment": "Investigation started. Visiting site tomorrow.",
  "createdAt": "2026-06-19T11:15:00Z"
}
```

**Error Responses:**
- `404` - Ticket not found
- `403` - Unauthorized to comment

---

### 6. Update Ticket Status (Officer/Admin Only)

**Endpoint:** `POST /api/tickets/:id/status`

**Authentication:** Required
**Authorization:** Assigned Officer or ADMIN

**Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```

**Valid Status Transitions:**
- OPEN → ASSIGNED
- ASSIGNED → IN_PROGRESS
- IN_PROGRESS → RESOLVED
- RESOLVED → CLOSED

**Response (200 OK):**
```json
{
  "message": "Updated",
  "ticket": {
    "id": "ticket_123",
    "title": "Garbage Dump at Market",
    "status": "IN_PROGRESS",
    "updatedAt": "2026-06-19T12:00:00Z"
  }
}
```

**Status History Entry Created:**
```json
{
  "id": "hist_2",
  "ticketId": "ticket_123",
  "oldStatus": "ASSIGNED",
  "newStatus": "IN_PROGRESS",
  "changedBy": "officer_101",
  "createdAt": "2026-06-19T12:00:00Z"
}
```

---

### 7. Officer Dashboard (Officer Only)

**Endpoint:** `GET /api/officer/my-tickets`

**Authentication:** Required
**Authorization:** OFFICER role only

**Response (200 OK):**
```json
[
  {
    "id": "assign_789",
    "ticketId": "ticket_123",
    "officerId": "officer_101",
    "assignedAt": "2026-06-19T11:00:00Z",
    "ticket": {
      "id": "ticket_123",
      "title": "Garbage Dump at Market",
      "description": "Large garbage dump forming at main market area",
      "category": "Sanitation",
      "priority": "HIGH",
      "status": "IN_PROGRESS",
      "imageUrl": "https://example.com/image.jpg",
      "locationText": "Sector 5, Market Road",
      "createdById": "user_456",
      "createdBy": {
        "id": "user_456",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "CITIZEN"
      },
      "comments": [
        {
          "id": "comment_1",
          "ticketId": "ticket_123",
          "userId": "officer_101",
          "comment": "Investigation started",
          "createdAt": "2026-06-19T11:15:00Z"
        }
      ],
      "history": [
        {
          "id": "hist_1",
          "ticketId": "ticket_123",
          "oldStatus": "OPEN",
          "newStatus": "ASSIGNED",
          "changedBy": "admin_789",
          "createdAt": "2026-06-19T11:00:00Z"
        }
      ]
    }
  }
]
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing auth) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Error Response Format:**
```json
{
  "message": "Error description"
}
```

---

## Authentication

All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

Tokens are obtained from the auth endpoint:
```
POST /api/auth/login
```

---

## Implementation Status

✅ **Complete**
- Database schema with all models and enums
- Migration created and applied
- All 7 APIs implemented with role-based authorization
- Error handling and validation
- Prisma client generated
- TypeScript compilation successful

---

## Database Migration

**Migration Name:** `20260619075719_ticket_workflow`

**Tables Created:**
- TicketAssignment
- TicketComment
- TicketStatusHistory

**Enums Updated:**
- TicketStatus (added ASSIGNED value)

---

## Next Steps

1. ✅ Database schema and migration complete
2. ✅ All API endpoints implemented
3. 📋 Frontend integration (React/Next.js dashboard)
4. 📋 Real-time notifications (WebSocket)
5. 📋 Email notifications
6. 📋 Advanced filtering and search
7. 📋 Performance optimization with caching

