---
paths:
  - "packages/sdk/src/**/*.ts"
  - "packages/cli/src/**/*.ts"
  - "packages/mcp/src/**/*.ts"
---

# API Design Rules

## Endpoints
- GET /api/{resource} - List
- POST /api/{resource} - Create
- GET /api/{resource}/:id - Read
- PUT /api/{resource}/:id - Update
- DELETE /api/{resource}/:id - Delete

## Response Format
{
  "success": boolean,
  "data": object | array,
  "error": null | { "code": string, "message": string }
}

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Pagination
- Query: ?page=1&limit=20
- Response meta: { page, limit, total, totalPages }
