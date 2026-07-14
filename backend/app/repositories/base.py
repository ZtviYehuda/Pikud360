from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Any

T = TypeVar('T')
ID = TypeVar('ID')

class BaseRepository(ABC, Generic[T, ID]):
    """Abstract interface defining the Contract for repository classes."""
    
    @abstractmethod
    def get_by_id(self, entity_id: ID) -> Optional[T]:
        """Fetch a single record by its primary key ID."""
        pass
        
    @abstractmethod
    def get_all(self) -> List[T]:
        """Fetch all records in the collection."""
        pass
        
    @abstractmethod
    def create(self, entity: T) -> T:
        """Persist a new entity to the database."""
        pass
        
    @abstractmethod
    def update(self, entity_id: ID, entity: T) -> Optional[T]:
        """Modify an existing entity by its ID."""
        pass
        
    @abstractmethod
    def delete(self, entity_id: ID) -> bool:
        """Remove an entity by its ID."""
        pass
