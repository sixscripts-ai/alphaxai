import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Inventory Intelligence API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:3001"),
    "organization": os.getenv("ORGANIZATION_SERVICE_URL", "http://organization-service:3002"),
    "inventory": os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:3003"),
    "usage": os.getenv("USAGE_SERVICE_URL", "http://usage-service:3004"),
    "alert": os.getenv("ALERT_SERVICE_URL", "http://alert-service:3005"),
    "audit": os.getenv("AUDIT_SERVICE_URL", "http://audit-service:3006"),
    "billing": os.getenv("BILLING_SERVICE_URL", "http://billing-service:3007"),
    "integration": os.getenv("INTEGRATION_SERVICE_URL", "http://integration-service:3008"),
}

async def proxy_request(service_url: str, path: str, request: Request):
    client = httpx.AsyncClient()
    url = f"{service_url}{path}"
    
    try:
        # Forward request
        content = await request.body()
        response = await client.request(
            method=request.method,
            url=url,
            headers=request.headers,
            content=content,
            params=request.query_params,
            timeout=30.0
        )
        return JSONResponse(content=response.json(), status_code=response.status_code)
    except httpx.RequestError as exc:
        return JSONResponse(content={"error": f"Service unavailable: {exc}"}, status_code=503)
    except Exception as exc:
        return JSONResponse(content={"error": str(exc)}, status_code=500)
    finally:
        await client.aclose()

@app.get("/")
async def root():
    return {"message": "Inventory Intelligence API Gateway is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Auth Routes
@app.api_route("/api/auth/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def auth_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["auth"], f"/api/auth/{path}", request)

# Organization Routes
@app.api_route("/api/locations/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def location_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["organization"], f"/api/locations/{path}", request)

@app.api_route("/api/locations", methods=["GET", "POST"])
async def location_root_proxy(request: Request):
    return await proxy_request(SERVICES["organization"], "/api/locations", request)

# Inventory Routes
@app.api_route("/api/inventory/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def inventory_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["inventory"], f"/api/inventory/{path}", request)

@app.api_route("/api/inventory", methods=["GET", "POST"])
async def inventory_root_proxy(request: Request):
    return await proxy_request(SERVICES["inventory"], "/api/inventory", request)

# Add other service proxies as needed
