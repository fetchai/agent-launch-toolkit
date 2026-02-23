---
paths:
  - "packages/**/*.ts"
---

# Security Checklist

## Backend
- Input validation on all endpoints
- JWT expiration configured
- Secrets in .env only
- CORS restricted
- Error messages don't leak internals

## Frontend
- No secrets in client code
- Sanitize user input
- Validate wallet addresses

## Smart Contracts
- Reentrancy guard on state changes
- Access control validated
- Events for all state changes
- No hardcoded addresses (use constructor)

## General
- npm audit regularly
- No private keys in code
- .env in .gitignore
