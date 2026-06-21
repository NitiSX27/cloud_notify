#!/bin/bash
# Ticket Workflow API - cURL Testing Examples
# Use these commands to test the ticket workflow APIs

# ============================================
# SETUP - Save these tokens for use in requests
# ============================================

# 1. Register/Login as Citizen
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Citizen",
    "email": "citizen@example.com",
    "password": "password123",
    "role": "CITIZEN"
  }'

# Response should contain access_token and refresh_token
# Save CITIZEN_TOKEN from response

# 2. Register/Login as Officer
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Officer",
    "email": "officer@example.com",
    "password": "password123",
    "role": "OFFICER"
  }'

# Save OFFICER_TOKEN from response

# 3. Register/Login as Admin
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "password123",
    "role": "ADMIN"
  }'

# Save ADMIN_TOKEN from response

# ============================================
# API 1: CREATE TICKET (As Citizen)
# ============================================

CITIZEN_TOKEN="your_citizen_access_token_here"

curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Garbage Dump at Market",
    "description": "Large amount of garbage is piling up at the main market area, creating unhygienic conditions",
    "category": "Sanitation",
    "priority": "HIGH",
    "locationText": "Sector 5, Market Road"
  }'

# Save the returned ticket ID as TICKET_ID
# TICKET_ID="returned_ticket_id_here"

# ============================================
# API 2: GET ALL TICKETS
# ============================================

# As Admin (sees all tickets)
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# As Citizen (sees only their tickets)
curl -X GET http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $CITIZEN_TOKEN"

# ============================================
# API 3: GET TICKET DETAILS
# ============================================

TICKET_ID="returned_ticket_id_here"

curl -X GET http://localhost:3000/api/tickets/$TICKET_ID \
  -H "Authorization: Bearer $CITIZEN_TOKEN"

# ============================================
# API 4: ASSIGN OFFICER (As Admin)
# ============================================

OFFICER_ID="officer_user_id_from_registration"

curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/assign \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officerId": "'$OFFICER_ID'"
  }'

# Status will automatically change to ASSIGNED

# ============================================
# API 5: ADD COMMENT (As Officer)
# ============================================

curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/comment \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Investigation started. Will visit the site tomorrow morning."
  }'

# ============================================
# API 6: UPDATE TICKET STATUS (As Officer)
# ============================================

# Change from ASSIGNED to IN_PROGRESS
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'

# Add another comment
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/comment \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Site visited. Coordinating with sanitation department for cleanup."
  }'

# Change from IN_PROGRESS to RESOLVED
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/status \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "RESOLVED"
  }'

# Add resolution comment
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/comment \
  -H "Authorization: Bearer $OFFICER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "comment": "Cleanup completed. Area has been sanitized."
  }'

# ============================================
# API 7: OFFICER DASHBOARD
# ============================================

curl -X GET http://localhost:3000/api/officer/my-tickets \
  -H "Authorization: Bearer $OFFICER_TOKEN"

# ============================================
# VERIFICATION: Get Final Ticket Details
# ============================================

# Check complete ticket with all comments and history
curl -X GET http://localhost:3000/api/tickets/$TICKET_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# ============================================
# Expected Workflow Execution
# ============================================

# 1. Citizen creates complaint → Status: OPEN
# 2. Admin assigns officer → Status: ASSIGNED, creates TicketStatusHistory entry
# 3. Officer adds comment → Investigation started
# 4. Officer updates status → Status: IN_PROGRESS, creates TicketStatusHistory entry
# 5. Officer adds comment → Site visit completed
# 6. Officer updates status → Status: RESOLVED, creates TicketStatusHistory entry
# 7. Officer adds comment → Work completed
# 8. Admin can review and close → Status: CLOSED (if needed)

# ============================================
# Testing without Token (Should Fail)
# ============================================

# This should return 401 Unauthorized
curl -X GET http://localhost:3000/api/tickets

# ============================================
# Testing Wrong Role (Should Fail)
# ============================================

# Citizen trying to assign officer (should fail - requires ADMIN)
curl -X POST http://localhost:3000/api/tickets/$TICKET_ID/assign \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "officerId": "'$OFFICER_ID'"
  }'

# ============================================
# Testing Invalid Data (Should Fail)
# ============================================

# Missing required fields
curl -X POST http://localhost:3000/api/tickets \
  -H "Authorization: Bearer $CITIZEN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "No"
  }'

# ============================================
# Database Verification
# ============================================

# You can verify the database with Prisma Studio:
# npm run prisma:studio

# This will open a UI where you can browse:
# - Users (with roles)
# - Tickets (with status)
# - TicketAssignments (officer assignments)
# - TicketComments (all comments)
# - TicketStatusHistory (all status changes)

