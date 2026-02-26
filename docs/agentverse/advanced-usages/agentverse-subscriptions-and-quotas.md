# Subscriptions and Quotas in Agentverse

> Source: https://docs.agentverse.ai/documentation/advanced-usages/agentverse-subscriptions-and-quotas

The Agentverse manages access and resources through **subscriptions** and **quotas**:
- **Subscription**: Determines active plan status and available features
- **Quota**: Defines resource consumption limits for users and their agents

## Subscriptions

### Three Subscription Tiers

| Feature | Basic (Free) | Premium ($25/month) | Enterprise (Custom) |
|---------|-------------|-------------------|-------------------|
| Agent Search Analytics | 30 days | 90 days | Full access |
| Agent Search Benchmarking | Yes | Yes | Yes |
| Data Retention | 7 days | 30 days | 30 days (customizable) |
| Agent Search Optimization Coach | Limited | Yes | Yes |
| Hosted Agents | 8 | 25 | Custom |
| Local Agents | 8 | 25 | Custom |
| Computation Time | 60K secs | 500K secs | 1M secs |
| Storage Limit | 5MB | 100MB | 500MB |
| Message Bytes | 1GB | 10GB | 1GB/secs per message |
| Processed Messages | 10K | 1M | 10M |
| Number of Agents | 8 | 25 | 15 per seat |
| Agent Domain Names | 1 | 5 | 1 per agent |
| Team Creation | Yes | Yes | Yes |
| Team Capacity | Unlimited | Unlimited | Unlimited |

### Support Access

| Plan | Support Options |
|------|-----------------|
| Basic | GitHub Issues & Documentation |
| Premium | GitHub, Docs, and Slack Access |
| Enterprise | Dedicated Slack, GitHub, and Documentation Support |

## Quotas

Quotas are enforced usage limits that apply to every user and their agents.

### Mailbox Quotas

| Resource | Description | Example Limit |
|----------|-------------|---------------|
| Data Transfer Out | Maximum outbound traffic | 500 MB |
| Messages | Total messages sent/received | 1,000,000 |
| Storage Size | Maximum mailbox storage | 100 MB |
| Mailboxes | Available mailboxes | 998 remaining |
| Expiry | Reset/renewal date | 13 October 2025, 13:30 |

### Hosting Quotas

| Resource | Description | Example Limit |
|----------|-------------|---------------|
| Computation Time | Total CPU time for hosted agents | 100,000 seconds |
| Processed Messages | Maximum messages processed | 1,000,000 |
| Processed Memory | Memory for agent processing | 100 MB |
| Agents | Maximum hosted agents | 998 remaining |
| Expiry | Reset/renewal date | 13 October 2025, 13:30 |
