# API Test Scripts

This directory contains test scripts for the Jiko Auth API.

## Prerequisites

- Python 3.x
- requests library (`pip install requests`)
- Running backend server on http://localhost:8080

## Test Scripts

### 1. User Registration Test
**File:** `test_register_user.py`

Tests user registration endpoint.

```bash
python scripts/test_register_user.py
```

### 2. OAuth Client Registration Test
**File:** `test_register_client.py`

Tests OAuth client registration. This script:
- Registers a new user
- Logs in the user
- Creates an OAuth client

```bash
python scripts/test_register_client.py
```

### 3. Token Creation Test
**File:** `test_create_token.py`

Tests token creation from an OAuth client. This script:
- Registers a new user
- Logs in the user
- Creates an OAuth client
- Creates a token from the client

```bash
python scripts/test_create_token.py
```

## Running All Tests

You can run all tests sequentially:

```bash
python scripts/test_register_user.py && \
python scripts/test_register_client.py && \
python scripts/test_create_token.py
```

## Expected Output

Each script will output:
- ✅ Success messages for successful operations
- ❌ Error messages for failures
- HTTP status codes and response bodies

Exit code 0 for success, 1 for failure.