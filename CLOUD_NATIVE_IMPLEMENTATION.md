# Phase 5-8: Cloud-Native Features Implementation

## Overview
This document covers the transformation of your application from a basic CRUD system to a production-ready cloud-native platform with:
- Real-time notifications
- S3 image uploads with presigned URLs
- Admin analytics dashboard
- Scalable cloud architecture

---

## Phase 5: Notifications System

### What's New
A complete notification system that keeps users informed in real-time about ticket updates.

### Database Schema

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  title     String
  message   String
  isRead    Boolean  @default(false)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

**User Model Updated:**
```prisma
notifications Notification[]
```

### Notification Service (`src/services/notification.service.ts`)

```typescript
// Create notification
await createNotification(
  userId,
  "Ticket Assigned",
  "Your ticket has been assigned to an officer"
);

// Mark as read
await markAsRead(notificationId);

// Get user notifications
const notifications = await getUserNotifications(userId);

// Get unread count
const unreadCount = await getUnreadCount(userId);
```

### API Endpoints

#### Get Notifications
```http
GET /api/notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "notif_123",
      "userId": "user_456",
      "title": "New Ticket Assigned",
      "message": "Ticket 'Garbage Issue' has been assigned to you",
      "isRead": false,
      "createdAt": "2026-06-21T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

#### Mark Notification as Read
```http
POST /api/notifications/:id/read
```

**Response:**
```json
{
  "message": "Notification marked as read",
  "notification": { ... }
}
```

#### Get Unread Count
```http
GET /api/notifications/unread/count
```

**Response:**
```json
{
  "unreadCount": 3
}
```

### Automatic Notifications Triggered

#### 1. When Officer is Assigned
```
POST /api/tickets/:id/assign
  ↓
Notification sent to: Officer
Title: "New Ticket Assigned"
Message: "Ticket 'Title' has been assigned to you"

Also sent to: Ticket Creator
Title: "Ticket Assigned"
Message: "Your ticket 'Title' has been assigned to an officer"
```

#### 2. When Ticket Status Changes
```
POST /api/tickets/:id/status
  ↓
Notification sent to: Ticket Creator
Title: "Ticket Status Updated"
Message: "Your ticket 'Title' status changed to IN_PROGRESS"
```

---

## Phase 6: S3 Image Uploads with Presigned URLs

### How It Works

**User Flow:**
```
1. Citizen selects image
     ↓
2. Frontend requests presigned URL from backend
     ↓
3. Backend generates presigned URL valid for 15 minutes
     ↓
4. Frontend uploads directly to S3 (no server overhead)
     ↓
5. Citizen receives public S3 URL
     ↓
6. Citizen includes URL in Create Ticket request
     ↓
7. Ticket created with S3 image URL
```

### Backend API (Already Implemented)

#### Get Presigned Upload URL
```http
GET /api/uploads/presign
```

**Response:**
```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/uploads/abc123?AWSAccessKeyId=...",
  "publicUrl": "https://bucket.s3.amazonaws.com/uploads/abc123"
}
```

The `uploadUrl` is valid for 15 minutes and includes AWS authentication.

### Frontend Integration Example

```typescript
// Step 1: Get presigned URL
const response = await fetch('/api/uploads/presign', {
  method: 'GET',
  headers: { 'Authorization': `Bearer ${token}` }
});
const { uploadUrl, publicUrl } = await response.json();

// Step 2: Upload to S3 using presigned URL
const imageFile = document.getElementById('fileInput').files[0];
await fetch(uploadUrl, {
  method: 'PUT',
  headers: { 'Content-Type': imageFile.type },
  body: imageFile
});

// Step 3: Create ticket with image URL
await fetch('/api/tickets', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Garbage Issue",
    description: "Large pile at market",
    category: "Sanitation",
    imageUrl: publicUrl  // ← S3 URL from Step 1
  })
});
```

### Benefits
- ✅ Reduced backend load (direct S3 upload)
- ✅ Fast image upload (direct to S3)
- ✅ Secure (presigned URLs expire)
- ✅ Scalable (no file storage on server)
- ✅ CDN acceleration (S3 CloudFront)

---

## Phase 7: Admin Analytics Dashboard

### What's Included

#### API Endpoint
```http
GET /api/admin/stats
Authorization: Bearer <admin_token>
```

**Full Response:**
```json
{
  "tickets": {
    "total": 156,
    "status": {
      "open": 24,
      "assigned": 18,
      "inProgress": 32,
      "resolved": 56,
      "closed": 26
    },
    "priority": {
      "low": 12,
      "medium": 78,
      "high": 52,
      "urgent": 14
    },
    "avgResolutionDays": 5.32
  },
  "users": {
    "total": 48,
    "roles": {
      "citizen": 32,
      "officer": 12,
      "admin": 4
    }
  },
  "assignments": {
    "total": 98
  },
  "comments": {
    "total": 342
  },
  "categories": [
    { "name": "Sanitation", "count": 52 },
    { "name": "Roads", "count": 38 },
    { "name": "Water", "count": 31 },
    { "name": "Electricity", "count": 22 },
    { "name": "Others", "count": 13 }
  ]
}
```

### Dashboard Metrics

| Metric | Use Case |
|--------|----------|
| Total Tickets | Overall workload |
| Open/Assigned/In Progress | Current load distribution |
| Resolved/Closed | Completion rate |
| Priority Distribution | Workload intensity |
| Avg Resolution Time | Performance tracking |
| User Roles | Team structure |
| Top Categories | Resource planning |

### Admin Dashboard UI Ideas

```
┌─────────────────────────────────────────────┐
│         ADMIN ANALYTICS DASHBOARD           │
├─────────────────────────────────────────────┤
│                                             │
│  TICKET METRICS          USER METRICS       │
│  ├─ Total: 156          ├─ Total: 48       │
│  ├─ Open: 24            ├─ Citizens: 32    │
│  ├─ In Progress: 32     ├─ Officers: 12    │
│  ├─ Resolved: 56        └─ Admins: 4       │
│  └─ Closed: 26                             │
│                                             │
│  PRIORITY DISTRIBUTION    AVG RESOLUTION    │
│  ├─ Low: 12              ├─ Time: 5.32 days│
│  ├─ Medium: 78           └─ Completed: 82  │
│  ├─ High: 52                                │
│  └─ Urgent: 14                              │
│                                             │
│  TOP COMPLAINT CATEGORIES                  │
│  ├─ Sanitation: 52                          │
│  ├─ Roads: 38                               │
│  ├─ Water: 31                               │
│  ├─ Electricity: 22                         │
│  └─ Others: 13                              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Phase 8: Cloud Architecture

### Current Local Architecture
```
┌─────────────────┐
│   React/Next.js │
│    Frontend     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Express Backend │
│ (Node.js)       │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   PostgreSQL    │
│  (Local RDS)    │
└─────────────────┘
```

### Production Cloud Architecture (AWS)

```
┌────────────────────────────────────────────────────────┐
│              USERS / INTERNET                           │
└────────────────┬─────────────────────────────────────┘
                 │
         ┌───────v────────┐
         │   CloudFront   │ ← CDN for static files & images
         │   (Optional)   │
         └───────┬────────┘
                 │
         ┌───────v────────┐
         │  Application   │
         │  Load Balancer │
         │    (ALB)       │
         └───────┬────────┘
                 │
         ┌───────v────────────────────┐
         │  ECS Fargate Cluster       │
         │  ┌──────────────────────┐  │
         │  │ Backend Container 1  │  │
         │  │ (Express App)        │  │
         │  └──────────────────────┘  │
         │  ┌──────────────────────┐  │
         │  │ Backend Container 2  │  │
         │  │ (Express App)        │  │
         │  └──────────────────────┘  │
         │  ┌──────────────────────┐  │
         │  │ Backend Container N  │  │
         │  │ (Express App)        │  │
         │  └──────────────────────┘  │
         └───────┬────────────────────┘
                 │
         ┌───────v────────┐
         │  RDS Aurora    │
         │  PostgreSQL    │
         │  (Multi-AZ)    │
         └────────────────┘


     SUPPORTING SERVICES:

┌──────────────────────────────────────────┐
│           AWS S3 Buckets                 │
│  ├─ Images/uploads                       │
│  └─ Static files                         │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│          CloudWatch Logs                 │
│  ├─ Application logs                     │
│  ├─ Performance metrics                  │
│  └─ Error tracking                       │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│          SQS (Message Queue)             │
│  ├─ Notification jobs                    │
│  ├─ Email sending                        │
│  └─ Background tasks                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│       Lambda Workers (Optional)          │
│  ├─ Process SQS messages                 │
│  ├─ Send notifications                   │
│  └─ Generate reports                     │
└──────────────────────────────────────────┘
```

### Architecture Benefits

| Component | Benefit |
|-----------|---------|
| **ALB** | Distribute traffic across instances |
| **ECS Fargate** | Auto-scaling, serverless containers |
| **RDS Multi-AZ** | High availability, automatic failover |
| **S3** | Infinite scalability, durability |
| **CloudFront** | Global CDN, faster image delivery |
| **SQS** | Decouple services, reliable messaging |
| **CloudWatch** | Monitoring, alerting, debugging |

### Deployment Steps

#### 1. Containerize Application
```bash
# Build Docker image
docker build -t community-request-platform .

# Push to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.ap-south-1.amazonaws.com
docker tag community-request-platform:latest <account>.dkr.ecr.ap-south-1.amazonaws.com/community-request-platform:latest
docker push <account>.dkr.ecr.ap-south-1.amazonaws.com/community-request-platform:latest
```

#### 2. Deploy to ECS
```bash
# Update ECS service with new image
aws ecs update-service --cluster community-platform --service backend --force-new-deployment
```

#### 3. Monitor Deployment
```bash
# Watch CloudWatch logs
aws logs tail /ecs/community-platform --follow
```

### Scaling Configuration

**Auto-scaling Policy:**
```
Scale Up:
- CPU > 70% for 2 minutes
- Memory > 80% for 2 minutes
- Request count > 1000 per minute

Scale Down:
- CPU < 30% for 5 minutes
- Memory < 50% for 5 minutes
```

**Target Instances:** 2-10 containers

### Cost Optimization

| Strategy | Savings |
|----------|---------|
| ECS Fargate Spot | 70% cheaper |
| Reserved RDS | 40% cheaper |
| S3 Intelligent-Tiering | 20-30% cheaper |
| CloudFront Caching | Reduced bandwidth |

---

## Complete Feature Summary

### Core System (✅ Complete)
- User authentication & authorization
- Ticket CRUD operations
- Status workflow
- Comments & discussion
- Status history audit trail

### Notifications (✅ Complete)
- Automatic notifications on assignment
- Automatic notifications on status change
- Mark as read functionality
- Unread count tracking

### File Uploads (✅ Complete)
- Presigned S3 URLs
- Direct upload to S3
- Image attachment to tickets
- No server storage needed

### Analytics (✅ Complete)
- Ticket statistics by status
- Ticket statistics by priority
- User role distribution
- Category breakdown
- Average resolution time
- Total assignments & comments

### Cloud Infrastructure (📋 Documented)
- Load balancing
- Auto-scaling
- Database replication
- CDN delivery
- Log aggregation
- Message queue
- Lambda workers

---

## API Summary

### All Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/tickets` | Create ticket | ✅ |
| GET | `/api/tickets` | List tickets | ✅ |
| GET | `/api/tickets/:id` | Get ticket | ✅ |
| POST | `/api/tickets/:id/assign` | Assign officer | ✅ Admin |
| POST | `/api/tickets/:id/comment` | Add comment | ✅ |
| POST | `/api/tickets/:id/status` | Update status | ✅ Officer/Admin |
| GET | `/api/officer/my-tickets` | Officer dashboard | ✅ Officer |
| GET | `/api/notifications` | Get notifications | ✅ |
| POST | `/api/notifications/:id/read` | Mark read | ✅ |
| GET | `/api/notifications/unread/count` | Unread count | ✅ |
| GET | `/api/admin/stats` | Analytics | ✅ Admin |
| GET | `/api/uploads/presign` | Get S3 URL | ✅ |

---

## Database Schema (Complete)

```
User
├─ id, name, email, role
├─ refreshTokens
├─ createdTickets
├─ assignedTickets
├─ comments
└─ notifications ← NEW

Ticket
├─ id, title, description, category, priority, status
├─ imageUrl, locationText
├─ createdBy
├─ assignments
├─ comments
└─ history

TicketAssignment
├─ id, ticketId, officerId, assignedAt

TicketComment
├─ id, ticketId, userId, comment, createdAt

TicketStatusHistory
├─ id, ticketId, oldStatus, newStatus, changedBy, createdAt

Notification ← NEW
├─ id, userId, title, message, isRead, createdAt
```

---

## Next Steps: Frontend Development

### Pages to Build

1. **Authentication**
   - Login page
   - Registration page
   - Password reset

2. **Citizen Portal**
   - Create complaint form (with image upload)
   - My tickets list
   - Ticket detail view
   - Notification center

3. **Officer Dashboard**
   - Assigned tickets list
   - Ticket detail with status update
   - Comment thread
   - My statistics

4. **Admin Dashboard**
   - All tickets overview
   - Assign officer modal
   - Analytics dashboard
   - User management

### Frontend Technology
- React/Next.js
- TypeScript
- TailwindCSS/Chakra UI
- React Query (data fetching)
- Socket.io (real-time updates)

---

## Summary

You now have a **production-ready, cloud-native platform** with:

✅ **Robust Backend**
- All APIs implemented
- Comprehensive error handling
- Input validation
- Type safety

✅ **Real-time Features**
- Automatic notifications
- Status updates
- User engagement

✅ **Cloud-Ready Architecture**
- S3 integration
- Analytics dashboard
- Scalable design
- Monitoring capability

✅ **Documentation**
- Complete API reference
- Cloud architecture diagrams
- Deployment instructions
- Cost optimization tips

**You're ready to:**
1. Deploy to AWS
2. Build the frontend
3. Go live! 🚀

