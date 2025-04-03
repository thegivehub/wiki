# Smart Contracts

## Overview

The Give Hub utilizes smart contracts on the Stellar blockchain to create trustless, transparent, and automated donation processes. While Stellar doesn't support Turing-complete smart contracts like Ethereum, it provides powerful primitives through its transaction system that enable complex, contract-like behavior. This documentation explains how The Give Hub implements "smart contract" functionality within the Stellar ecosystem.

## Stellar Contract Primitives

The Give Hub leverages these Stellar features to create contract-like behavior:

### Multi-Signature Accounts

Accounts that require multiple signatures to authorize transactions, enabling:
- Committee-approved fund disbursement
- Milestone-based release of campaign funds
- Multi-stakeholder governance of shared resources

### Time Bounds

Transactions that can only be executed within specific time windows, enabling:
- Time-limited campaign contributions
- Scheduled disbursements of funds
- Automatic refunds if milestones aren't met

### Sequence Numbers

Transaction ordering guarantees through sequence numbers, enabling:
- Proper sequencing of complex donation flows
- Prevention of double-spending
- Ordered execution of conditional actions

### Hash Time-Locked Contracts (HTLCs)

Cryptographic time-locked contracts, enabling:
- Cross-chain donations (e.g., Bitcoin to Stellar)
- Conditional fund releases
- Escrow mechanisms for milestone achievements

## Contract Implementation Patterns

The Give Hub implements several contract patterns:

### Escrow Contracts

Used for milestone-based campaign funding:

1. Donations are held in an escrow account
2. Multi-signature requirements ensure funds can only be released when conditions are met
3. Time-bound execution allows automatic refunds if milestones aren't achieved

**Example Escrow Flow:**
```
1. Donor sends funds to escrow account
2. Campaign reaches milestone
3. Verification committee approves (provides signatures)
4. Funds are released to organization
```

### Clawback Contracts

Provides refund capabilities for specific conditions:

1. Platform maintains clawback rights on campaign assets
2. If campaign is fraudulent or fails to meet requirements, funds can be returned
3. Time-based expiration of clawback rights upon successful completion

### Vesting Contracts

Used for long-term campaigns or grants:

1. Funds are locked in a specialized account
2. Predetermined release schedule controls when funds become available
3. Each vesting period unlocks a portion of the total amount

## Smart Donation Templates

The Give Hub provides several pre-configured "smart donation" templates:

### Milestone Donation

Funds are released in stages as campaign milestones are achieved:

```json
{
  "donation_type": "milestone",
  "total_amount": "1000.00",
  "currency": "USDC",
  "milestones": [
    {
      "title": "Project Launch",
      "percentage": 20,
      "verification_required": true
    },
    {
      "title": "Mid-point Goals",
      "percentage": 30,
      "verification_required": true
    },
    {
      "title": "Project Completion",
      "percentage": 50,
      "verification_required": true
    }
  ],
  "expiration_days": 180,
  "verification_committee": ["org_leader", "platform_validator", "community_rep"]
}
```

### Conditional Donation

Funds are only released when specific conditions are met:

```json
{
  "donation_type": "conditional",
  "amount": "5000.00",
  "currency": "XLM",
  "conditions": [
    {
      "type": "matching_funds",
      "target_amount": "5000.00",
      "deadline": "2023-12-31T23:59:59Z"
    }
  ],
  "refund_policy": {
    "auto_refund": true,
    "deadline_extension_days": 30
  }
}
```

### Recurring Donation

Automated regular donations:

```json
{
  "donation_type": "recurring",
  "amount_per_period": "50.00",
  "currency": "USDC",
  "frequency": "monthly",
  "start_date": "2023-04-01T00:00:00Z",
  "end_date": "2024-03-31T23:59:59Z",
  "max_payments": 12
}
```

## On-Chain Verification

The Give Hub ensures transaction transparency through:

### Memo Field Usage

Each transaction includes a standardized memo structure:
- Donation ID
- Campaign reference
- Contract type identifier
- Verification hashes

### Transaction Chaining

Related transactions are linked through references:
- Milestone releases reference original donation
- Refunds link back to initial contributions
- Multi-stage contracts maintain clear transaction lineage

### On-Chain Attestations

Verifiers provide on-chain attestations for milestone achievement:
- Signed transactions with specific memo fields
- Publicly verifiable proof of approval
- Immutable record of decision-making

## Implementing Custom Contracts

Organizations can create custom smart contract templates:

1. Use the Contract Designer tool in the platform dashboard
2. Define contract parameters, conditions, and stakeholders
3. Test the contract in the sandbox environment
4. Deploy for use in campaigns

**Example Custom Contract Definition:**
```javascript
// Matching fund contract with time-based tiers
const matchingFundContract = {
  name: "Tiered Matching Fund",
  description: "Matches donations at different rates based on time periods",
  parameters: [
    {
      name: "earlyMatchRate",
      type: "percentage",
      default: 100,
      description: "Match percentage for early donors"
    },
    {
      name: "standardMatchRate",
      type: "percentage",
      default: 50,
      description: "Match percentage for standard period"
    },
    // Additional parameters...
  ],
  timeWindows: [
    {
      name: "earlyBird",
      duration: "7d",
      matchRate: "earlyMatchRate"
    },
    {
      name: "standard",
      duration: "30d",
      matchRate: "standardMatchRate"
    }
  ],
  // Contract logic definitions...
};
```

## Contract Auditing and Verification

The Give Hub provides:

- Public blockchain explorers for transaction verification
- Audit trails of all contract executions
- Verification tools for donors to check contract status
- Third-party auditing of contract implementations

## Best Practices

When working with smart contracts:

- Thoroughly test all contracts in sandbox environments
- Include appropriate time bounds for security
- Implement proper signing authority distribution
- Design clear refund policies
- Document all contract parameters publicly
- Consider all possible edge cases and failure modes

## Limitations and Considerations

Important points to understand:

- Stellar smart contracts are not Turing-complete
- Complex logic is handled through platform services with blockchain anchoring
- Multi-signature operations may require coordination among stakeholders
- Transaction fees must be considered in contract design
- Operation limits per transaction (currently 100 operations max)

## Future Enhancements

The Give Hub is developing:

- Integration with Stellar's upcoming Turing-complete contract system (Soroban)
- Cross-chain donation bridges using interoperability protocols
- Enhanced verification mechanisms using zero-knowledge proofs
- DAO-like governance for community-managed campaigns

## Related Topics

- [Stellar Basics](./stellar-basics.md)
- [Transaction System](./transaction-system/transaction-system.md)
- [Wallet Integration](./wallet.md)
- [Security & Privacy](../security-privacy.md)"