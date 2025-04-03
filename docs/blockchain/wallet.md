# Wallet Integration

## Overview

Wallet integration is a core component of The Give Hub platform, enabling secure management of digital assets and seamless donation processing on the Stellar blockchain. This document covers the implementation, features, and best practices for working with digital wallets in the platform.

## Wallet Types

The Give Hub supports several types of wallets:

### Platform Wallets

These are wallets managed by The Give Hub platform:

- **Main Treasury Wallet**: Central platform wallet for collecting platform fees
- **Campaign Wallets**: Generated for each campaign to receive donations
- **Organization Wallets**: Assigned to verified organizations
- **Escrow Wallets**: For milestone-based campaign funding

### User Wallets

These are wallets managed by the users:

- **Connected External Wallets**: User-owned Stellar wallets connected to the platform
- **Custodial Wallets**: Platform-managed wallets created for users who don't have their own

## Wallet Creation

### For Organizations

When an organization is verified on the platform, they can either:

1. Connect an existing Stellar wallet by providing their public key and proving ownership
2. Have the platform create a new wallet for them

```javascript
// Example API call to create an organization wallet
POST /api/v1/organizations/{organizationId}/wallet
{
  "wallet_type": "stellar",
  "generate_new": true  // Set to false if connecting existing wallet
}
```

### For Campaigns

Each campaign automatically receives a dedicated wallet:

```javascript
// The wallet is created automatically when a campaign is created
POST /api/v1/campaigns
{
  "title": "Save the Forests",
  "description": "...",
  "goal_amount": "10000",
  "organization_id": "org123",
  // Wallet is generated automatically
}
```

## Wallet Security

The Give Hub implements several security measures for wallet protection:

### Key Management

- Multi-signature requirements for high-value transactions
- Hardware security modules (HSMs) for storing organization keys
- Encrypted storage of all sensitive wallet information
- Key rotation policies for platform wallets

### Transaction Security

- Rate limiting on withdrawal operations
- Approval workflows for large transactions
- IP-based anomaly detection
- Email notifications for significant wallet activities

## Connecting External Wallets

Users and organizations can connect external Stellar wallets using the following methods:

### Public Key + Transaction Signing

1. User provides their Stellar public key
2. Platform generates a unique transaction requiring signature
3. User signs the transaction using their private key
4. Platform verifies the signature to confirm ownership

### Federation Address

Users can connect wallets using Stellar federation addresses:

1. User provides their federation address (e.g., `user*stellarx.com`)
2. Platform resolves the federation address to obtain the public key
3. Ownership verification proceeds as above

## Wallet Operations

### Balance Checking

```javascript
// Example API call to check wallet balance
GET /api/v1/wallets/{walletId}/balance

// Example response
{
  "data": {
    "balances": [
      {
        "asset_code": "XLM",
        "asset_issuer": null,
        "balance": "125.5000000"
      },
      {
        "asset_code": "USDC",
        "asset_issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        "balance": "50.0000000"
      }
    ]
  }
}
```

### Sending Funds

```javascript
// Example API call to send funds
POST /api/v1/wallets/{walletId}/send
{
  "destination": "GDZKUW33YVIKQN6JJIJQVWC3S5VZHUIS2L3QOSOTUGHVQS4QDW2NBXLP",
  "asset": {
    "code": "XLM",
    "issuer": null
  },
  "amount": "10.5000000",
  "memo": "Donation for Education Campaign"
}
```

### Transaction History

```javascript
// Example API call to get transaction history
GET /api/v1/wallets/{walletId}/transactions?limit=10&page=1

// Example response
{
  "data": [
    {
      "id": "tx123",
      "type": "payment",
      "amount": "10.5000000",
      "asset": {
        "code": "XLM",
        "issuer": null
      },
      "from": "GDZKUW33YVIKQN6JJIJQVWC3S5VZHUIS2L3QOSOTUGHVQS4QDW2NBXLP",
      "to": "GBHEXWICLTUHUFNMNTLBQ3DOPJACVKZN3OGEWBMCHYT2IBAFYB3P2RDB",
      "created_at": "2023-03-15T14:30:45Z",
      "memo": "Donation for Education Campaign",
      "stellar_transaction_id": "7e2b9c15f673..."
    }
    // More transactions...
  ],
  "meta": {
    "pagination": {
      "total": 45,
      "per_page": 10,
      "current_page": 1,
      "last_page": 5
    }
  }
}
```

## Multi-Currency Support

The Give Hub wallets support multiple currencies:

- **Native XLM**: Stellar's native currency
- **Stellar-based Stablecoins**: USDC, EURT, etc.
- **Custom Tokens**: Including platform-specific tokens

Users can:
- View balances in multiple currencies
- Convert between currencies using the Stellar DEX
- Set preferred donation currencies

## Wallet Recovery

For custodial wallets managed by the platform, The Give Hub provides recovery options:

- Email-based recovery process
- Two-factor authentication requirements
- Cool-down periods for sensitive operations
- Support-assisted recovery for special cases

## Testing Wallets

For development and testing, The Give Hub provides:

- Testnet environment with auto-funding capabilities
- Simulation mode for testing transactions without blockchain interactions
- Mock wallet responses for frontend development

## Best Practices

- Always verify recipient addresses before sending funds
- Implement transaction signing on separate devices when possible
- Use federation addresses to reduce errors
- Keep private keys secure and never share them
- Enable all available security features for wallets
- Regularly audit wallet activity

## Related Topics

- [Stellar Basics](./stellar-basics.md)
- [Transaction System](./transaction-system/transaction-system.md)
- [User Wallet API](../api/UserWallet.md)
- [Security & Privacy](../security-privacy.md)"