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

def get_service_url(key, default_name, port):
    # Try to get from Env Var (Render injection)
    url = os.getenv(key)
    if url:
        # Render's fromService host property may inject just a hostname without protocol
        if url and not url.startswith(("http://", "https://")):
            url = f"https://{url}"
        return url
    
    # If not set, check if we are on Render (RENDER env var is usually set)
    if os.getenv("RENDER"):
        # Fallback to Render public URL convention
        return f"https://alphaxai-{default_name}.onrender.com"
    
    # Fallback to local Docker default
    return f"http://{default_name}-service:{port}"

SERVICES = {
    "auth": get_service_url("AUTH_SERVICE_URL", "auth", 3001),
    "organization": get_service_url("ORGANIZATION_SERVICE_URL", "organization", 3002),
    "inventory": get_service_url("INVENTORY_SERVICE_URL", "inventory", 3003),
    "usage": get_service_url("USAGE_SERVICE_URL", "usage", 3004),
    "alert": get_service_url("ALERT_SERVICE_URL", "alert", 3005),
    "audit": get_service_url("AUDIT_SERVICE_URL", "audit", 3006),
    "billing": get_service_url("BILLING_SERVICE_URL", "billing", 3007),
    "integration": get_service_url("INTEGRATION_SERVICE_URL", "integration", 3008),
    "worker": get_service_url("WORKER_SERVICE_URL", "worker", 8000),
    "suppliers": get_service_url("SUPPLIERS_SERVICE_URL", "suppliers", 3009),
    "team": get_service_url("TEAM_SERVICE_URL", "team", 3010),
    "shipments": get_service_url("SHIPMENTS_SERVICE_URL", "shipments", 3011),
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
    async with httpx.AsyncClient(follow_redirects=True, timeout=300.0) as client:
        try:
            # Forward request
            content = await request.body()
            
            # Filter headers
            headers = dict(request.headers)
            headers.pop("host", None)
            
            # Remove accept-encoding to prevent upstream from sending compressed
            # responses that the gateway can't decode when parsing JSON
            headers.pop("accept-encoding", None)
            
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

# Health check proxies — each service has /health at its root
@app.get("/api/health/{service_name}")
async def service_health_proxy(service_name: str, request: Request):
    if service_name == "gateway":
        return {"status": "healthy", "service": "gateway"}
    if service_name not in SERVICES:
        return JSONResponse(content={"error": f"Unknown service: {service_name}"}, status_code=404)
    return await proxy_request(SERVICES[service_name], "/health", request)

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

# Analytics/Worker Routes
@app.api_route("/api/analytics/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def analytics_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["worker"], f"/{path}", request)

@app.api_route("/api/analytics", methods=["GET", "POST"])
async def analytics_root_proxy(request: Request):
    return await proxy_request(SERVICES["worker"], "/", request)

# Suppliers Routes
@app.api_route("/api/suppliers/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def suppliers_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["suppliers"], f"/api/suppliers/{path}", request)

@app.api_route("/api/suppliers", methods=["GET", "POST"])
async def suppliers_root_proxy(request: Request):
    return await proxy_request(SERVICES["suppliers"], "/api/suppliers", request)

# Team Routes
@app.api_route("/api/team/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def team_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["team"], f"/api/team/{path}", request)

@app.api_route("/api/team", methods=["GET", "POST"])
async def team_root_proxy(request: Request):
    return await proxy_request(SERVICES["team"], "/api/team", request)

# Shipments Routes
@app.api_route("/api/shipments/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def shipments_proxy(path: str, request: Request):
    return await proxy_request(SERVICES["shipments"], f"/api/shipments/{path}", request)

@app.api_route("/api/shipments", methods=["GET", "POST"])
async def shipments_root_proxy(request: Request):
    return await proxy_request(SERVICES["shipments"], "/api/shipments", request)
