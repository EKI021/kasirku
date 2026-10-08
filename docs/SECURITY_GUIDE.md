# Toko Almas - Security Guide

## Overview

This document describes the security measures implemented in the Toko Almas POS & Stok Opname system, including recent fixes for authentication vulnerabilities.

## Recent Security Fixes (Authentication)

### Issue Fixed: Auto-Login After Logout + Page Reload

**Problem:** Users could log out, reload the page, and be automatically logged back in as the first user in the system (typically admin).

**Root Cause:**
1. The `isAuthenticated` state initialized to `true` when no user ID was found in localStorage
2. The `currentUser` state fell back to `systemUsers[0]` (first user/admin) when no saved session existed
3. This created a security vulnerability where logout was not persistent

**Fix Applied:**
1. Changed `isAuthenticated` initialization to return `false` when no session exists
2. Changed `currentUser` initialization to return `GUEST_USER` instead of first system user
3. Enhanced logout function to properly clear session data

**Files Modified:**
- `src/context/StoreContext.tsx` - Lines 231-252 (state initialization) and 495-514 (logout function)

## Authentication System

### Session Management
- User sessions stored in localStorage as `almas_user_id`
- Session persists across browser restarts until explicit logout
- Session validated against active user accounts on app initialization
- Disabled accounts cannot log in (checked on initialization and login)

### Login Security
- Username/password validation against system user database
- Passwords stored as plaintext (should be upgraded to bcrypt/argon2)
- Account status checking (active/disabled)
- Failed login attempts tracked in audit logs
- Successful logins tracked with timestamp

### Logout Security
- Explicit `localStorage.removeItem('almas_user_id')` on logout
- State cleared to `GUEST_USER` and `isAuthenticated = false`
- Cart and form data cleared on logout
- Audit log entry created for each logout

## Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **administrator** | Full system access including evidence logs, user management, settings, database reset |
| **owner** | Financial analytics, reports, most features except evidence logs & user management |
| **warehouse_admin** | Stock opname, product management, inventory |
| **cashier** | POS transactions, transaction history |

### Permission Checks
All permission checks use `canAccessTab()` function which validates:
- Current user role
- User authentication status
- Tab-specific access rules

## Data Protection

### LocalStorage Security
- Sensitive session data cleared on logout
- System users, categories, and settings persisted for offline capability
- No sensitive financial data stored in localStorage (synced to Firestore)

### Firestore Security Rules
- Rules enforce authentication for all write operations
- Read access controlled per collection
- Document IDs validated for format

### Password Security (Current Limitation)
**⚠️ WARNING:** Passwords currently stored in plaintext in Firestore and localStorage.

**Recommended Upgrade:**
```typescript
// Example using bcrypt (needs server-side or WebAssembly implementation)
import bcrypt from 'bcryptjs';

// Hash password before storage
const hashedPassword = await bcrypt.hash(password, 12);

// Verify on login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```