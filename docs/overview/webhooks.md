## Webhooks

Stay updated with real-time events by configuring webhooks for your application. We'll send HTTP POST requests to your endpoint whenever relevant events occur.

```javascript
// Example webhook payload for successful donation
{
    "event": "donation.completed",
    "created": "2024-03-15T10:30:00Z",
    "data": {
        "donationId": "don_123",
        "campaignId": "campaign_456",
        "amount": {
            "value": "100.00",
            "currency": "USD"
        },
        "status": "completed",
        "transaction": {
            "stellarTxId": "tx_789",
            "timestamp": "2024-03-15T10:30:00Z"
        }
    }
}
```

### Available Webhook Events
- donation.completed
- campaign.milestone.reached
- campaign.funded
- impact.verified
- user.verified


