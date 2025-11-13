# Hydraulic Network Calculator API

A comprehensive FastAPI backend for hydraulic network analysis and calculation, integrating with the network-hydraulic Python library.

## Overview

This FastAPI application provides a RESTful API for hydraulic network calculations with the following key features:

- **Hydraulic Calculations**: Execute liquid, gas, and vapor flow calculations
- **Configuration Management**: Validate and manage hydraulic network configurations
- **Real-time Updates**: WebSocket support for calculation progress tracking
- **File Upload**: Support for YAML/JSON configuration files
- **Background Processing**: Asynchronous calculation execution
- **Results Management**: Store and retrieve calculation results
- **Templates**: Pre-built configurations for common scenarios
- **Fitting Library**: Comprehensive database of fitting properties and K-factors

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Routers   │  │   Database  │  │   Background        │  │
│  │             │  │             │  │   Tasks             │  │
│  │ • Calc      │  │ • SQLite    │  │ • Task Manager      │  │
│  │ • Config    │  │ • Models    │  │ • Progress Tracking │  │
│  │ • Results   │  │ • Queries   │  │ • Queue Management  │  │
│  │ • History   │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│                 Network-Hydraulic Integration               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Calculator│  │   Loader    │  │   Data Conversion   │  │
│  │             │  │             │  │                     │  │
│  │ • Calculate │  │ • YAML/JSON │  │ • API ↔ Library     │  │
│  │ • Validate  │  │ • Parse     │  │ • Error Handling    │  │
│  │ • Convert   │  │ • Validate  │  │ • Unit Conversion   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│              Network-Hydraulic Python Library               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Models    │  │  Solvers    │  │   I/O & Results     │  │
│  │             │  │             │  │                     │  │
│  │ • Network   │  │ • Sequential│  │ • YAML Export       │  │
│  │ • Fluid     │  │ • Pressure  │  │ • Unit Conversion   │  │
│  │ • Sections  │  │ • Flow      │  │ • Validation        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### Calculation Endpoints

- `POST /api/calculate` - Execute hydraulic calculation (sync/async)
- `POST /api/calculate/validate` - Validate configuration without calculation
- `POST /api/calculate/upload` - Upload YAML/JSON configuration files
- `GET /api/calculate/status/{task_id}` - Get calculation status
- `GET /api/calculate/system/status` - Get system status
- `GET /api/calculate/progress/ws-url` - Get WebSocket URL

### Configuration Endpoints

- `GET /api/config/templates` - Get configuration templates
- `GET /api/config/templates/{template_id}` - Get specific template
- `POST /api/config/templates` - Save custom template
- `GET /api/config/fittings` - Get fitting types
- `GET /api/config/fittings/{fitting_type}` - Get fitting properties
- `POST /api/config/fittings` - Add fitting properties
- `GET /api/config/categories` - Get template categories
- `POST /api/config/validate` - Validate configuration structure

### Results Endpoints

- `GET /api/results/{calculation_id}` - Get calculation results
- `GET /api/results/{calculation_id}/summary` - Get calculation summary
- `GET /api/results/{calculation_id}/export/{format}` - Export results (JSON/CSV/PDF)
- `GET /api/results/{calculation_id}/sections` - Get section results
- `GET /api/results/{calculation_id}/sections/{section_id}` - Get specific section

### History Endpoints

- `GET /api/history/` - Get calculation history
- `GET /api/history/statistics` - Get calculation statistics
- `GET /api/history/search` - Search calculations
- `GET /api/history/recent` - Get recent calculations
- `DELETE /api/history/{calculation_id}` - Delete calculation
- `DELETE /api/history/batch` - Delete multiple calculations

### WebSocket Endpoints

- `WS /api/ws/calculation` - Real-time calculation progress
- `WS /api/ws/system` - System status updates

## Installation

### Prerequisites

- Python 3.10+
- Network-hydraulic library (parent project)

### Setup

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd NetworkHydraulic/backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -e ../src  # Install network-hydraulic from parent project
   pip install -r requirements.txt
   ```

4. **Set up environment variables (optional):**
   Create a `.env` file in the backend directory:
   ```bash
   HYDRAULIC_DEBUG=true
   HYDRAULIC_HOST=0.0.0.0
   HYDRAULIC_PORT=8000
   HYDRAULIC_DATABASE_URL=sqlite:///./hydraulic_calculator.db
   HYDRAULIC_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
   ```

## Running the Application

### Development Server

```bash
# Run with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run the main script
python main.py
```

### Production Server

```bash
# Run with uvicorn (production)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or with gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## API Documentation

Once the server is running, access the interactive API documentation at:

- **Swagger UI**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc
- **OpenAPI Schema**: http://localhost:8000/api/openapi.json

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HYDRAULIC_DEBUG` | `false` | Enable debug mode |
| `HYDRAULIC_HOST` | `0.0.0.0` | Server host |
| `HYDRAULIC_PORT` | `8000` | Server port |
| `HYDRAULIC_DATABASE_URL` | `sqlite:///./hydraulic_calculator.db` | Database connection string |
| `HYDRAULIC_CORS_ORIGINS` | `http://localhost:3000` | Allowed CORS origins |
| `HYDRAULIC_ALLOWED_HOSTS` | `*` | Allowed hosts |
| `HYDRAULIC_UPLOAD_DIR` | `./uploads` | File upload directory |
| `HYDRAULIC_MAX_FILE_SIZE` | `10485760` | Maximum upload file size (bytes) |
| `HYDRAULIC_CALCULATION_TIMEOUT` | `300` | Calculation timeout (seconds) |
| `HYDRAULIC_MAX_CONCURRENT_CALCULATIONS` | `10` | Maximum concurrent calculations |

### Configuration File

Alternatively, create a `config.py` file in the backend directory to override settings:

```python
from backend.config import Settings

settings = Settings(
    debug=True,
    host="0.0.0.0",
    port=8000,
    database_url="postgresql://user:pass@localhost/db",
)
```

## Usage Examples

### Basic Calculation

```python
import requests
import json

# Configuration
config = {
    "configuration": {
        "network": {
            "name": "Example Liquid System",
            "direction": "forward",
            "boundary_pressure": {"value": 200.0, "unit": "kPag"},
            "mass_flow_rate": {"value": 1000.0, "unit": "kg/h"},
            "fluid": {
                "name": "Water",
                "phase": "liquid",
                "temperature": {"value": 25.0, "unit": "degC"},
                "pressure": {"value": 200.0, "unit": "kPag"},
                "density": {"value": 998.0, "unit": "kg/m^3"},
                "viscosity": {"value": 1.002, "unit": "cP"}
            },
            "sections": [
                {
                    "id": "section_1",
                    "schedule": "40",
                    "pipe_NPD": 4.0,
                    "roughness": 4.57e-5,
                    "length": {"value": 10.0, "unit": "m"},
                    "fitting_type": "LR",
                    "fittings": [
                        {"type": "elbow_90", "count": 2}
                    ]
                }
            ]
        }
    }
}

# Send request
response = requests.post("http://localhost:8000/api/calculate/", json=config)
result = response.json()

if result["success"]:
    print("Calculation completed!")
    print(json.dumps(result["result"], indent=2))
else:
    print(f"Error: {result['error']['message']}")
```

### Asynchronous Calculation

```python
import requests
import time

# Start async calculation
response = requests.post(
    "http://localhost:8000/api/calculate/?async_calculation=true",
    json=config
)

task_id = response.json()["result"]["task_id"]
print(f"Task started: {task_id}")

# Check status
while True:
    status_response = requests.get(f"http://localhost:8000/api/calculate/status/{task_id}")
    status_data = status_response.json()
    
    print(f"Progress: {status_data['data']['progress']}%")
    
    if status_data["data"]["status"] == "completed":
        print("Calculation completed!")
        break
    elif status_data["data"]["status"] == "failed":
        print(f"Calculation failed: {status_data['data']['error_message']}")
        break
    
    time.sleep(1)
```

### WebSocket Progress Updates

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Progress: {data['data']['progress']}% - {data['data']['message']}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("WebSocket connection closed")

def on_open(ws):
    # Subscribe to task updates
    ws.send(json.dumps({
        "type": "subscribe_task",
        "task_id": "your-task-id"
    }))

# Connect to WebSocket
ws = websocket.WebSocketApp("ws://localhost:8000/api/ws/calculation",
                          on_open=on_open,
                          on_message=on_message,
                          on_error=on_error,
                          on_close=on_close)

ws.run_forever()
```

## Testing

Run the test suite:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=backend

# Run specific test file
pytest tests/test_basic.py

# Run with verbose output
pytest -v
```

## Integration with Network-Hydraulic Library

The backend integrates seamlessly with the network-hydraulic library:

1. **Data Conversion**: Converts API requests to network-hydraulic format
2. **Unit Handling**: Automatic unit conversion and validation
3. **Error Mapping**: Maps network-hydraulic errors to API responses
4. **Validation**: Leverages network-hydraulic validation logic

### Supported Features

- **Fluid Types**: Liquid, gas, and vapor calculations
- **Flow Models**: Isothermal and adiabatic gas flow
- **Pipe Sections**: Multiple sections with fittings and components
- **Components**: Control valves, orifices, and user-defined losses
- **Units**: Comprehensive unit support with automatic conversion

## Error Handling

The API provides comprehensive error handling with detailed error messages:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Configuration validation failed",
    "details": "Fluid density must be provided for liquids",
    "field": "configuration.network.fluid.density",
    "suggestion": "Please provide fluid density in kg/m³"
  },
  "timestamp": "2023-11-12T15:00:00Z",
  "request_id": "req_123456789"
}
```

## Security Considerations

- **Input Validation**: Comprehensive validation of all inputs
- **CORS**: Configurable CORS policy for frontend integration
- **File Upload**: Secure file upload with size and type restrictions
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Error Handling**: Safe error messages that don't expose internal details

## Performance

- **Async Processing**: Non-blocking calculation execution
- **Background Tasks**: Queue-based task management
- **Database Optimization**: Efficient SQLite/PostgreSQL queries
- **Caching**: Result caching for repeated calculations
- **Resource Limits**: Configurable limits on concurrent calculations

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - HYDRAULIC_DATABASE_URL=postgresql://postgres:password@db:5432/hydraulic
      - HYDRAULIC_DEBUG=false
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=hydraulic
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Kubernetes

See `k8s/` directory for Kubernetes deployment manifests.

## Monitoring and Logging

- **Structured Logging**: JSON-formatted logs with request tracking
- **Health Checks**: Built-in health check endpoints
- **Metrics**: System status and performance metrics
- **Error Tracking**: Comprehensive error logging and reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the same license as the network-hydraulic library.

## Support

- **Documentation**: [API Documentation](http://localhost:8000/api/docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/network-hydraulic/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/network-hydraulic/discussions)

## Changelog

### v1.0.0 (2023-11-12)

- Initial release
- Complete FastAPI backend implementation
- Integration with network-hydraulic library
- WebSocket support for real-time updates
- Comprehensive API documentation
- Test suite implementation