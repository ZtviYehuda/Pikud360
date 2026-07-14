from abc import ABC
from typing import Generic, TypeVar, List, Optional
from app.repositories.base import BaseRepository

T = TypeVar('T')
ID = TypeVar('ID')

class BaseService(ABC, Generic[T, ID]):
    """Base Service implementing the service layer contract and Dependency Injection."""
    
    def __init__(self, repository: BaseRepository[T, ID]):
        self._repository = repository
        
    def get_by_id(self, entity_id: ID) -> Optional[T]:
        """Gets an entity by its identifier."""
        return self._repository.get_by_id(entity_id)
        
    def get_all(self) -> List[T]:
        """Gets all entities."""
        return self._repository.get_all()
        
    def create(self, entity: T) -> T:
        """Saves a new entity."""
        return self._repository.create(entity)
        
    def update(self, entity_id: ID, entity: T) -> Optional[T]:
        """Updates an existing entity."""
        return self._repository.update(entity_id, entity)
        
    def delete(self, entity_id: ID) -> bool:
        """Deletes an entity by its identifier."""
        return self._repository.delete(entity_id)
