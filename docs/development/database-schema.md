# The Give Hub - Database Schema

## Overview

The Give Hub uses MongoDB as its primary database, allowing for flexible schema design and document-oriented storage. This document outlines the database collections, their structure, relationships, and indexing strategies.

## Database Structure

The database consists of the following main collections:

1. `users` - User accounts and profiles
2. `campaigns` - Fundraising campaigns
3. `donations` - Donation records
4. `transactions` - Financial transaction records
5. `documents` - User verification documents
6. `notifications` - User notifications
7. `settings` - Application settings

## Collection Schemas

### Users Collection

Stores user account information, profiles, and preferences.

```javascript
{
  "_id": ObjectId,                // Unique MongoDB ID
  "email": String,                // User's email address (unique)
  "username": String,             // Username (unique)
  "passwordHash": String,         // Bcrypt hashed password
  "displayName": String,          // Public display name
  "createdAt": Date,              // Account creation timestamp
  "updatedAt": Date,              // Last update timestamp
  "status": String,               // "active", "inactive", "suspended"
  "role": String,                 // "user", "admin", "moderator"
  "emailVerified": Boolean,       // Whether email is verified
  "personalInfo": {
    "firstName": String,          // First name
    "lastName": String,           // Last name
    "phone": String,              // Phone number
    "location": String,           // General location text
    "address": {                  // Optional detailed address
      "street": String,
      "city": String,
      "state": String,
      "postalCode": String,
      "country": String
    }
  },
  "profile": {
    "bio": String,                // User biography
    "avatar": String,             // Avatar image URL
    "website": String,            // Personal website
    "socialMedia": {              // Social media links
      "facebook": String,
      "twitter": String,
      "instagram": String,
      "linkedin": String
    }
  },
  "preferences": {
    "emailNotifications": {       // Email notification preferences
      "campaignUpdates": Boolean,
      "newDonations": Boolean,
      "milestones": Boolean,
      "marketing": Boolean
    },
    "currency": String,           // Preferred currency
    "language": String,           // Preferred language
    "theme": String               // UI theme preference
  },
  "verification": {
    "identityVerified": Boolean,  // Identity verification status
    "kycStatus": String,          // "pending", "approved", "rejected"
    "kycCompletedAt": Date,       // KYC completion date
    "kycProvider": String,        // Identity verification provider
    "kycReference": String        // Reference ID from provider
  },
  "stats": {
    "campaignsCreated": Number,   // Number of campaigns created
    "totalDonated": Number,       // Total amount donated
    "donationCount": Number       // Total number of donations
  },
  "tokens": {
    "refreshTokens": [{           // Array of valid refresh tokens
      "token": String,
      "expiresAt": Date,
      "createdAt": Date,
      "userAgent": String,
      "ipAddress": String
    }]
  },
  "lastLogin": {
    "date": Date,                 // Last login timestamp
    "ipAddress": String,          // IP address
    "userAgent": String           // Browser user agent
  }
}
```

#### Indexes:
- `email`: Unique index
- `username`: Unique index
- `status`: For filtering active/inactive users
- `role`: For permissions filtering
- `createdAt`: For sorting by creation date

### Campaigns Collection

Stores fundraising campaign details.

```javascript
{
  "_id": ObjectId,                 // Unique MongoDB ID
  "title": String,                 // Campaign title
  "slug": String,                  // URL-friendly slug
  "description": String,           // Full campaign description
  "summary": String,               // Short summary
  "type": String,                  // "crowdfunding", "microloan", etc.
  "category": String,              // Campaign category
  "tags": [String],                // Array of tags
  "creatorId": ObjectId,           // Reference to users collection
  "teamMembers": [{                // Additional team members
    "userId": ObjectId,            // Reference to users collection
    "role": String,                // Role in the campaign
    "permissions": [String]        // Specific permissions
  }],
  "createdAt": Date,               // Creation timestamp
  "updatedAt": Date,               // Last update timestamp
  "status": String,                // "draft", "pending", "active", "completed", "rejected"
  "moderationNotes": String,       // Admin notes on moderation
  "publishedAt": Date,             // Date when campaign became active
  "closedAt": Date,                // Date when campaign was completed/closed
  "funding": {
    "goalAmount": Number,          // Funding goal amount
    "raisedAmount": Number,        // Current amount raised
    "currency": String,            // Currency code (USD, EUR, etc.)
    "donorCount": Number,          // Number of donors
    "minContribution": Number      // Minimum donation amount
  },
  "deadline": Date,                // Campaign end date
  "location": {
    "country": String,             // Country
    "region": String,              // State/province/region
    "city": String,                // City
    "coordinates": {               // Geographic coordinates
      "latitude": Number,
      "longitude": Number
    }
  },
  "impact": {
    "metrics": [{                  // Impact measurement metrics
      "name": String,              // Metric name
      "baseline": Number,          // Starting value
      "current": Number,           // Current value
      "target": Number,            // Target value
      "unit": String               // Unit of measurement
    }]
  },
  "timeline": {
    "milestones": [{               // Key milestones
      "title": String,             // Milestone title
      "description": String,       // Milestone description
      "date": Date,                // Target date
      "status": String,            // "pending", "in_progress", "completed"
      "completedAt": Date          // Actual completion date
    }]
  },
  "media": [{                      // Media gallery
    "type": String,                // "image", "video", "document"
    "url": String,                 // Media URL
    "caption": String,             // Caption/description
    "isFeatured": Boolean,         // Whether it's the main media
    "order": Number                // Display order
  }],
  "updates": [{                    // Campaign updates/posts
    "title": String,               // Update title
    "content": String,             // Update content
    "createdAt": Date,             // Post date
    "createdBy": ObjectId,         // User who posted the update
    "media": [String]              // Update media URLs
  }],
  "rewards": [{                    // Backer rewards
    "title": String,               // Reward title
    "description": String,         // Reward description
    "minAmount": Number,           // Minimum donation to qualify
    "quantity": Number,            // Available quantity
    "claimed": Number,             // Number claimed
    "estimatedDelivery": Date      // Estimated delivery date
  }],
  "faq": [{                        // Frequently asked questions
    "question": String,            // Question
    "answer": String,              // Answer
    "order": Number                // Display order
  }],
  "stats": {
    "views": Number,               // Page view count
    "favorites": Number,           // Number of favorites/saves
    "shares": Number,              // Number of shares
    "averageDonation": Number      // Average donation amount
  },
  "seo": {                         // SEO metadata
    "title": String,               // SEO title
    "description": String,         // Meta description
    "keywords": [String],          // Meta keywords
    "ogImage": String              // Open Graph image URL
  }
}
```

#### Indexes:
- `slug`: Unique index for URL lookups
- `creatorId`: For finding user's campaigns
- `status`: For filtering by status
- `category`: For category filtering
- `funding.raisedAmount`: For sorting by amount raised
- `createdAt`: For sorting by creation date
- `deadline`: For sorting by deadline
- `location.country`, `location.region`: For geographic filtering
- Text index on `title`, `description`, `summary` for search functionality

### Donations Collection

Records individual donations to campaigns.

```javascript
{
  "_id": ObjectId,                // Unique MongoDB ID
  "campaignId": ObjectId,         // Reference to campaigns collection
  "donorId": ObjectId,            // Reference to users collection (if authenticated)
  "amount": Number,               // Donation amount
  "currency": String,             // Currency code
  "date": Date,                   // Donation date
  "status": String,               // "pending", "completed", "refunded", "failed"
  "transactionId": String,        // Payment processor transaction ID
  "paymentMethod": {              // Payment method details
    "type": String,               // "credit_card", "paypal", "bank_transfer", etc.
    "lastFour": String,           // Last four digits if applicable
    "provider": String            // Payment processor name
  },
  "guestInfo": {                  // For non-authenticated donors
    "name": String,               // Donor name
    "email": String,              // Donor email
    "country": String,            // Donor country
    "ipAddress": String           // IP address
  },
  "anonymous": Boolean,           // Whether donation should be displayed as anonymous
  "message": String,              // Optional message from donor
  "publiclyVisible": Boolean,     // Whether to show in public donor list
  "rewardId": ObjectId,           // Selected reward if applicable
  "rewardDetails": {              // Reward delivery details
    "shippingAddress": {
      "name": String,
      "street": String,
      "city": String,
      "state": String,
      "postalCode": String,
      "country": String
    },
    "fulfillmentStatus": String,  // "pending", "shipped", "delivered"
    "trackingNumber": String      // Shipping tracking number
  },
  "metadata": {                   // Additional custom metadata
    "referrer": String,           // Referral source
    "campaign": String,           // Marketing campaign
    "utm_source": String,         // UTM tracking parameters
    "utm_medium": String,
    "utm_campaign": String
  }
}
```

#### Indexes:
- `campaignId`: For finding donations to a campaign
- `donorId`: For finding a user's donations
- `date`: For sorting by date
- `status`: For filtering by status
- `amount`: For sorting by amount
- Compound index on `campaignId` and `date` for efficient campaign donation listing

### Transactions Collection

Records financial transactions including donations, refunds, and payouts.

```javascript
{
  "_id": ObjectId,                 // Unique MongoDB ID
  "type": String,                  // "donation", "refund", "payout", "fee"
  "status": String,                // "pending", "completed", "failed"
  "amount": Number,                // Transaction amount
  "fee": Number,                   // Platform or payment processor fee
  "net": Number,                   // Net amount after fees
  "currency": String,              // Currency code
  "date": Date,                    // Transaction date
  "description": String,           // Transaction description
  "metadata": {                    // Transaction metadata
    "campaignId": ObjectId,        // Associated campaign if applicable
    "donationId": ObjectId,        // Associated donation if applicable
    "userId": ObjectId             // Associated user if applicable
  },
  "paymentDetails": {              // Payment processing details
    "provider": String,            // Payment provider name
    "transactionId": String,       // Provider's transaction ID
    "paymentMethod": String,       // Payment method used
    "status": String,              // Provider's status code
    "errorCode": String,           // Error code if failed
    "errorMessage": String         // Error message if failed
  },
  "recipient": {                   // Recipient details for payouts
    "userId": ObjectId,            // User receiving funds
    "name": String,                // Recipient name
    "type": String,                // "individual", "organization"
    "accountType": String,         // "bank_account", "paypal", etc.
    "accountDetails": {            // Account details (masked)
      "bank": String,              // Bank name
      "accountLastFour": String,   // Last four digits of account
      "routingNumber": String      // Routing number (masked)
    }
  }
}
```

#### Indexes:
- `type`: For filtering by transaction type
- `status`: For filtering by status
- `date`: For sorting by date
- `metadata.campaignId`: For finding campaign-related transactions
- `metadata.userId`: For finding user-related transactions
- `metadata.donationId`: For linking to donations

### Documents Collection

Stores user verification documents and campaign-related files.

```javascript
{
  "_id": ObjectId,                 // Unique MongoDB ID
  "userId": ObjectId,              // Associated user
  "type": String,                  // "id_card", "passport", "proof_of_address", "campaign_document"
  "name": String,                  // Document original name
  "filename": String,              // Stored filename
  "path": String,                  // File path
  "mimeType": String,              // MIME type
  "size": Number,                  // File size in bytes
  "uploadedAt": Date,              // Upload timestamp
  "status": String,                // "pending", "approved", "rejected"
  "verifiedAt": Date,              // Verification timestamp
  "verifiedBy": ObjectId,          // Admin who verified document
  "rejectionReason": String,       // Reason if rejected
  "metadata": {                    // Additional metadata
    "campaignId": ObjectId,        // Associated campaign if applicable
    "description": String,         // Document description
    "expiryDate": Date,            // Document expiry date if applicable
    "issuedBy": String,            // Issuing authority
    "documentNumber": String       // Document reference number
  }
}
```

#### Indexes:
- `userId`: For finding user's documents
- `type`: For filtering by document type
- `status`: For filtering by verification status
- `metadata.campaignId`: For finding campaign documents

### Notifications Collection

Stores user notifications.

```javascript
{
  "_id": ObjectId,                 // Unique MongoDB ID
  "userId": ObjectId,              // Recipient user ID
  "type": String,                  // Notification type
  "title": String,                 // Notification title
  "message": String,               // Notification message
  "read": Boolean,                 // Whether it's been read
  "createdAt": Date,               // Creation timestamp
  "readAt": Date,                  // When it was read
  "expiresAt": Date,               // Expiration date
  "priority": String,              // "low", "normal", "high", "urgent"
  "data": {                        // Related data for deep linking
    "campaignId": ObjectId,        // Related campaign if applicable
    "donationId": ObjectId,        // Related donation if applicable
    "url": String,                 // Action URL
    "imageUrl": String             // Optional image URL
  },
  "deliveryStatus": {              // Delivery status tracking
    "email": {
      "sent": Boolean,             // Whether email was sent
      "sentAt": Date               // When email was sent
    },
    "push": {
      "sent": Boolean,             // Whether push was sent
      "sentAt": Date               // When push was sent
    }
  }
}
```

#### Indexes:
- `userId`: For finding user's notifications
- `read`: For filtering read/unread notifications
- `createdAt`: For sorting by date
- `expiresAt`: For filtering expired notifications
- Compound index on `userId` and `read` for efficient unread notification counting

### Settings Collection

Stores application settings and configuration.

```javascript
{
  "_id": ObjectId,                 // Unique MongoDB ID
  "key": String,                   // Setting key (unique)
  "value": Mixed,                  // Setting value (any type)
  "type": String,                  // Data type for validation
  "description": String,           // Setting description
  "group": String,                 // Grouping category
  "isPublic": Boolean,             // Whether visible to regular users
  "updatedAt": Date,               // Last update timestamp
  "updatedBy": ObjectId            // Admin who last updated
}
```

#### Indexes:
- `key`: Unique index for lookup
- `group`: For grouping settings
- `isPublic`: For filtering public settings

## Relationships

The database uses references between collections to establish relationships:

1. **User <-> Campaigns**: One-to-many
   - User creates multiple campaigns
   - `campaigns.creatorId` references `users._id`

2. **User <-> Donations**: One-to-many
   - User makes multiple donations
   - `donations.donorId` references `users._id`

3. **Campaign <-> Donations**: One-to-many
   - Campaign receives multiple donations
   - `donations.campaignId` references `campaigns._id`

4. **User <-> Documents**: One-to-many
   - User uploads multiple verification documents
   - `documents.userId` references `users._id`

5. **Campaign <-> Documents**: One-to-many
   - Campaign has multiple supporting documents
   - `documents.metadata.campaignId` references `campaigns._id`

6. **User <-> Notifications**: One-to-many
   - User receives multiple notifications
   - `notifications.userId` references `users._id`

## Indexing Strategy

### General Indexing Guidelines

1. **Primary Keys**: MongoDB automatically indexes the `_id` field
2. **Foreign Keys**: Index all foreign key fields (`userId`, `campaignId`, etc.)
3. **Query Fields**: Index fields commonly used in query conditions
4. **Sort Fields**: Index fields used for sorting
5. **Compound Indexes**: Use for queries that filter on multiple fields
6. **Text Indexes**: Use for full-text search capabilities

### Performance Considerations

1. **Selective Indexes**: Create indexes that match common query patterns
2. **Covered Queries**: Design indexes to cover common queries (include all fields in query)
3. **Avoid Redundant Indexes**: Remove unused or duplicate indexes
4. **Background Indexing**: Create indexes in the background on production
5. **Index Size**: Monitor index size and memory usage

## Data Validation

MongoDB schema validation can be applied to enforce data integrity:

```javascript
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["email", "username", "passwordHash", "createdAt", "status"],
      properties: {
        email: {
          bsonType: "string",
          pattern: "^.+@.+\\..+$"
        },
        username: {
          bsonType: "string",
          minLength: 3,
          maxLength: 30
        },
        status: {
          enum: ["active", "inactive", "suspended"]
        }
        // Additional validation rules...
      }
    }
  }
});
```

## Data Migration and Evolution

As the application evolves, data migrations may be needed:

1. **Incremental Updates**: Update documents one by one as they're accessed
2. **Batch Migration**: Update documents in batches using MongoDB's bulk operations
3. **Schema Versioning**: Add a version field to track document schema version
4. **Migration Scripts**: Develop scripts for one-time schema migrations

Example migration script:
```javascript
// Update all campaigns to add a new field with default value
db.campaigns.updateMany(
  { seo: { $exists: false } },
  { $set: { seo: { title: "", description: "", keywords: [] } } }
);
```

## Backup and Recovery

### Backup Strategy

1. **Regular Backups**: Configure daily full database backups
2. **Incremental Backups**: Implement incremental backups using MongoDB oplog
3. **Geographically Distributed Backups**: Store backups in multiple locations
4. **Backup Verification**: Regularly test restoration process

### Recovery Procedures

1. **Point-in-Time Recovery**: Ability to restore the database to any point in time
2. **Disaster Recovery Plan**: Documented procedures for various failure scenarios
3. **Data Consistency Checks**: Verify data integrity after restoration

## Database Monitoring

Key metrics to monitor:

1. **Query Performance**: Track slow queries and optimize them
2. **Index Usage**: Monitor index usage statistics
3. **Storage Growth**: Track collection and index size growth
4. **Connection Usage**: Monitor number of open database connections
5. **Replication Lag**: If using replication, monitor lag between primary and secondaries

## Conclusion

This MongoDB schema design for The Give Hub provides:

1. **Flexibility**: Document model allows for easy schema evolution
2. **Performance**: Strategic indexing for common query patterns
3. **Integrity**: Data validation and relationship management
4. **Scalability**: Structured for horizontal scaling as the platform grows

The schema can evolve with the application, accommodating new features while maintaining backward compatibility.
