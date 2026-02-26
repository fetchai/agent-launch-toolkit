# Errors Related to Agents

> Source: https://docs.agentverse.ai/documentation/advanced-usages/agent-logs-errors

This guide explains the errors that may occur when interacting with Mailbox and Proxy Agents as well as message envelopes.

**Ensure you log in at least once every 30 days to prevent your hosted Agent from being deactivated.**

## Envelope Validation Errors

Submitting an envelope to `/v1/submit` first triggers a verification step. If the envelope cannot be validated, the API returns a **400 Bad Request**:

```
Unable to validate envelope
```

## Agent Lookup Errors

When submitting a message to an Agent that does not exist with `POST /v1/submit`, a **404** is raised with:

```
No registered address found matching envelope target
```

When probing readiness with `HEAD /v1/submit`, the `x-uagents-address` header must be provided. If it is missing, a **400 Bad Request** is raised with:

```
No mailbox found for agent
```

## Quotas and Subscriptions Errors

A **quota** is simply a limit. A **subscription** represents whether the user is on an active plan or not.

*If a user sends more messages than their plan allows*:
```
Message quota reached X / Y
```
**406 Not Acceptable**

*If total stored bytes exceed the storage limit*:
```
Storage quota reached X / Y
```
**406 Not Acceptable**

*If total data transferred exceeds the transfer limit*:
```
Transfer quota reached X / Y
```
**406 Not Acceptable**

*If the plan has expired*:
```
Subscription expired
```
**406 Not Acceptable**

## Mailbox Operations Errors

Listing mailbox messages at `/v1/mailbox` requires both `offset` and `limit` pagination parameters:
```
Missing offset and limit parameters
```
**400 Bad Request**

When retrieving or deleting a specific envelope at `/v1/mailbox/{uuid}`:
```
Unable to lookup mailbox entry
```
**404 Not Found**

## Proxy Agent Lookup Errors

If no matching proxy agent is found:
```
No registered address found matching envelope target
```
**404 Not Found**
