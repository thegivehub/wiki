# The Give Hub - Technical Documentation

## Project Overview

The Give Hub is a crowdfunding platform that enables users to create, manage, and support fundraising campaigns. The application features user authentication, campaign management, donor interactions, and administrative capabilities.

## System Architecture

### Frontend
- **UI Framework**: Custom HTML/CSS/JavaScript implementation
- **Client-Side Logic**: Vanilla JavaScript with some modern ES6+ features
- **Styling**: Custom CSS with responsive design

### Backend
- **Server Language**: PHP
- **Database**: MongoDB (using PHP MongoDB extension)
- **API Structure**: RESTful API endpoints with JSON responses

### Authentication
- **Method**: JWT (JSON Web Tokens)
- **Storage**: LocalStorage for tokens and user data

## Core Components

### 1. User Interface

#### Navigation System
The main interface is built around a sidebar navigation that provides access to:
- Dashboard
- Campaign browsing
- Campaign creation and management
- User settings
- Donor management
- Volunteer management

#### Theme System
The application supports both light and dark themes:
- User preferences are stored in localStorage
- Theme toggling is handled by the `app.theme.init()` function in `app.js`
- CSS variables control theme-specific styling

### 2. Authentication System

Authentication is handled through:
- Login form (`login.html`) 
- JWT token management (`APIConfig.js`)
- Server-side validation (`api.php`)

The login flow:
1. User submits credentials through the login form
2. Server validates credentials and returns JWT tokens
3. Tokens are stored in localStorage
4. Authenticated API requests include the token in the Authorization header

### 3. Campaign Management

Campaigns are the core entity of the platform:

#### Campaign Creation
The `new-campaign.html` file implements a step-by-step wizard for creating campaigns:
1. Basic Information: title, location, type, description
2. Funding Goals: funding goal, deadline, minimum contribution
3. Media: images and other visual assets
4. Review: final review of campaign details before submission

#### Campaign Browsing
Users can browse campaigns via:
- `browse.html`: General campaign browsing
- `my-campaigns.html`: User's own campaigns

#### Campaign Detail
The `campaign-detail.html` page shows comprehensive information about a campaign, including:
- Campaign description
- Funding progress
- Location (with map)
- Media gallery
- Impact metrics
- Timeline milestones

#### Campaign Editing
The `campaign-edit.html` page allows campaign creators to:
- Update campaign details
- Manage media
- Add/edit impact metrics and milestones
- Configure SEO settings
- Share the campaign on social media

### 4. API System

The API structure is implemented in `api.php` and supporting files:

#### Core API Framework
- Dynamic endpoint resolution based on URL patterns
- Automatic class loading for models
- Standard CRUD operations for all resources
- JSON response formatting

#### Models
Models like `Campaign.php`, `Users.php`, etc. implement:
- Database operations
- Business logic
- Input validation
- Data transformation

#### Database Abstraction
The database layer consists of:
- `db.php`: Database connection management
- `MongoCollection.php`: MongoDB collection abstraction
- `Model.php`: Base model with common CRUD operations
- `Collection.php`: Collection-specific operations

## File Structure & Purpose

### Frontend Files

#### Core Application Files
- `index.html`: Main application shell with sidebar navigation and iframe content
- `app.js`: Core application logic including navigation, theming, and state management
- `style.css`: Global styles for the application

#### Authentication Files
- `login.html`: Login form
- `login.css`: Styles for login and authentication pages

#### Campaign Management
- `new-campaign.html`: Campaign creation wizard
- `my-campaigns.html`: List of user's campaigns
- `campaign-detail.html`: Campaign details view
- `campaign-edit.html`: Campaign editing interface
- `browse.html`: Campaign browsing interface

#### User Management
- `settings.html`: User settings and profile management

### Backend Files

#### API Framework
- `api.php`: Main API entry point and request handler

#### Models
- `Campaign.php`: Campaign data model
- `Users.php`: User data model
- `Model.php`: Base model class
- `MongoModel.php`: MongoDB-specific model extension

#### Database
- `db.php`: Database connection management
- `MongoCollection.php`: MongoDB collection abstraction

#### Utility Files
- `image-upload.php`: Handles image upload functionality
- `document-api.php`: Handles document management

## Authentication Flow

1. User enters credentials in `login.html`
2. Form is submitted to `/api/auth/login` endpoint
3. Server validates credentials and generates JWT token
4. Token is stored in localStorage
5. Authenticated requests include token in Authorization header
6. Token expiration is handled through refresh tokens

## Campaign Creation Flow

1. User navigates to "Create Campaign" from navigation
2. Step 1: User enters basic campaign information
3. Step 2: User sets funding goals and deadlines
4. Step 3: User uploads media assets
5. Step 4: User reviews and submits campaign
6. Campaign is created with "pending" status
7. Admin reviews campaign before it becomes publicly visible

## Data Models

### User Model
- Basic information (name, email, username)
- Authentication details
- Profile information
- Preferences

### Campaign Model
- Basic information (title, description, type)
- Location information (country, region, coordinates)
- Funding details (goal, raised amount, currency)
- Timeline (creation date, deadline, milestones)
- Media (images, videos)
- Impact metrics
- Creator information

### Donation Model
- Amount
- Campaign reference
- Donor reference
- Date
- Status

## Technical Implementation Notes

### JWT Authentication
Authentication is implemented using JWT tokens with:
- Access tokens for short-term authentication
- Refresh tokens for obtaining new access tokens
- Token payload contains user ID and permissions

### MongoDB Integration
The MongoDB integration uses:
- PHP MongoDB extension
- Custom abstraction layers for collections and models
- ID conversion between string and MongoDB ObjectId
- Dynamic collection management

### File Uploads
File uploads are handled through:
- `image-upload.php` for image processing
- Base64 encoding for preview
- Server-side validation for file types and sizes
- Storage in `/uploads/campaign_images/` directory

### Map Integration
Campaign locations are displayed using:
- Leaflet.js for interactive maps
- OpenStreetMap as the tile provider
- Coordinates stored in campaign data

### Responsive Design
The application is responsive through:
- Mobile-first design approach
- CSS media queries
- Flexible grid layouts
- Responsive sidebar navigation

## Security Considerations

1. **Authentication**: JWT tokens with proper expiration and refresh mechanisms
2. **Input Validation**: Server-side validation for all form inputs
3. **CSRF Protection**: Token-based protection
4. **XSS Protection**: Content sanitization
5. **File Upload Security**: Type validation and size limits
6. **Database Security**: Parameterized queries and proper authentication

## Browser Compatibility

The application is designed to work in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome for Android)

## Deployment Requirements

### Server Requirements
- PHP 7.4+
- MongoDB 4.0+
- Apache/Nginx web server
- PHP MongoDB extension
- mod_rewrite (Apache) or equivalent for URL rewriting

### Client Requirements
- Modern browser with JavaScript enabled
- Cookies enabled for session management
- Local storage support for token management

## Extension Points

The application architecture allows for extensions in:

1. **Payment Integration**: Add payment processors (Stripe, PayPal)
2. **Social Media Integration**: Enhanced sharing capabilities
3. **Notification System**: Email and in-app notifications
4. **Analytics Dashboard**: Campaign performance metrics
5. **Content Management**: Rich text editing for campaign descriptions
6. **Multi-language Support**: Internationalization infrastructure

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check localStorage for valid tokens
   - Verify server is properly validating tokens
   - Check for token expiration

2. **API Connection Issues**
   - Verify API endpoint URLs
   - Check network requests in browser console
   - Verify CORS settings if developing locally

3. **Campaign Creation Problems**
   - Validate all required fields are completed
   - Check image upload permissions
   - Verify user is properly authenticated

4. **Display Issues**
   - Clear browser cache
   - Check for JavaScript errors in console
   - Verify CSS is properly loaded

5. **Data Not Saving**
   - Check API responses for error messages
   - Verify data format being sent to API
   - Check permission levels for current user

## Performance Optimization

The application implements several performance optimizations:

1. **Lazy Loading**: Images and resources loaded as needed
2. **Efficient DOM Updates**: Targeted DOM manipulation
3. **Minimal Dependencies**: Limited use of external libraries
4. **Caching**: Local storage for user data and preferences
5. **Optimized Images**: Proper sizing and compression

## Future Development Recommendations

1. **Framework Integration**: Consider migrating to React or Vue.js for more complex UI interactions
2. **API Standardization**: Implement a consistent RESTful API specification
3. **Testing Infrastructure**: Add unit and integration testing
4. **Continuous Integration**: Set up CI/CD pipeline
5. **Monitoring**: Add error logging and performance monitoring
6. **Accessibility**: Enhance accessibility features
7. **Localization**: Add multi-language support
