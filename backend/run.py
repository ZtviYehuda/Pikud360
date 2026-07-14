import os
from app import create_app
from app.config import get_settings

app = create_app()

if __name__ == "__main__":
    settings = get_settings()
    # In Docker and production, port is mapped through environment or container configuration
    port = int(os.getenv("PORT", settings.PORT))
    
    # Run the application
    app.run(host="0.0.0.0", port=port, debug=settings.DEBUG)
