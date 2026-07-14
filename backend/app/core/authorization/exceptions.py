class AuthorizationError(Exception):
    """Base exception for authorization and policy evaluation errors."""
    pass

class AccessDeniedError(AuthorizationError):
    """Raised when a user lacks the necessary permission or correct organizational scope context."""
    def __init__(self, message: str = "Access Denied"):
        self.message = message
        super().__init__(self.message)
