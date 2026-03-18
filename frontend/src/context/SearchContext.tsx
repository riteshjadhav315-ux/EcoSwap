import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState(() => {
    return localStorage.getItem('selectedLocation') || "All Locations";
  });

  const handleSetLocation = (location: string) => {
    setSelectedLocation(location);
    localStorage.setItem('selectedLocation', location);
  };

  return (
    <SearchContext.Provider value={{ 
      searchQuery, 
      setSearchQuery, 
      selectedCategory, 
      setSelectedCategory,
      selectedLocation,
      setSelectedLocation: handleSetLocation
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
