# API Overview

## Introduction

The Give Hub API provides programmatic access to campaigns, donations, users, and other functionality of The Give Hub platform. It is a RESTful API that uses standard HTTP methods and returns JSON responses. This document provides an overview of the API, its capabilities, and how to get started with integration.

## API Base URL

- **Production**: `https://api.thegivehub.com/v1`
- **Staging**: `https://api-staging.thegivehub.com/v1`
- **Development**: `http://localhost:3000/v1`

## Authentication

The Give Hub API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints, you need to include the token in the Authorization header of your requests:

```
Authorization: Bearer your_jwt_token
```

To obtain a token, use the [Authentication endpoint](../authentication.md).

## Rate Limiting

The API enforces rate limiting to ensure fair usage and platform stability:

- 100 requests per minute for authenticated requests
- 20 requests per minute for unauthenticated requests

When you exceed these limits, the API will return a `429 Too Many Requests` response.

## Response Format

All API responses are returned in JSON format. A typical successful response looks like:

```json
{
  "data": {
    // Response data here
  },
  "meta": {
    "pagination": {
      "total": 100,
      "per_page": 20,
      "current_page": 1,
      "last_page": 5
    }
  }
}
```

Error responses follow this structure:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "A human-readable error message",
    "details": {
      // Additional error details
    }
  }
}
```

## HTTP Status Codes

The API uses standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource was successfully created
- `204 No Content`: Request succeeded but no content is returned
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Validation errors
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Pagination

For endpoints that return multiple items, the API supports pagination using the following query parameters:

- `page`: Page number (default: 1)
- `per_page`: Number of items per page (default: 20, max: 100)

Pagination metadata is included in the response under the `meta.pagination` key.

## Filtering

Many endpoints support filtering using query parameters. For example:

```
GET /campaigns?status=active&category=education
```

## Sorting

You can sort results using the `sort` parameter:

```
GET /campaigns?sort=created_at:desc
```

## Including Related Resources

To reduce the number of API calls, you can include related resources using the `include` parameter:

```
GET /campaigns/123?include=organization,donations
```

## Versioning

The API uses versioning in the URL path. The current version is `v1`. We will maintain backward compatibility within major versions.

## Core Resources

The API provides access to these core resources:

- [Users](User.md): User accounts and profiles
- [Organizations](../features/users.md): Organizations that create campaigns
- [Campaigns](Campaign.md): Fundraising campaigns
- [Donations](Donation.md): Donations made to campaigns
- [Transactions](DonationTransaction.md): Blockchain transactions
- [Impact Metrics](ImpactMetric.md): Measurable outcomes of campaigns

## Webhooks

The API can send webhooks for various events. See the [Webhooks documentation](../webhooks.md) for details.

## SDKs and Client Libraries

We provide official client libraries for:
- JavaScript (Node.js and browser)
- Python
- PHP
- Ruby

See the [SDKs documentation](../sdks.md) for details.

## Examples

Here are some common API usage examples:

### Listing Active Campaigns

```bash
curl -X GET "https://api.thegivehub.com/v1/campaigns?status=active" \
  -H "Authorization: Bearer your_jwt_token"
```

### Creating a Donation

```bash
curl -X POST "https://api.thegivehub.com/v1/donations" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign_id": "123",
    "amount": {
      "value": "50.00",
      "currency": "USD"
    },
    "payment_method": "credit_card",
    "anonymous": false
  }'
```

## API Reference

For detailed information about specific endpoints, request parameters, and response structures, see:

- [DefaultApi Reference](DefaultApi.md)
- [Authentication API](../authentication.md)
- [API Reference](../api-reference.md)"