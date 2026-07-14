import logging
import sys
from app.config import get_settings

def configure_logging() -> None:
    """Configures system-wide logging formatting and output streams."""
    settings = get_settings()
    
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    # Define standard format
    log_format = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(log_format))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    root_logger.handlers = []
    root_logger.addHandler(console_handler)
    
    # Set lower logging levels for noisy external libraries
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    
    logging.info(f"Logging configured at {logging.getLevelName(log_level)} level.")
