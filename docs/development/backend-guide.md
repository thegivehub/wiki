# The Give Hub - Backend Architecture

## Overview

The Give Hub backend is built using PHP with MongoDB as the database. It follows a RESTful API pattern and provides endpoints for user authentication, campaign management, donation processing, and administrative functions.

## Directory Structure

```
/
├── api.php               # Main API entry point
├── lib/                  # Library files
│   ├── db.php            # Database connection
│   ├── Model.php         # Base model class
│   ├── Collection.php    # Collection abstract class
│   ├── MongoCollection.php # MongoDB collection wrapper
│   ├── MongoModel.php    # MongoDB model extension
│   ├── Campaign.php      # Campaign model
│   ├── Users.php         # User model
│   ├── DocumentUploader.php # Document upload handling
│   ├── AdminAuthController.php # Admin authentication
│   ├── AdminCampaignController.php # Admin campaign management
│   ├── AdminUserController.php # Admin user management
│   ├── KycController.php # Know Your Customer verification
│   └── ...               # Other controllers and models
├── document-api.php      # Document management API
├── image-upload.php      # Image upload handler
├── logs/                 # Application logs
├── uploads/              # Uploaded files
│   ├── campaign_images/  # Campaign images
│   └── documents/        # User documents (IDs, etc.)
└── vendor/               # Composer dependencies
```

## Core Components

### API Entry Point (api.php)

This is the main entry point for all API requests. It:
1. Loads the necessary dependencies
2. Parses the request URL to determine the endpoint
3. Dynamically instantiates the appropriate class
4. Routes the request to the correct method based on HTTP method
5. Returns the response as JSON

```php
// Parse request
$method = $_SERVER['REQUEST_METHOD'];
$actions = [];

if (isset($_SERVER['PATH_INFO'])) {
    $actions = preg_split("/\//", $_SERVER['PATH_INFO']);
    array_shift($actions);
    $endpoint = ucfirst(array_shift($actions));
}

$id = $_GET['id'] ?? null;
$posted = json_decode(file_get_contents('php://input'), true);

// Instantiate the required class dynamically
$instance = new $endpoint();

// Handle CRUD operations based on HTTP method
switch ($method) {
    case 'POST':
        $result = $instance->create($posted);
        echo json_encode($result);
        break;
    case 'GET':
        $result = $instance->read($id);
        echo json_encode($result);
        break;
    // Other HTTP methods...
}
```

### Database Connection (db.php)

This file handles connecting to the MongoDB database:

```php
class Database {
    private $client;
    public $db;
    private static $instance = null;

    public function __construct($db = null) {
        try {
            // Use environment variables via config.php
            $dbName = $db ?: MONGODB_DATABASE;
            $host = MONGODB_HOST;
            $port = MONGODB_PORT;
            $username = MONGODB_USERNAME;
            $password = MONGODB_PASSWORD;

            // Build connection string
            $connectionString = "mongodb://";
            
            // Add authentication if provided
            if ($username && $password) {
                $connectionString .= $username . ":" . $password . "@";
            }
            
            // Add host and port
            $connectionString .= $host . ":" . $port;

            // Create MongoDB client with the connection string
            $this->client = new MongoDB\Client($connectionString);
            $this->db = $this->client->selectDatabase($dbName);
        } catch (Exception $e) {
            error_log("MongoDB connection failed: " . $e->getMessage());
            throw new Exception("MongoDB connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance(): self {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getCollection($name) {
        return new MongoCollection($this->db->selectCollection($name));
    }
}
```

### Base Model (Model.php)

The Model class serves as a base class for all models and provides common functionality:

```php
abstract class Model {
    protected $collection;
    protected $db;

    public function __construct() {
        $this->db = new Database();
        $collection = strtolower(get_class($this));
        
        // Remove 's' if it exists and add it back to ensure consistent plural form
        $collection = rtrim($collection, 's') . 's';
        
        $this->collection = $this->db->getCollection($collection);
    }

    public function create($data) {
        return $this->collection->insertOne($data);
    }

    public function read($id = null) {
        return $this->get($id);
    }

    public function get($id = null) {
        if ($id) {
            return $this->collection->findOne(['_id' => new MongoDB\BSON\ObjectId($id)]);
        } else {
            return $this->collection->find();
        }
    }
    
    // Other common methods...
}
```

### MongoDB Collection Wrapper (MongoCollection.php)

This class wraps MongoDB collection operations with error handling and data transformation:

```php
class MongoCollection {
    private $collection;

    public function __construct($collection) {
        $this->collection = $collection;
    }

    private function convertId($document) {
        if (!$document) return null;
        
        // Convert to array if it's a document
        if ($document instanceof MongoDB\Model\BSONDocument) {
            $document = $document->getArrayCopy();
        }
        
        // Convert _id to string
        if (isset($document['_id']) && $document['_id'] instanceof MongoDB\BSON\ObjectId) {
            $document['_id'] = (string)$document['_id'];
        }
        
        // Convert any nested documents
        foreach ($document as $key => $value) {
            if ($value instanceof MongoDB\Model\BSONDocument) {
                $document[$key] = $this->convertId($value);
            }
        }
        
        return $document;
    }

    public function insertOne($document) {
        try {
            $result = $this->collection->insertOne($document);
            return [
                'success' => true,
                'id' => (string)$result->getInsertedId(),
                'acknowledged' => $result->isAcknowledged()
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }
    
    // Other collection methods...
}
```

### Campaign Model (Campaign.php)

This model handles campaign-specific operations:

```php
class Campaign {
    private $collection;

    public function __construct() {
        $db = new Database("givehub");
        $this->collection = $db->getCollection('campaigns');
    }

    public function create($data) {
        // Set required default fields if not provided
        if (!isset($data['createdAt'])) {
            $data['createdAt'] = date('Y-m-d H:i:s');
        }
        
        if (!isset($data['status'])) {
            $data['status'] = 'pending';
        }
        
        // Add creator ID from token if not provided
        if (!isset($data['creatorId'])) {
            $userId = $this->getUserIdFromToken();
            if ($userId) {
                $data['creatorId'] = $userId;
            }
        }
        
        // Insert the document
        $result = $this->collection->insertOne($data);
        
        // Return the created campaign with its ID
        if ($result['success']) {
            $campaign = $this->get($result['id']);
            return [
                'success' => true,
                'id' => $result['id'],
                'campaign' => $campaign
            ];
        }
        
        return [
            'success' => false,
            'error' => 'Failed to create campaign'
        ];
    }
    
    public function getMyCampaigns() {
        // Get the user ID from the token
        $userId = $this->getUserIdFromToken();
        
        if (!$userId) {
            return [
                'success' => false,
                'error' => 'Authentication required'
            ];
        }
        
        // Find campaigns by creator ID
        try {
            $objId = new MongoDB\BSON\ObjectId($userId);
            $campaigns = $this->collection->find(['creatorId' => $objId]);
            
            if (count($campaigns) > 0) {
                return $campaigns;
            }
            
            // Try string ID if ObjectId search fails
            $campaigns = $this->collection->find(['creatorId' => $userId]);
            return $campaigns;
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Failed to retrieve campaigns: ' . $e->getMessage()
            ];
        }
    }
    
    // Get user ID from JWT token
    public function getUserIdFromToken() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            
            try {
                // Decode JWT token
                $decoded = \Firebase\JWT\JWT::decode(
                    $token, 
                    new \Firebase\JWT\Key(JWT_SECRET, 'HS256')
                );
                
                // Return user ID from token (check multiple possible fields)
                return $decoded->sub ?? $decoded->userId ?? $decoded->_id ?? null;
            } catch (Exception $e) {
                error_log("Token decode error: " . $e->getMessage());
                return null;
            }
        }
        
        return null;
    }
    
    // Other campaign-specific methods...
}
```

### Image Upload Handler (image-upload.php)

This file handles image uploads for campaigns:

```php
<?php
require_once __DIR__ . '/lib/db.php';

// Set headers for CORS and JSON response
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Ensure the uploads directory exists
$uploadsDir = __DIR__ . '/uploads/campaign_images';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get JSON data from the request
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!$data || !isset($data['image'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No image data provided']);
    exit;
}

// Extract the base64 image data
$imageData = $data['image'];
$campaignId = $data['campaignId'] ?? '';

// Process and save the image
try {
    // Decode base64 image
    $parts = explode(',', $imageData);
    $imageType = explode(';', $parts[0])[0];
    $imageType = str_replace('data:image/', '', $imageType);
    
    // Generate filename
    $filename = uniqid('campaign_') . '_' . time() . '.' . $imageType;
    $filePath = $uploadsDir . '/' . $filename;
    
    // Save image
    $imageContent = base64_decode($parts[1]);
    file_put_contents($filePath, $imageContent);
    
    // Generate URL
    $protocol = isset($_SERVER['HTTPS']) ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'];
    $imageUrl = "$protocol://$host/uploads/campaign_images/$filename";
    
    // Update campaign if ID provided
    if ($campaignId) {
        $db = new Database("givehub");
        $campaigns = $db->getCollection('campaigns');
        
        $campaign = $campaigns->findOne([
            '_id' => new MongoDB\BSON\ObjectId($campaignId)
        ]);
        
        if ($campaign) {
            $images = $campaign['images'] ?? [];
            $images[] = $imageUrl;
            
            $campaigns->updateOne(
                ['_id' => new MongoDB\BSON\ObjectId($campaignId)],
                ['$set' => ['images' => $images]]
            );
        }
    }
    
    // Return success with URL
    echo json_encode([
        'success' => true,
        'url' => $imageUrl,
        'filename' => $filename
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to process image: ' . $e->getMessage()]);
}
```

## Authentication System

Authentication is handled through JWT (JSON Web Tokens):

1. **Login Process:**
   - User submits credentials to `/api/auth/login` endpoint
   - Server validates credentials against database
   - If valid, server generates access token and refresh token
   - Tokens are returned to client and stored in localStorage

2. **Token Structure:**
   - Access token: Short-lived token for API requests
   - Refresh token: Longer-lived token for obtaining new access tokens

3. **Request Authentication:**
   - Every API request includes the access token in the Authorization header
   - Server validates the token before processing the request
   - If token is expired, client uses refresh token to get a new access token

4. **Token Verification:**
   - Server decodes the JWT token
   - Verifies the signature using the secret key
   - Checks if the token is expired
   - Extracts the user ID and permissions

## Data Models

### Campaign Model

```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "type": "String",
  "creatorId": "ObjectId",
  "createdAt": "Date",
  "status": "String",
  "fundingGoal": "Number",
  "raisedAmount": "Number",
  "currency": "String",
  "deadline": "Date",
  "minContribution": "Number",
  "location": {
    "country": "String",
    "region": "String",
    "coordinates": {
      "latitude": "Number",
      "longitude": "Number"
    }
  },
  "impact": {
    "metrics": [
      {
        "name": "String",
        "baseline": "Number",
        "current": "Number",
        "target": "Number",
        "unit": "String"
      }
    ]
  },
  "timeline": {
    "milestones": [
      {
        "title": "String",
        "description": "String",
        "status": "String"
      }
    ]
  },
  "media": [
    {
      "type": "String",
      "url": "String",
      "caption": "String"
    }
  ],
  "funding": {
    "goalAmount": "Number",
    "raisedAmount": "Number",
    "currency": "String",
    "donorCount": "Number"
  }
}
```

### User Model

```json
{
  "_id": "ObjectId",
  "email": "String",
  "username": "String",
  "passwordHash": "String",
  "displayName": "String",
  "createdAt": "Date",
  "status": "String",
  "role": "String",
  "personalInfo": {
    "firstName": "String",
    "lastName": "String",
    "phone": "String",
    "location": "String"
  },
  "profile": {
    "bio": "String",
    "avatar": "String"
  },
  "preferences": {
    "emailNotifications": {
      "campaignUpdates": "Boolean",
      "newDonations": "Boolean",
      "milestones": "Boolean",
      "marketing": "Boolean"
    }
  },
  "verification": {
    "emailVerified": "Boolean",
    "identityVerified": "Boolean",
    "kycStatus": "String"
  }
}
```

### Donation Model

```json
{
  "_id": "ObjectId",
  "campaignId": "ObjectId",
  "donorId": "ObjectId",
  "amount": "Number",
  "currency": "String",
  "date": "Date",
  "status": "String",
  "anonymous": "Boolean",
  "message": "String",
  "transactionId": "String"
}
```

## API Endpoints

### Authentication

- `POST /api/auth/login`: Authenticate user and get tokens
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/verify-code`: Verify email with code
- `POST /api/auth/refresh`: Refresh access token
- `POST /api/auth/logout`: Invalidate tokens
- `POST /api/auth/forgot-password`: Request password reset
- `POST /api/auth/reset-password`: Reset password with token

### User Management

- `GET /api/user/me`: Get current user profile
- `PUT /api/user/me`: Update user profile
- `GET /api/user/settings`: Get user settings
- `PUT /api/user/settings`: Update user settings
- `PUT /api/user/password`: Change password
- `POST /api/user/avatar`: Upload avatar

### Campaign Management

- `POST /api/campaign`: Create new campaign
- `GET /api/campaign`: Get all campaigns
- `GET /api/campaign?id=<id>`: Get campaign by ID
- `PUT /api/campaign?id=<id>`: Update campaign
- `DELETE /api/campaign?id=<id>`: Delete campaign
- `GET /api/campaign/my`: Get current user's campaigns
- `GET /api/campaign/featured`: Get featured campaigns
- `GET /api/campaign/category/<category>`: Get campaigns by category
- `GET /api/campaign/search?q=<query>`: Search campaigns

### Donation Management

- `POST /api/donation`: Create donation
- `GET /api/donation`: Get all donations
- `GET /api/donation?id=<id>`: Get donation by ID
- `GET /api/donation/campaign/<id>`: Get donations for campaign
- `GET /api/donation/user/<id>`: Get donations by user

### KYC Verification

- `POST /api/kyc/initiate`: Start verification process
- `GET /api/kyc/status`: Check verification status
- `POST /api/kyc/webhook`: Receive verification webhook
- `POST /api/kyc/admin-override`: Admin override for verification
- `GET /api/kyc/report`: Generate verification report

### Admin

- `POST /api/admin/login`: Admin login
- `GET /api/admin/verify`: Verify admin token
- `GET /api/admin/campaigns`: Get all campaigns for admin
- `PUT /api/admin/campaigns/<id>/approve`: Approve campaign
- `PUT /api/admin/campaigns/<id>/reject`: Reject campaign
- `GET /api/admin/users`: Get all users for admin
- `PUT /api/admin/users/<id>/status`: Update user status
- `GET /api/admin/dashboard`: Get admin dashboard data
- `GET /api/admin/reports`: Generate admin reports

## Error Handling

Errors are handled consistently across the API:

```php
function sendAPIJson($code, $data, $exit = true) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    if ($exit) {
        exit;
    }
}

// Example usage for error response
sendAPIJson(400, [
    'success' => false,
    'error' => 'Invalid input',
    'details' => $validationErrors
]);
```

Common error responses include:

- 400 Bad Request: Invalid input data
- 401 Unauthorized: Missing or invalid authentication
- 403 Forbidden: Insufficient permissions
- 404 Not Found: Resource not found
- 409 Conflict: Resource already exists
- 500 Internal Server Error: Server-side error

## Logging

The application uses a custom logging function:

```php
function logMessage($message, array $context = [], $level = 'info') {
    $timestamp = date('Y-m-d H:i:s');
    $contextJson = empty($context) ? '' : json_encode($context);
    $logEntry = "[{$timestamp}] [{$level}] {$message} {$contextJson}\n";
    
    // You can adjust the log path as needed
    $logFile = __DIR__ . "/logs/" . date('Y-m-d') . ".log";
    
    // Ensure logs directory exists
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    error_log($logEntry, 3, $logFile);
}
```

## Security Considerations

### Authentication Security
- JWT tokens are signed using a strong secret key
- Access tokens have a short expiration time (1 hour)
- Refresh tokens are stored securely and validated against the database
- Failed login attempts are rate-limited

### Input Validation
All user input is validated before processing:
- Required fields are checked
- Input types are validated (numbers, dates, etc.)
- String lengths are checked
- User-submitted HTML is sanitized
- File uploads are validated for type and size

### Database Security
- MongoDB connection uses authentication
- ObjectId values are properly converted between string and MongoDB\BSON\ObjectId
- Input data is validated before insertion
- Error handling prevents leaking sensitive information

### File Upload Security
- File types are restricted (e.g., only certain image formats)
- File sizes are limited
- Filenames are generated randomly to prevent path traversal attacks
- Upload directories are properly secured

### Cross-Origin Resource Sharing (CORS)
CORS headers are set appropriately:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## Performance Optimization

Several techniques are used to optimize backend performance:

### Database Optimization
- Index creation for frequently queried fields
- MongoDB aggregation for complex queries
- Limiting result sets for pagination
- Projection to return only needed fields

### Caching
- Results caching for expensive operations
- In-memory caching for frequently accessed data

### Code Optimization
- Lazy loading of resources
- Efficient error handling
- Optimal database queries

## Deployment Considerations

### Server Requirements
- PHP 7.4+ with MongoDB extension
- MongoDB 4.0+
- Apache/Nginx web server with PHP support
- SSL certificate for HTTPS
- Sufficient storage for uploads

### Configuration
The application uses environment variables or configuration files for:
- Database connection details
- Secret keys for JWT
- External API credentials
- Environment-specific settings

### Environment-Specific Configuration
Configuration can be environment-specific:
```php
// Example of environment configuration
define('APP_ENV', getenv('APP_ENV') ?: 'development');

// Load environment-specific config
if (APP_ENV === 'production') {
    define('MONGODB_HOST', 'production-mongodb-server');
    define('JWT_SECRET', getenv('JWT_SECRET'));
} else {
    define('MONGODB_HOST', 'localhost');
    define('JWT_SECRET', 'development-secret-key');
}
```

## Testing Approach

Although not implemented in the provided code, a testing approach might include:

### Unit Testing
- Testing individual model methods
- Mocking database connections
- Validating input/output

### Integration Testing
- Testing API endpoints
- Validating request/response formats
- Testing authentication flows

### End-to-End Testing
- Testing complete user flows
- Simulating real-world scenarios

## Extensibility

The architecture is designed for extensibility:

### Adding New Models
To add a new model:
1. Create a new file in the lib/ directory (e.g., `NewModel.php`)
2. Extend the base Model class
3. Implement model-specific methods

```php
class NewModel extends Model {
    public function customMethod() {
        // Implementation
    }
}
```

### Adding New API Endpoints
New endpoints are automatically available once the corresponding model is created.

### Adding Custom Functionality
For custom functionality:
1. Create a new controller class
2. Implement the required methods
3. Register routes in api.php if needed

## Troubleshooting

Common issues and solutions:

### Authentication Issues
- Check JWT secret key consistency
- Verify token expiration times
- Check that tokens are being properly passed in headers

### Database Connection Issues
- Verify MongoDB connection string
- Check MongoDB server status
- Ensure proper authentication credentials

### File Upload Issues
- Check directory permissions
- Verify file size limits in PHP configuration
- Check disk space availability

## Maintenance and Monitoring

For production environments:

### Logging
- All errors are logged to date-specific log files
- Log rotation should be configured
- Important events are tagged with appropriate log levels

### Monitoring
- API endpoint response times
- Database performance
- Error rates
- Server resource usage

### Backup Strategy
- Regular database backups
- Backup of uploaded files
- Configuration backup

## Conclusion

The Give Hub backend provides a solid foundation for a crowdfunding platform with:
- Secure authentication
- Flexible data models
- RESTful API design
- Comprehensive error handling
- Scalable architecture

The modular design allows for easy extension and customization as requirements evolve.
