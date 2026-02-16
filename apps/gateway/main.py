import httpx
from fastapi import FastAPI, Request, HTTPException, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway")

app = FastAPI(title="Inventory Intelligence API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Service URLs - Print startup config
logger.info("Initializing Gateway with Service URLs:")
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
for name, url in SERVICES.items():
    logger.info(f"  {name.upper()}: {url}")

async def proxy_request(service_url: str, path: str, request: Request):
    # Intelligent Protocol Handling
    if not service_url.startswith(("http://", "https://")):
        if "onrender.com" in service_url:
            service_url = f"https://{service_url}"
        else:
            service_url = f"http://{service_url}"
        
    url = f"{service_url}{path}"
    
    logger.info(f"Proxying {request.method} request to: {url}")
    
    # Increase timeout and follow redirects
    async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
        try:
            # Forward request
            content = await request.body()
            
            # Filter headers
            headers = dict(request.headers)
            headers.pop("host", None)
            
            # Handle Content-Length and Transfer-Encoding
            # We read the full body, so we are not sending chunked data upstream.
            # We should remove Transfer-Encoding if present.
            headers.pop("transfer-encoding", None)
            
            # Let httpx handle content-length based on the content we provide
            headers.pop("content-length", None)
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=content,
                params=request.query_params
            )
            
            # Check content type before parsing JSON
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return JSONResponse(content=response.json(), status_code=response.status_code)
            else:
                return Response(content=response.content, status_code=response.status_code, media_type=content_type)
                
        except httpx.RequestError as exc:
            logger.error(f"Proxy connection error: {exc}")
            return JSONResponse(content={"error": f"Service unavailable: {exc}", "url": url}, status_code=503)
        except Exception as exc:
            logger.error(f"Unexpected proxy error: {exc}")
            return JSONResponse(content={"error": str(exc)}, status_code=500)

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

@app.api_route("/api/auth", methods=["GET", "POST"])
async def auth_root_proxy(request: Request):
    return await proxy_request(SERVICES["auth"], "/api/auth", request)

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
