from flask import Blueprint

support_bp = Blueprint("support", __name__)

from app.modules.support import routes
