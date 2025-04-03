## API Reference

### Campaigns

#### GET /v1/campaigns
List all campaigns with optional filtering

```javascript
// List active campaigns
const campaigns = await app.client.campaigns.list({
    status: 'active',
    category: 'water',
    limit: 20,
    page: 1
});
```

#### POST /v1/campaigns
Create a new campaign

```javascript
// Create new campaign
const campaign = await app.client.campaigns.create({
    title: 'Community Solar Project',
    description: 'Installing solar panels for school',
    targetAmount: 15000,
    category: 'energy',
    location: {
        country: 'Tanzania',
        coordinates: [-6.369028, 34.888822]
    },
    milestones: [
        {
            title: 'Equipment Purchase',
            amount: 8000,
            description: 'Solar panels and inverters'
        },
        {
            title: 'Installation',
            amount: 7000,
            description: 'Professional installation and training'
        }
    ]
});
```

### Donations

#### POST /v1/donations
Process a donation

```javascript
// Process donation with Stellar
const donation = await app.client.donations.create({
    campaignId: 'campaign_123',
    amount: {
        value: 100,
        currency: 'USD'
    },
    type: 'one-time',
    donor: {
        walletAddress: 'GXXXXXXXXXXXXXXXXXXXXXX'
    }
});
```

### Impact Metrics

#### POST /v1/impact/metrics
Record impact metrics for a campaign

```javascript
// Update impact metrics
const impact = await app.client.impact.updateMetrics('campaign_123', {
    metrics: [
        {
            name: 'People Served',
            value: 250,
            unit: 'individuals',
            verificationMethod: 'community_survey'
        },
        {
            name: 'Solar Output',
            value: 5000,
            unit: 'watts',
            verificationMethod: 'meter_reading'
        }
    ]
});
```


