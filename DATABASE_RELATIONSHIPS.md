# CodeUnity Database Relationships Documentation

## Overview

This document outlines the implemented entity relationships in the CodeUnity application database. These relationships establish the core data model that supports real-time collaborative code editing, file management, and whiteboarding capabilities.

## Database Schema Relationships

### 1. User ↔ Room Relationship (One-to-Many)

**Type:** One-to-Many (1:N)

**Implementation:**
- **Model:** `Room` schema
- **Field:** `createdBy`
- **Reference:** `{ type: Schema.Types.ObjectId, ref: 'User' }`
- **Location:** `server/models/room.js` (Line 9)

**Description:**
Each room in the CodeUnity platform is created and owned by a single user. However, a user can create multiple rooms for different collaborative sessions. This relationship establishes room ownership and access control.

**Use Cases:**
- Tracking room creator
- Managing user-owned rooms
- Validating room ownership permissions

---

### 2. User ↔ File Relationship (One-to-Many)

**Type:** One-to-Many (1:N)

**Implementation:**
- **Model:** `File` schema
- **Field:** `userId`
- **Reference:** `{ type: Schema.Types.ObjectId, ref: 'User' }`
- **Location:** `server/models/file.js` (Line 13)

**Description:**
Each file created within the platform is associated with the user who created it. This relationship enables user-specific file tracking and audit trails, allowing the system to maintain a record of which user created each file.

**Use Cases:**
- Tracking file ownership
- User file statistics
- Audit logging and file history

---

### 3. Room ↔ File Relationship (One-to-Many)

**Type:** One-to-Many (1:N)

**Implementation:**
- **Model:** `File` schema
- **Field:** `roomId`
- **Reference:** `{ type: Schema.Types.ObjectId, ref: 'Room' }`
- **Location:** `server/models/file.js` (Line 12)

**Description:**
Files are organized and stored within rooms. Each file belongs to exactly one room, but a room can contain multiple files. This hierarchical relationship allows for logical organization of collaborative files and scoped file management within individual collaboration sessions.

**Use Cases:**
- File organization by room
- Fetching all files in a room
- Cleanup operations when a room is deleted
- File scope isolation for multi-room scenarios

---

### 4. Room ↔ TldrawState Relationship (One-to-One)

**Type:** One-to-One (1:1)

**Implementation:**
- **Model:** `TldrawState` schema
- **Field:** `roomId`
- **Reference:** `{ type: Schema.Types.ObjectId, ref: 'Room', unique: true }`
- **Location:** `server/models/tldrawState.js` (Line 7)

**Description:**
Each room maintains a single whiteboarding canvas state managed by the Tldraw library. The unique constraint ensures that each room has exactly one associated TldrawState document, preventing data duplication and maintaining data consistency.

**Use Cases:**
- Persistent whiteboard state storage
- Real-time whiteboard synchronization
- Drawing history and restoration

---

## Entity Relationship Diagram

```
┌──────────┐
│   User   │
└────┬─────┘
     │
     │ createdBy (1:N)
     │
     ▼
┌──────────────┐           ┌─────────────────┐
│    Room      │◄──────────┤  TldrawState    │
│              │  roomId   │   (1:1 unique)  │
└──────┬───────┘ (1:1)     └─────────────────┘
       │
       │ roomId (1:N)
       │
       ▼
┌──────────────┐
│    File      │
│              │
│ userId ──────┼──────► User (1:N)
└──────────────┘
```

---

## Data Flow Example

### Scenario: Collaborative Coding Session

1. **User A creates a Room**
   - `Room.createdBy` → User A's ObjectId

2. **User A creates a File "main.js" in the Room**
   - `File.roomId` → Room's ObjectId
   - `File.userId` → User A's ObjectId

3. **Whiteboard Canvas is automatically created**
   - `TldrawState.roomId` → Room's ObjectId (unique)

4. **User B joins the Room**
   - `Room` now has multiple connected users
   - `File` data is accessible to all room participants
   - `TldrawState` is shared in real-time

---

## Query Examples

### Fetch all rooms created by a user
```javascript
Room.find({ createdBy: userId })
```

### Fetch all files in a specific room
```javascript
File.find({ roomId: roomId })
```

### Fetch all files created by a user
```javascript
File.find({ userId: userId })
```

### Fetch a room with its whiteboard state
```javascript
Room.findById(roomId)
  .populate('createdBy')
TldrawState.findOne({ roomId: roomId })
```

### Fetch a room with all its files and metadata
```javascript
Room.findById(roomId)
  .populate('createdBy')
File.find({ roomId: roomId })
  .populate('userId', 'username email')
```

---

## Benefits of Implemented Relationships

1. **Data Integrity:** Foreign key relationships prevent orphaned documents and ensure referential consistency.

2. **Scalability:** Structured relationships allow efficient querying and indexing across the data model.

3. **Access Control:** User and room relationships enable role-based access control and permission validation.

4. **Real-time Synchronization:** Room-based relationships facilitate broadcast of changes to all connected users.

5. **Audit Trail:** User-file relationships maintain complete history of who created or modified files.

6. **Data Organization:** Hierarchical structure (User → Room → File) provides logical data compartmentalization.

---

## Database Indexes

For optimal query performance, the following indexes are recommended:

```javascript
// User-Room relationship
Room.collection.createIndex({ createdBy: 1 })

// Room-File relationship
File.collection.createIndex({ roomId: 1 })

// User-File relationship
File.collection.createIndex({ userId: 1 })

// Room-TldrawState relationship
TldrawState.collection.createIndex({ roomId: 1 }, { unique: true })
```

---

## Future Relationship Considerations

1. **User ↔ User (Friends/Collaborators):** For enhanced social features
2. **Room ↔ Permissions:** For granular access control management
3. **File ↔ Versions:** For version history and rollback capabilities
4. **User ↔ Notifications:** For activity tracking and alerts

---

## Conclusion

The implemented relationships in CodeUnity's database establish a robust foundation for collaborative code editing, file management, and real-time synchronization. The one-to-many and one-to-one relationships ensure data consistency while supporting the platform's core functionality of enabling multiple users to collaborate on shared code and whiteboarding sessions.

---

**Document Version:** 1.0  
**Last Updated:** October 21, 2025  
**Status:** Production Ready
