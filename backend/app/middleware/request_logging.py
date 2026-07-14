import time
import logging
from flask import Flask, request, g

logger = logging.getLogger("pikud360.request")

def register_request_logging(app: Flask) -> None:
    """Registers before and after request hooks to measure performance and log details."""
    
    @app.before_request
    def start_timer():
        g.start_time = time.time()
        
    @app.after_request
    def log_request_details(response):
        # Skip health check endpoints if log volume is high (optional)
        if request.path == "/health":
            return response
            
        duration_ms = 0.0
        if hasattr(g, 'start_time'):
            duration_ms = (time.time() - g.start_time) * 1000.0
            
        logger.info(
            f"Method: {request.method} | "
            f"Path: {request.path} | "
            f"Status: {response.status_code} | "
            f"IP: {request.remote_addr} | "
            f"Duration: {duration_ms:.2f}ms"
        )
        return response
