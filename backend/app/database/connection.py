import logging
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from typing import Generator, Optional
from app.config import get_settings

logger = logging.getLogger("pikud360.database")

class DatabaseConnectionManager:
    """Manages thread-safe PostgreSQL connection pooling."""
    
    _pool: Optional[pool.ThreadedConnectionPool] = None

    @classmethod
    def initialize(cls) -> None:
        """Initializes the thread-safe connection pool."""
        if cls._pool is not None:
            logger.warning("Database connection pool is already initialized.")
            return

        settings = get_settings()
        try:
            logger.info(
                f"Initializing DB pool on {settings.DB_HOST}:{settings.DB_PORT} "
                f"with min={settings.DB_MIN_CONNECTIONS}, max={settings.DB_MAX_CONNECTIONS}"
            )
            cls._pool = pool.ThreadedConnectionPool(
                minconn=settings.DB_MIN_CONNECTIONS,
                maxconn=settings.DB_MAX_CONNECTIONS,
                dsn=settings.database_url
            )
        except psycopg2.DatabaseError as e:
            logger.error(f"Failed to initialize database connection pool: {e}", exc_info=True)
            raise

    @classmethod
    def get_connection(cls):
        """Retrieves a connection from the pool."""
        if cls._pool is None:
            cls.initialize()
        if cls._pool is None:
            raise psycopg2.DatabaseError("Connection pool is not initialized.")
        return cls._pool.getconn()

    @classmethod
    def release_connection(cls, conn) -> None:
        """Returns a connection back to the pool."""
        if cls._pool is not None and conn is not None:
            cls._pool.putconn(conn)

    @classmethod
    def close_all(cls) -> None:
        """Closes all connections in the pool (shutdown hook)."""
        if cls._pool is not None:
            logger.info("Closing database connection pool.")
            cls._pool.closeall()
            cls._pool = None

    @classmethod
    def check_health(cls) -> bool:
        """Checks connection health by running a simple query."""
        conn = None
        try:
            conn = cls.get_connection()
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1;")
                cursor.fetchone()
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return False
        finally:
            if conn is not None:
                cls.release_connection(conn)


@contextmanager
def get_db_connection() -> Generator[psycopg2.extensions.connection, None, None]:
    """Context manager to lease and release database connections from the pool."""
    import flask
    connection = None
    try:
        connection = DatabaseConnectionManager.get_connection()
        
        # Automatically inject RLS tenant scope if Flask request context has resolved one
        if flask.has_request_context() and hasattr(flask.g, "current_tenant_id") and flask.g.current_tenant_id:
            with connection.cursor() as cur:
                # Executes within the connection transaction block
                cur.execute("SET LOCAL app.current_tenant_id = %s;", (flask.g.current_tenant_id,))
                
        yield connection
    except Exception as e:
        logger.error(f"Database transaction error: {e}", exc_info=True)
        if connection is not None:
            connection.rollback()
        raise
    finally:
        if connection is not None:
            DatabaseConnectionManager.release_connection(connection)

