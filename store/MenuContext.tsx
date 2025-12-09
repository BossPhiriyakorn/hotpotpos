import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Item, Soup, SpiceLevel } from '../types';
import { ADD_ONS, SOUPS, SPICE_LEVELS } from '../constants';
import apiService from '../services/api';

interface MenuContextType {
  addOns: Item[];
  soups: Soup[];
  spiceLevels: SpiceLevel[];
  loading: boolean;
  error: string | null;
  addAddOn: (item: Item) => void;
  updateAddOn: (item: Item) => void;
  deleteAddOn: (id: number) => void;
  addSoup: (soup: Soup) => void;
  updateSoup: (soup: Soup) => void;
  deleteSoup: (id: string) => void;
  addSpiceLevel: (spice: SpiceLevel) => void;
  updateSpiceLevel: (spice: SpiceLevel) => void;
  deleteSpiceLevel: (id: string) => void;
  refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const MenuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [addOns, setAddOns] = useState<Item[]>(ADD_ONS);
  const [soups, setSoups] = useState<Soup[]>(SOUPS);
  const [spiceLevels, setSpiceLevels] = useState<SpiceLevel[]>(SPICE_LEVELS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch menu data from API
  const fetchMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [addonsData, soupsData, spiceLevelsData] = await Promise.all([
        apiService.getAddons(),
        apiService.getSoups(),
        apiService.getSpiceLevels(),
      ]);

      // Transform API data to match frontend types
      setAddOns(addonsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image_url || item.image || '',
        description: item.description || '',
        isSpecial: item.is_special || false,
      })));

      setSoups(soupsData.map((soup: any) => ({
        id: soup.id,
        name: soup.name,
        image: soup.image_url || soup.image || '',
        isSpicy: soup.is_spicy || false,
        isSpecial: soup.is_special || false,
      })));

      setSpiceLevels(spiceLevelsData.map((spice: any) => ({
        id: spice.id,
        name: spice.name,
        price: spice.price ? parseFloat(spice.price) : 0,
      })));

    } catch (err: any) {
      console.error('Failed to fetch menu data:', err);
      setError(err.message || 'Failed to load menu data');
      // Fallback to constants if API fails
      setAddOns(ADD_ONS);
      setSoups(SOUPS);
      setSpiceLevels(SPICE_LEVELS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchMenuData();

    // Auto-refresh every 60 seconds to keep menu data up-to-date
    // This ensures Kiosk always has the latest menu items, addons, soups, and spice levels
    const interval = setInterval(() => {
      fetchMenuData();
    }, 60000); // 60 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  const refreshMenu = async () => {
    await fetchMenuData();
  };

  // Add-ons
  const addAddOn = async (item: Item) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        name: item.name,
        price: item.price,
        image_url: item.image || null,
        description: item.description || null,
        is_special: item.isSpecial || false,
        sort_order: 0,
        is_active: true,
      };
      
      const result = await apiService.createAddon(backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to create addon:', error);
      throw error;
    }
  };

  const updateAddOn = async (item: Item) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        name: item.name,
        price: item.price,
        image_url: item.image || null,
        description: item.description || null,
        is_special: item.isSpecial || false,
        sort_order: 0,
        is_active: true,
      };
      
      await apiService.updateAddon(item.id, backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to update addon:', error);
      throw error;
    }
  };

  const deleteAddOn = async (id: number) => {
    try {
      await apiService.deleteAddon(id);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to delete addon:', error);
      throw error;
    }
  };

  // Soups
  const addSoup = async (soup: Soup) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        id: soup.id,
        name: soup.name,
        image_url: soup.image || null,
        is_spicy: soup.isSpicy || false,
        is_special: soup.isSpecial || false,
        sort_order: 0,
        is_active: true,
      };
      
      await apiService.createSoup(backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to create soup:', error);
      throw error;
    }
  };

  const updateSoup = async (soup: Soup) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        name: soup.name,
        image_url: soup.image || null,
        is_spicy: soup.isSpicy || false,
        is_special: soup.isSpecial || false,
        sort_order: 0,
        is_active: true,
      };
      
      await apiService.updateSoup(soup.id, backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to update soup:', error);
      throw error;
    }
  };

  const deleteSoup = async (id: string) => {
    try {
      await apiService.deleteSoup(id);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to delete soup:', error);
      throw error;
    }
  };

  // Spice Levels
  const addSpiceLevel = async (spice: SpiceLevel) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        id: spice.id,
        name: spice.name,
        price: spice.price || 0,
        sort_order: 0,
        is_active: true,
      };
      
      await apiService.createSpiceLevel(backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to create spice level:', error);
      throw error;
    }
  };

  const updateSpiceLevel = async (spice: SpiceLevel) => {
    try {
      // Transform frontend format to backend format
      const backendData = {
        name: spice.name,
        price: spice.price || 0,
        sort_order: 0,
        is_active: true,
      };
      
      await apiService.updateSpiceLevel(spice.id, backendData);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to update spice level:', error);
      throw error;
    }
  };

  const deleteSpiceLevel = async (id: string) => {
    try {
      await apiService.deleteSpiceLevel(id);
      // Refresh menu data to get the latest from database
      await fetchMenuData();
    } catch (error: any) {
      console.error('Failed to delete spice level:', error);
      throw error;
    }
  };

  return (
    <MenuContext.Provider value={{
      addOns, soups, spiceLevels,
      loading, error,
      addAddOn, updateAddOn, deleteAddOn,
      addSoup, updateSoup, deleteSoup,
      addSpiceLevel, updateSpiceLevel, deleteSpiceLevel,
      refreshMenu
    }}>
      {children}
    </MenuContext.Provider>
  );
};

export const useMenu = () => {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};