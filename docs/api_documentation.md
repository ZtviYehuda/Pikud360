# API Documentation Template

This document catalogs the available root endpoints and JSON payloads for the Pikud360 Backend REST API.

---

## Global Response Envelopes

### Success Schema
Status: `200 OK`, `201 Created`
```json
{
  "success": true,
  "data": {
    "key": "value"
  },
  "message": "User-friendly description."
}
```

### Error Schema
Status: `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE_STRING",
    "message": "Detailed developer message.",
    "details": null
  }
}
```

---

## Root System Endpoints

### 1. Health Summary Check
* **Endpoint**: `/health`
* **Method**: `GET`
* **Description**: Returns connectivity statuses for the application and database.
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "database": "connected",
      "timestamp": 1783939922.25
    },
    "message": "System is healthy."
  }
  ```
* **Error Response (503 Service Unavailable)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "DATABASE_UNAVAILABLE",
      "message": "Database connection check failed",
      "details": {
        "status": "unhealthy",
        "database": "disconnected",
        "timestamp": 1783939922.25
      }
    }
  }
  ```

---

### 2. Application Version
* **Endpoint**: `/version`
* **Method**: `GET`
* **Description**: Retrieves active application version tags.
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "name": "Pikud360 Workforce Management System",
      "version": "1.0.0-beta",
      "api_version": "v1"
    },
    "message": "Version retrieved."
  }
  ```

---

### 3. System Uptime and Configuration Status
* **Endpoint**: `/status`
* **Method**: `GET`
* **Description**: Fetches execution configuration data and server uptime statistics.
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "environment": "development",
      "debug_mode": true,
      "testing_mode": false,
      "uptime": "120.45s",
      "uptime_seconds": 120,
      "db_pool_status": {
        "min_connections": 1,
        "max_connections": 10
      }
    },
    "message": "System status retrieved."
  }
  ```

---

### 4. API Endpoints Catalog
* **Endpoint**: `/api`
* **Method**: `GET`
* **Description**: Returns directory metadata listing basic API hooks.
* **Success Response (200)**:
  ```json
  {
    "success": true,
    "data": {
      "endpoints": [
        {"path": "/health", "method": "GET", "description": "System health summary"},
        {"path": "/version", "method": "GET", "description": "Application version details"},
        {"path": "/status", "method": "GET", "description": "Runtime system statistics"},
        {"path": "/api", "method": "GET", "description": "Index of system endpoints"}
      ]
    },
    "message": "Available endpoints catalog."
  }
  ```
