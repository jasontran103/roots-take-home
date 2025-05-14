
// Helper function to get favorites from localStorage
export const getFavorites = (): string[] => {
    const favorites = localStorage.getItem('propertyFavorites');
    return favorites ? JSON.parse(favorites) : [];
  };
  
  // Helper function to add a property to favorites
  export const addToFavorites = (propertyId: string): string[] => {
    const favorites = getFavorites();
    if (!favorites.includes(propertyId)) {
      favorites.push(propertyId);
      localStorage.setItem('propertyFavorites', JSON.stringify(favorites));
    }
    return favorites;
  };
  
  // Helper function to remove a property from favorites
  export const removeFromFavorites = (propertyId: string): string[] => {
    const favorites = getFavorites();
    const updatedFavorites = favorites.filter(id => id !== propertyId);
    localStorage.setItem('propertyFavorites', JSON.stringify(updatedFavorites));
    return updatedFavorites;
  };
  
  // Helper function to toggle favorite status
  export const toggleFavorite = (propertyId: string): boolean => {
    const favorites = getFavorites();
    const isFavorite = favorites.includes(propertyId);
    
    if (isFavorite) {
      removeFromFavorites(propertyId);
      return false;
    } else {
      addToFavorites(propertyId);
      return true;
    }
  };
  
  // Helper function to check if a property is favorited
  export const isFavorite = (propertyId: string): boolean => {
    const favorites = getFavorites();
    return favorites.includes(propertyId);
  };