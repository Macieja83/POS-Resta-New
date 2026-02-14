import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi, MenuCategory, AddonGroup, AddonItem, Dish, Size, Ingredient, Modifier } from '../api/menu';
import { uploadApi } from '../api/upload';
import { IngredientsManager } from '../components/menu/IngredientsManager';
import './MenuManagementPage.css';


// Usuwamy stare interfejsy - używamy teraz prawdziwych typów z API

interface HalfHalfConfig {
  id: string;
  name: string;
  categoryId: string;
  available: boolean;
  dishes: string[]; // Array of dish IDs
  sizes: string[]; // Array of size IDs
}






// Usuwamy mock data - używamy teraz prawdziwego API

const MOCK_HALF_HALF_CONFIGS: HalfHalfConfig[] = [
  {
    id: '1',
    name: 'Pizza pół na pół',
    categoryId: '', // Będzie ustawione dynamicznie po załadowaniu kategorii
    available: true,
    dishes: [], // Array of dish IDs - będzie ustawione dynamicznie
    sizes: [] // Array of size IDs - będzie ustawione dynamicznie
  }
];



export const MenuManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [selectedModifierGroup, setSelectedModifierGroup] = useState<AddonGroup | null>(null);
  const [selectedModifier, setSelectedModifier] = useState<Modifier | null>(null);
  const [selectedAddonGroup, setSelectedAddonGroup] = useState<AddonGroup | null>(null);
  const [selectedHalfHalfConfig, setSelectedHalfHalfConfig] = useState<HalfHalfConfig | null>(null);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState(0);
  const [isAddingNewAddon, setIsAddingNewAddon] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('info');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Usuwamy stary state - używamy teraz addonGroups z API
  const [halfHalfConfigs, setHalfHalfConfigs] = useState<HalfHalfConfig[]>(() => {
    // Wczytaj z localStorage lub użyj mock data
    const saved = localStorage.getItem('halfHalfConfigs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sprawdź czy konfiguracja używa starych ID - jeśli tak, zresetuj
        if (parsed.some((config: any) => config.categoryId === 'pizza-category')) {
          localStorage.setItem('halfHalfConfigs', JSON.stringify(MOCK_HALF_HALF_CONFIGS));
          return MOCK_HALF_HALF_CONFIGS;
        }
        return parsed;
      } catch (e) {
        localStorage.setItem('halfHalfConfigs', JSON.stringify(MOCK_HALF_HALF_CONFIGS));
        return MOCK_HALF_HALF_CONFIGS;
      }
    }
    return MOCK_HALF_HALF_CONFIGS;
  });
  const [isDefaultCategory, setIsDefaultCategory] = useState(false);
  const [vatRate, setVatRate] = useState('8% B');
  const [newSizeName, setNewSizeName] = useState('');
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editingSizeName, setEditingSizeName] = useState('');
  const [eRestaurantAvailable, setERestaurantAvailable] = useState(true);

  // Pobieranie kategorii z API
  const { data: categories = [] } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => menuApi.getCategories(),
    select: (data) => data.success ? data.data : [],
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true
  });

  // Pobieranie pozycji menu dla wybranej kategorii
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu-items', selectedCategory?.id],
    queryFn: () => selectedCategory ? menuApi.getDishes(selectedCategory.id) : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedCategory,
    select: (data) => data.success ? data.data : [],
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true
  });

  // Pobieranie wszystkich pozycji menu dla funkcji pół na pół - zoptymalizowane
  const { data: allMenuItemsResponse } = useQuery({
    queryKey: ['all-menu-items'],
    queryFn: async () => {
      // Pobierz wszystkie kategorie
      const categoriesResponse = await menuApi.getCategories();
      if (!categoriesResponse.success) return { success: false, data: [] };
      
      // Pobierz pozycje z każdej kategorii równolegle
      const itemsPromises = categoriesResponse.data.map(category => 
        menuApi.getDishes(category.id).then(response => 
          response.success ? response.data : []
        )
      );
      
      const itemsResults = await Promise.all(itemsPromises);
      const allItems = itemsResults.flat();
      
      return { success: true, data: allItems };
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    enabled: categories.length > 0 // Only run when categories are loaded
  });
  const allMenuItems = allMenuItemsResponse?.success ? allMenuItemsResponse.data : [];

  // Automatyczne ustawianie konfiguracji pół na pół po załadowaniu kategorii
  useEffect(() => {
    if (categories.length > 0 && halfHalfConfigs.length > 0) {
      const pizzaCategory = categories.find(cat => cat.name === 'Pizza');
      if (pizzaCategory && halfHalfConfigs[0].categoryId === '') {
        console.log('🔧 Auto-setting half-half config for Pizza category:', pizzaCategory.id);
        const updatedConfigs = halfHalfConfigs.map(config => 
          config.id === '1' ? { ...config, categoryId: pizzaCategory.id } : config
        );
        setHalfHalfConfigs(updatedConfigs);
        localStorage.setItem('halfHalfConfigs', JSON.stringify(updatedConfigs));
      }
    }
  }, [categories, halfHalfConfigs]);

  // Automatyczne ustawianie dań w konfiguracji pół na pół po załadowaniu pozycji menu
  useEffect(() => {
    if (allMenuItems.length > 0 && halfHalfConfigs.length > 0 && halfHalfConfigs[0].categoryId !== '') {
      const pizzaCategoryId = halfHalfConfigs[0].categoryId;
      const pizzaDishes = allMenuItems.filter(item => item.categoryId === pizzaCategoryId);
      
      if (pizzaDishes.length > 0 && halfHalfConfigs[0].dishes.length === 0) {
        console.log('🔧 Auto-setting half-half dishes:', pizzaDishes.map(d => d.id));
        const updatedConfigs = halfHalfConfigs.map(config => 
          config.id === '1' ? { ...config, dishes: pizzaDishes.map(d => d.id) } : config
        );
        setHalfHalfConfigs(updatedConfigs);
        localStorage.setItem('halfHalfConfigs', JSON.stringify(updatedConfigs));
      }
    }
  }, [allMenuItems, halfHalfConfigs]);

  // Pobieranie grup dodatków z API
  const { data: addonGroups = [] } = useQuery({
    queryKey: ['addon-groups'],
    queryFn: () => menuApi.getAddonGroups(),
    select: (data) => data.success ? data.data : [],
    staleTime: 30 * 1000, // Cache for 30 seconds
    refetchOnWindowFocus: true
  });

  // Usunięto redundantne zapytania - używamy bezpośrednio selectedCategory i selectedDish

  // Pobieranie modyfikatora dla wybranej grupy
  const { data: modifier } = useQuery({
    queryKey: ['modifier', selectedModifierGroup?.id],
    queryFn: () => selectedModifierGroup ? menuApi.getModifier(selectedModifierGroup.id) : Promise.resolve({ success: true, data: null }),
    enabled: !!selectedModifierGroup,
    select: (data) => data.success ? data.data : null
  });

  // Mutacje dla kategorii
  const createCategoryMutation = useMutation({
    mutationFn: menuApi.createCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      // Ustaw nowo utworzoną kategorię jako wybraną
      if (data.success) {
        setSelectedCategory(data.data);
      }
    },
    onError: (error) => {
      console.error('Error creating category:', error);
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => menuApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: menuApi.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setSelectedCategory(null);
    }
  });

  // Mutacje dla rozmiarów kategorii
  const addCategorySizeMutation = useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) => 
      menuApi.addCategorySize(categoryId, { name }),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      setNewSizeName('');
      
      // Aktualizuj selectedCategory z nowym rozmiarem
      if (selectedCategory && selectedCategory.id === variables.categoryId && response.success && response.data) {
        const updatedSizes = [...(selectedCategory.sizes || []), response.data];
        setSelectedCategory({
          ...selectedCategory,
          sizes: updatedSizes
        });
      }
    },
  });

  const removeCategorySizeMutation = useMutation({
    mutationFn: ({ categoryId, sizeName }: { categoryId: string; sizeName: string }) => 
      menuApi.removeCategorySize(categoryId, sizeName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      // Aktualizuj selectedCategory usuwając rozmiar
      if (selectedCategory && selectedCategory.id === variables.categoryId) {
        const updatedSizes = (selectedCategory.sizes || []).filter((size: any) => {
          const sizeName = typeof size === 'string' ? size : size.name;
          return sizeName !== variables.sizeName;
        });
        setSelectedCategory({
          ...selectedCategory,
          sizes: updatedSizes
        });
      }
    },
  });

  const updateCategorySizeMutation = useMutation({
    mutationFn: ({ categoryId, sizeName, newName }: { categoryId: string; sizeName: string; newName: string }) => 
      menuApi.updateCategorySize(categoryId, sizeName, newName),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      // Aktualizuj selectedCategory zmieniając nazwę rozmiaru
      if (selectedCategory && selectedCategory.id === variables.categoryId) {
        const updatedSizes = (selectedCategory.sizes || []).map((size: any) => {
          const currentSizeName = typeof size === 'string' ? size : size.name;
          if (currentSizeName === variables.sizeName) {
            return typeof size === 'string' ? variables.newName : { ...size, name: variables.newName };
          }
          return size;
        });
        setSelectedCategory({
          ...selectedCategory,
          sizes: updatedSizes
        });
      }
    },
  });

  // Mutacje dla pozycji menu
  const createMenuItemMutation = useMutation({
    mutationFn: menuApi.createDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    }
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      console.log('🔄 Updating menu item:', { id, data });
      return menuApi.updateDish(id, data);
    },
    onSuccess: (data) => {
      console.log('✅ Menu item updated successfully:', data);
      setSaveStatus('saved');
      // Force refetch all menu-related queries
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-items'] });
      // Force refetch current category items
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', selectedCategory.id] });
      }
      // Update local state
      if (data.success) {
        setSelectedDish(data.data);
      }
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      console.error('❌ Error updating dish:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: menuApi.deleteDish,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
    }
  });

  // Mutacje dla dodatków do pozycji menu
  const assignAddonGroupMutation = useMutation({
    mutationFn: ({ itemId, addonGroupId }: { itemId: string; addonGroupId: string }) => 
      menuApi.assignAddonGroupToDish(itemId, addonGroupId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-items'] });
      
      // Aktualizuj lokalny stan selectedDish
      if (selectedDish && response.success && (response.data as any).group) {
        setSelectedDish(prev => ({
          ...prev!,
          addonGroups: [...(prev?.addonGroups || []), (response.data as any).group]
        }));
      }
    },
    onError: (error) => {
      console.error('Error assigning addon group:', error);
    }
  });

  const removeAddonGroupMutation = useMutation({
    mutationFn: ({ itemId, addonGroupId }: { itemId: string; addonGroupId: string }) => 
      menuApi.removeAddonGroupFromDish(itemId, addonGroupId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-items'] });
      
      // Aktualizuj lokalny stan selectedDish
      if (selectedDish && response.success && (response.data as any).groupId) {
        setSelectedDish(prev => ({
          ...prev!,
          addonGroups: prev?.addonGroups?.filter(group => group.id !== (response.data as any).groupId) || []
        }));
      }
    },
    onError: (error) => {
      console.error('Error removing addon group:', error);
    }
  });

  // Mutacja do aktualizacji rozmiarów pozycji menu
  const updateMenuItemSizesMutation = useMutation({
    mutationFn: ({ itemId, sizes }: { itemId: string; sizes: { name: string; price: number }[] }) => {
      console.log('🔄 Updating menu item sizes:', { itemId, sizes });
      return menuApi.updateMenuItemSizes(itemId, sizes);
    },
    onSuccess: (response) => {
      console.log('✅ Menu item sizes updated successfully:', response);
      setSaveStatus('saved');
      // Force refetch all menu-related queries
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-menu-items'] });
      // Force refetch current category items
      if (selectedDish && response.success) {
        queryClient.invalidateQueries({ queryKey: ['menu-items', selectedDish.categoryId] });
      }
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: (error) => {
      console.error('❌ Error updating menu item sizes:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  });

  // Mutacje dla dodatków do kategorii
  const assignAddonGroupToCategoryMutation = useMutation({
    mutationFn: ({ categoryId, addonGroupId }: { categoryId: string; addonGroupId: string }) => 
      menuApi.assignAddonGroupToCategory(categoryId, addonGroupId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      // Odśwież dane dla wybranej kategorii
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['menu-categories', selectedCategory.id] });
      }
    }
  });

  const removeAddonGroupFromCategoryMutation = useMutation({
    mutationFn: ({ categoryId, addonGroupId }: { categoryId: string; addonGroupId: string }) => 
      menuApi.removeAddonGroupFromCategory(categoryId, addonGroupId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      // Odśwież dane dla wybranej kategorii
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['menu-categories', selectedCategory.id] });
      }
    }
  });

  // Mutacje dla grup dodatków
  const createAddonGroupMutation = useMutation({
    mutationFn: menuApi.createAddonGroup,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      setSelectedAddonGroup(data.data);
    }
  });

  const updateAddonGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddonGroup> }) => 
      menuApi.updateAddonGroup(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      setSelectedAddonGroup(data.data);
    }
  });

  const deleteAddonGroupMutation = useMutation({
    mutationFn: menuApi.deleteAddonGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      setSelectedAddonGroup(null);
    }
  });

  const createAddonMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: Partial<AddonItem> }) => 
      menuApi.createAddonItem(groupId, data as any),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      // Aktualizuj lokalny stan selectedAddonGroup
      if (selectedAddonGroup && response.success && response.data) {
        console.log('Adding new addon to local state:', response.data);
        setSelectedAddonGroup(prev => ({
          ...prev!,
          addonItems: [...(prev?.addonItems || []), response.data]
        }));
      }
    },
    onError: (error) => {
      console.error('Error creating addon item:', error);
    }
  });

  const updateAddonMutation = useMutation({
    mutationFn: ({ groupId, addonId, data }: { groupId: string; addonId: string; data: Partial<AddonItem> }) => {
      console.log('Updating addon item:', { groupId, addonId, data });
      return menuApi.updateAddonItem(groupId, addonId, data);
    },
    onSuccess: (response) => {
      console.log('Update addon success:', response);
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      // Aktualizuj lokalny stan selectedAddonGroup
      if (selectedAddonGroup && response.success && response.data) {
        console.log('Updating local state with:', response.data);
        setSelectedAddonGroup(prev => ({
          ...prev!,
          addonItems: prev?.addonItems?.map(item => 
            item.id === response.data.id ? response.data : item
          ) || []
        }));
      }
    },
    onError: (error) => {
      console.error('Error updating addon item:', error);
    }
  });

  const deleteAddonMutation = useMutation({
    mutationFn: ({ groupId, addonId }: { groupId: string; addonId: string }) => 
      menuApi.deleteAddonItem(groupId, addonId),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addon-groups'] });
      queryClient.invalidateQueries({ queryKey: ['menu-categories'] });
      
      // Aktualizuj lokalny stan selectedAddonGroup
      if (selectedAddonGroup && response.success) {
        setSelectedAddonGroup(prev => ({
          ...prev!,
          addonItems: prev?.addonItems?.filter(item => item.id !== variables.addonId) || []
        }));
      }
    },
    onError: (error) => {
      console.error('Error deleting addon item:', error);
    }
  });

  // Mutacje dla modifiers
  const createModifierMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: any }) => 
      menuApi.createModifier(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier'] });
    }
  });

  const updateModifierMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: any }) => 
      menuApi.updateModifier(groupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier'] });
    }
  });

  const deleteModifierMutation = useMutation({
    mutationFn: (groupId: string) => 
      menuApi.deleteModifier(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifier'] });
    }
  });

  // Ustaw pierwszą kategorię jako wybraną gdy kategorie się załadują
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  // Aktualizuj selectedAddonGroup gdy addonGroups się zmieni
  useEffect(() => {
    if (selectedAddonGroup && addonGroups.length > 0) {
      const updatedGroup = addonGroups.find((g: any) => g.id === selectedAddonGroup.id);
      if (updatedGroup) {
        setSelectedAddonGroup(updatedGroup);
      }
    }
  }, [addonGroups, selectedAddonGroup]);

  // Aktualizuj selectedModifier gdy modifier się zmieni
  useEffect(() => {
    if (modifier) {
      setSelectedModifier(modifier);
    } else {
      setSelectedModifier(null);
    }
  }, [modifier]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setActiveSubTab('info');
  };

  const handleCategorySelect = (category: MenuCategory) => {
    setSelectedCategory(category);
    setIsDefaultCategory(false); // MenuCategory nie ma pola isDefault
  };


  const handleDishSelect = (item: any) => {
    // Używaj cen bezpośrednio w złotówkach - bez konwersji
    const dishWithIngredients = {
      ...item,
      ingredients: item.ingredients || []
    };
    setSelectedDish(dishWithIngredients);
    
    // Automatycznie załaduj rozmiary z kategorii TYLKO jeśli danie nie ma rozmiarów I kategoria ma rozmiary
    if (item && (!item.sizes || item.sizes.length === 0)) {
      const category = categories.find(cat => cat.id === item.categoryId);
      if (category && category.sizes && category.sizes.length > 0) {
        const sizesWithPrices = category.sizes.map((size: any) => ({
          name: typeof size === 'string' ? size : size.name,
          price: 0.00 // Domyślna cena 0.00
        }));
        setSelectedDish({ ...dishWithIngredients, sizes: sizesWithPrices });
      }
    }
  };

  const handleModifierGroupSelect = (group: AddonGroup) => {
    setSelectedModifierGroup(group);
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      deleteCategoryMutation.mutate(selectedCategory.id);
    }
  };


  const handleAddCategorySize = () => {
    if (selectedCategory && newSizeName.trim()) {
      addCategorySizeMutation.mutate({
        categoryId: selectedCategory.id,
        name: newSizeName.trim()
      });
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedDish) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Plik jest za duży. Maksymalny rozmiar to 5MB.');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Proszę wybrać plik obrazu (PNG, JPG, GIF).');
      return;
    }

    try {
      setSaveStatus('saving');
      
      // Upload file
      const uploadResult = await uploadApi.uploadImage(file);
      
      if (uploadResult.success && uploadResult.data) {
        // Update dish with new image URL
        const imageUrl = uploadResult.data.path;
        setSelectedDish({...selectedDish, imageUrl});
        
        // Save to database
        await updateMenuItemMutation.mutateAsync({ 
          id: selectedDish.id, 
          data: { imageUrl } 
        });
        
        setSaveStatus('saved');
      } else {
        throw new Error(uploadResult.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setSaveStatus('error');
      alert('Błąd podczas przesyłania pliku. Spróbuj ponownie.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleRemoveCategorySize = (sizeName: string) => {
    if (selectedCategory) {
      removeCategorySizeMutation.mutate({
        categoryId: selectedCategory.id,
        sizeName
      });
    }
  };

  const handleUpdateCategorySize = (sizeName: string, newName: string) => {
    if (selectedCategory) {
      updateCategorySizeMutation.mutate({
        categoryId: selectedCategory.id,
        sizeName,
        newName
      });
    }
  };

  const handleStartEditSize = (sizeName: string) => {
    setEditingSize(sizeName);
    setEditingSizeName(sizeName);
  };

  const handleCancelEditSize = () => {
    setEditingSize(null);
    setEditingSizeName('');
  };

  const handleSaveEditSize = () => {
    if (editingSize && editingSizeName.trim() && editingSizeName !== editingSize) {
      handleUpdateCategorySize(editingSize, editingSizeName.trim());
    }
    setEditingSize(null);
    setEditingSizeName('');
  };


  const handleDeleteModifierGroup = () => {
    if (selectedModifierGroup) {
      // Usuń grupę dodatków (to usunie też modyfikator)
      deleteAddonGroupMutation.mutate(selectedModifierGroup.id);
      setSelectedModifierGroup(null);
    }
  };



  const handleAddCategory = () => {
    createCategoryMutation.mutate({ name: 'Nowa kategoria' });
  };

  const handleAddMenuItem = (categoryId: string) => {
    createMenuItemMutation.mutate({ 
      name: 'Nowa pozycja', 
      price: 10.00, 
      categoryId 
    });
  };

  const handleDeleteMenuItem = () => {
    if (selectedDish) {
      deleteMenuItemMutation.mutate(selectedDish.id);
    }
  };



  const handleAssignAddonGroup = (addonGroupId: string) => {
    if (selectedDish) {
      assignAddonGroupMutation.mutate({ 
        itemId: selectedDish.id, 
        addonGroupId 
      });
    }
  };

  const handleRemoveAddonGroup = (addonGroupId: string) => {
    if (selectedDish) {
      removeAddonGroupMutation.mutate({ 
        itemId: selectedDish.id, 
        addonGroupId 
      });
    }
  };

  // Funkcje obsługi dla kategorii
  const handleAssignAddonGroupToCategory = (addonGroupId: string) => {
    if (selectedCategory) {
      assignAddonGroupToCategoryMutation.mutate({ 
        categoryId: selectedCategory.id, 
        addonGroupId 
      });
    }
  };

  const handleRemoveAddonGroupFromCategory = (addonGroupId: string) => {
    if (selectedCategory) {
      removeAddonGroupFromCategoryMutation.mutate({ 
        categoryId: selectedCategory.id, 
        addonGroupId 
      });
    }
  };



  const handleAddModifierGroup = () => {
    // Utwórz nową grupę dodatków
    createAddonGroupMutation.mutate({
      name: 'Nowa grupa modyfikatorów'
    });
  };

  const handleAddModifier = () => {
    if (selectedModifierGroup) {
      createModifierMutation.mutate({
        groupId: selectedModifierGroup.id,
        data: {
          selectionType: 'MULTI',
          minSelect: 0,
          maxSelect: null,
          includedFreeQty: 0
        }
      });
    }
  };

  const handleAddAddonGroup = () => {
    createAddonGroupMutation.mutate({
      name: 'Nowa grupa dodatków'
    });
  };

  const handleAddAddon = () => {
    // Only work with addon groups, not modifier groups
    if (selectedAddonGroup) {
      setIsAddingNewAddon(true);
      setNewAddonName('');
      setNewAddonPrice(0);
    } else {
      console.log('No addon group selected for adding addon');
    }
  };

  const handleSaveNewAddon = () => {
    if (selectedAddonGroup && newAddonName.trim()) {
      createAddonMutation.mutate({
        groupId: selectedAddonGroup.id,
        data: {
          name: newAddonName.trim(),
          price: newAddonPrice,
          isOnline: true
        }
      });
      setIsAddingNewAddon(false);
      setNewAddonName('');
      setNewAddonPrice(0);
    }
  };

  const handleCancelNewAddon = () => {
    setIsAddingNewAddon(false);
    setNewAddonName('');
    setNewAddonPrice(0);
  };

  const handleDeleteAddon = (addonId: string) => {
    // Only work with addon groups, not modifier groups
    if (selectedAddonGroup) {
      deleteAddonMutation.mutate({
        groupId: selectedAddonGroup.id,
        addonId: addonId
      });
    }
  };

  const handleDeleteAddonGroup = () => {
    // Use selectedAddonGroup for addons tab, selectedModifierGroup for modifiers tab
    const groupToUse = activeTab === 'modifiers' ? selectedModifierGroup : selectedAddonGroup;
    
    if (groupToUse) {
      deleteAddonGroupMutation.mutate(groupToUse.id);
    }
  };

  const handleAddonGroupSelect = (group: AddonGroup) => {
    console.log('Selecting addon group:', group);
    console.log('Group addonItems:', group.addonItems);
    console.log('Setting selectedAddonGroup to:', group);
    setSelectedAddonGroup(group);
    
    // Force re-render by updating state
    setTimeout(() => {
      console.log('Current selectedAddonGroup after timeout:', selectedAddonGroup);
    }, 100);
  };

  const handleHalfHalfConfigSelect = (config: HalfHalfConfig) => {
    setSelectedHalfHalfConfig(config);
  };

  const handleAddHalfHalfConfig = () => {
    const newConfig: HalfHalfConfig = {
      id: Date.now().toString(),
      name: 'Nowa konfiguracja pół na pół',
      categoryId: categories[0]?.id || '',
      available: true,
      dishes: [], // Array of dish IDs
      sizes: [] // Array of size IDs
    };
    setHalfHalfConfigs([...halfHalfConfigs, newConfig]);
    setSelectedHalfHalfConfig(newConfig);
  };

  const handleDeleteHalfHalfConfig = () => {
    if (selectedHalfHalfConfig) {
      setHalfHalfConfigs(halfHalfConfigs.filter(config => config.id !== selectedHalfHalfConfig.id));
      setSelectedHalfHalfConfig(halfHalfConfigs[0] || null);
    }
  };

  const handleSaveHalfHalfConfig = () => {
    if (selectedHalfHalfConfig) {
      console.log('💾 Saving half-half config:', selectedHalfHalfConfig);
      
      // Zapisz konfigurację do localStorage
      const updatedConfigs = halfHalfConfigs.map(config => 
        config.id === selectedHalfHalfConfig.id ? selectedHalfHalfConfig : config
      );
      setHalfHalfConfigs(updatedConfigs);
      
      // Zapisz do localStorage
      localStorage.setItem('halfHalfConfigs', JSON.stringify(updatedConfigs));
      
      // Wyślij event do innych komponentów
      window.dispatchEvent(new CustomEvent('halfHalfConfigsUpdated', { 
        detail: updatedConfigs 
      }));
      
      // Pokaż komunikat o zapisaniu
      alert('Konfiguracja pół na pół została zapisana!');
      
      console.log('✅ Half-half config saved successfully');
    }
  };



  const handleSetDefaultCategory = () => {
    setIsDefaultCategory(!isDefaultCategory);
  };

  const renderCategoriesTab = () => (
    <div className="categories-section">
      <div className="section-header">
        <h3>Kategorie</h3>
        <span className="category-count">{categories.length}</span>
      </div>
      
      <button className="add-category-btn" onClick={handleAddCategory}>
        + Dodaj nową kategorię
      </button>

      <div className="categories-list">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`category-item ${selectedCategory?.id === category.id ? 'selected' : ''}`}
            onClick={() => handleCategorySelect(category)}
          >
            <div className="category-drag">=</div>
            <div className="category-info">
              <div className="category-name">
                {category.name}
              </div>
              <div className="category-meta">
                <span className="category-icon">🍽️</span>
                <span className="item-count">{category.itemCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderDishesTab = () => (
    <div className="dishes-section">
      <div className="section-header">
        <h3>Pozycje menu</h3>
        <span className="category-count">{menuItems.length}</span>
      </div>

      <div className="dishes-categories">
        <div className="dish-category">
          <div className="category-header">
            <span className="back-arrow">←</span>
            <h4>{selectedCategory?.name || 'Wybierz kategorię'}</h4>
            <span className="dish-count">{menuItems.length}</span>
          </div>

          <div className="form-group" style={{ padding: '0 0 10px 0' }}>
            <label>Wybierz kategorię</label>
            <select
              className="form-select"
              value={selectedCategory?.id || ''}
              onChange={(e) => {
                const cat = categories.find((c: any) => c.id === e.target.value) || null;
                setSelectedCategory(cat);
              }}
            >
              <option value="">Wybierz kategorię...</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="dishes-list">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className={`dish-item ${selectedDish?.id === item.id ? 'selected' : ''}`}
                onClick={() => handleDishSelect(item)}
              >
                <div className="dish-drag">☰</div>
                {item.imageUrl && (
                  <div className="dish-image">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="dish-info">
                  <div className="dish-name">{item.name}</div>
                  <div className="dish-price">{(item.price || 0).toFixed(2).replace('.', ',')} zł</div>
                </div>
              </div>
            ))}
          </div>

          <button 
            className="add-dish-btn" 
            onClick={() => selectedCategory && handleAddMenuItem(selectedCategory.id)}
            disabled={!selectedCategory}
          >
            + Dodaj nową pozycję
          </button>
        </div>
      </div>
    </div>
  );

  const renderHalfHalfTab = () => (
    <div className="halfhalf-section">
      <div className="section-header">
        <h3>Konfiguracje pół na pół</h3>
        <span className="category-count">{halfHalfConfigs.length}</span>
      </div>
      
      <button className="add-halfhalf-config-btn" onClick={handleAddHalfHalfConfig}>
        + Dodaj nową konfigurację
      </button>

      <div className="halfhalf-configs-list">
        {halfHalfConfigs.map((config) => (
          <div
            key={config.id}
            className={`halfhalf-config-item ${selectedHalfHalfConfig?.id === config.id ? 'selected' : ''}`}
            onClick={() => handleHalfHalfConfigSelect(config)}
          >
            <div className="config-drag">=</div>
            <div className="config-info">
              <div className="config-name">{config.name}</div>
              <div className="config-details">
                {config.dishes.length} dań • {config.sizes.length} rozmiarów
              </div>
            </div>
          </div>
        ))}
        <div className="add-placeholder" onClick={handleAddHalfHalfConfig}>
          <span>+</span>
          <span>Dodaj nową konfigurację</span>
        </div>
      </div>
    </div>
  );

  const renderModifiersTab = () => (
    <div className="modifiers-section">
      <div className="section-header">
        <h3>Grupy modyfikatorów</h3>
        <span className="category-count">{addonGroups.length} grup</span>
        <button className="add-modifier-group-btn" onClick={handleAddModifierGroup}>
          + Dodaj nową grupę
        </button>
      </div>
      
      {/* Sekcja pomocy */}
      <div className="help-section">
        <h4>📖 Jak używać systemu modyfikatorów:</h4>
        <div className="help-steps">
          <div className="help-step">
            <span className="step-number">1</span>
            <span className="step-text">Utwórz grupę dodatków (np. "Sosy płatne")</span>
          </div>
          <div className="help-step">
            <span className="step-number">2</span>
            <span className="step-text">Dodaj modyfikator do grupy (ustaw zasady wyboru)</span>
          </div>
          <div className="help-step">
            <span className="step-number">3</span>
            <span className="step-text">Dodaj poszczególne dodatki do grupy</span>
          </div>
        </div>
      </div>

      <div className="modifier-groups-list">
        {addonGroups.map((group: any) => (
          <div
            key={group.id}
            className={`modifier-group-item ${selectedModifierGroup?.id === group.id ? 'selected' : ''}`}
            onClick={() => handleModifierGroupSelect(group)}
          >
            <div className="group-drag">☰</div>
            <div className="group-info">
              <div className="group-name">{group.name}</div>
              <div className="group-details">
{group.modifier ? 'Modyfikator' : 'Brak modyfikatora'}
              </div>
            </div>
            <span className="special-icon">⚙️</span>
          </div>
        ))}
        <div className="add-placeholder" onClick={handleAddModifierGroup}>
          <span>+</span>
          <span>Dodaj nową grupę</span>
        </div>
      </div>
    </div>
  );

  const renderAddonsTab = () => (
    <div className="addons-section">
      <div className="section-header">
        <h3>Grupy dodatków</h3>
        <span className="category-count">{addonGroups.length} grup</span>
        <button className="add-addon-group-btn" onClick={handleAddAddonGroup}>
          + Dodaj nową grupę
        </button>
      </div>
      
      {/* Sekcja pomocy */}
      <div className="help-section">
        <h4>📖 Jak używać systemu dodatków:</h4>
        <div className="help-steps">
          <div className="help-step">
            <span className="step-number">1</span>
            <span className="step-text">Utwórz grupę dodatków (np. "Dodatki do pizzy")</span>
          </div>
          <div className="help-step">
            <span className="step-number">2</span>
            <span className="step-text">Dodaj poszczególne dodatki do grupy (np. "Ser", "Szynka")</span>
          </div>
          <div className="help-step">
            <span className="step-number">3</span>
            <span className="step-text">Przypisz grupę do kategorii lub konkretnego dania</span>
          </div>
        </div>
      </div>

      <div className="addon-groups-list">
        {addonGroups.map((group: any) => (
          <div
            key={group.id}
            className={`addon-group-item ${selectedAddonGroup?.id === group.id ? 'selected' : ''}`}
            onClick={() => handleAddonGroupSelect(group)}
          >
            <div className="group-drag">☰</div>
            <div className="group-info">
              <div className="group-name">{group.name}</div>
              <div className="group-details">
                {group.addonItems?.length || 0} dodatków • {group.sizes?.map((size: any) => `[${typeof size === 'string' ? size : size.name}]`).join(', ') || 'Brak rozmiarów'}
              </div>
            </div>
            <span className="special-icon">🔥</span>
          </div>
        ))}
        <div className="add-placeholder" onClick={handleAddAddonGroup}>
          <span>+</span>
          <span>Dodaj nową grupę</span>
        </div>
      </div>
    </div>
  );

  const renderDishEditPanel = () => {
    const currentDish = selectedDish;
    if (!currentDish) return null;
    
    return (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Edycja dania: {currentDish.name}</h2>
        <div className="panel-actions">
          <div className="save-status">
            {saveStatus === 'saving' && <span className="status-saving">💾 Zapisywanie...</span>}
            {saveStatus === 'saved' && <span className="status-saved">✅ Zapisano</span>}
            {saveStatus === 'error' && <span className="status-error">❌ Błąd zapisu</span>}
          </div>
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => currentDish && updateMenuItemMutation.mutate({ 
              id: currentDish.id, 
              data: { name: currentDish.name } 
            })}
            disabled={updateMenuItemMutation.isPending}
          >
            {updateMenuItemMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={handleDeleteMenuItem}>
            🗑️ USUŃ
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-group">
          <label>Nazwa dania</label>
          <input
            type="text"
            value={currentDish.name}
            onChange={(e) => {
              const newName = e.target.value;
              setSelectedDish({...currentDish, name: newName});
            }}
            onBlur={() => {
              // Automatycznie zapisz zmiany w nazwie po opuszczeniu pola
              if (currentDish && currentDish.name.trim()) {
                setSaveStatus('saving');
                updateMenuItemMutation.mutate({ 
                  id: currentDish.id, 
                  data: { name: currentDish.name.trim() } 
                });
              }
            }}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Kategoria</label>
          <select
            className="form-select"
            value={currentDish.categoryId}
            onChange={(e) => {
              const newCategoryId = e.target.value;
              setSelectedDish({...currentDish, categoryId: newCategoryId});
            }}
            onBlur={() => {
              // Automatycznie zapisz zmianę kategorii po opuszczeniu pola
              if (currentDish && currentDish.categoryId) {
                setSaveStatus('saving');
                updateMenuItemMutation.mutate({ 
                  id: currentDish.id, 
                  data: { categoryId: currentDish.categoryId } 
                });
              }
            }}
          >
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Zdjęcie</label>
          <div className="image-upload-section">
            <div className="upload-options">
              <div className="file-upload-area">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="file-input"
                />
                <label htmlFor="image-upload" className="file-upload-label">
                  <div className="upload-icon">📁</div>
                  <div className="upload-text">
                    <strong>Wybierz plik z komputera</strong>
                    <span>PNG, JPG, GIF do 5MB</span>
                  </div>
                </label>
              </div>
              
              <div className="upload-divider">
                <span>lub</span>
              </div>
              
              <div className="url-input-area">
                <input
                  type="url"
                  value={currentDish.imageUrl || ''}
                  onChange={(e) => {
                    const newImageUrl = e.target.value;
                    setSelectedDish({...currentDish, imageUrl: newImageUrl});
                  }}
                  onBlur={() => {
                    // Automatycznie zapisz zmianę URL zdjęcia po opuszczeniu pola
                    if (currentDish) {
                      setSaveStatus('saving');
                      updateMenuItemMutation.mutate({ 
                        id: currentDish.id, 
                        data: { imageUrl: currentDish.imageUrl || null } 
                      });
                    }
                  }}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            {currentDish.imageUrl && (
              <div className="image-preview">
                <img 
                  src={currentDish.imageUrl} 
                  alt={currentDish.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button 
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    setSelectedDish({...currentDish, imageUrl: ''});
                    updateMenuItemMutation.mutate({ 
                      id: currentDish.id, 
                      data: { imageUrl: null } 
                    });
                  }}
                  title="Usuń zdjęcie"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>Rozmiary i ceny</label>
          <div className="sizes-list">
            {currentDish.sizes?.map((size: any, index: any) => (
              <div key={index} className="size-item">
                <span className="size-name">{size.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={size.price || 0}
                  onChange={(e) => {
                    const newSizes = [...(currentDish.sizes || [])];
                    newSizes[index] = { ...size, price: parseFloat(e.target.value) || 0 };
                    setSelectedDish({...currentDish, sizes: newSizes});
                  }}
                  onBlur={() => {
                    // Automatycznie zapisz zmiany w cenach po opuszczeniu pola
                    if (currentDish && currentDish.sizes && currentDish.sizes.length > 0) {
                      setSaveStatus('saving');
                      updateMenuItemSizesMutation.mutate({
                        itemId: currentDish.id,
                        sizes: currentDish.sizes.map(size => ({
                          name: size.name,
                          price: size.price || 0
                        }))
                      });
                    }
                  }}
                  className="price-input"
                  placeholder="0.00"
                />
                <span className="currency">zł</span>
              </div>
            )) || <div className="no-sizes">Brak rozmiarów - dodaj rozmiary w kategorii</div>}
          </div>
          {currentDish.sizes && currentDish.sizes.length > 0 && (
            <button 
              className="save-sizes-btn"
              onClick={() => currentDish && updateMenuItemSizesMutation.mutate({
                itemId: currentDish.id,
                sizes: (currentDish.sizes || []).map(size => ({
                  name: size.name,
                  price: size.price || 0
                }))
              })}
              disabled={updateMenuItemSizesMutation.isPending}
            >
              {updateMenuItemSizesMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ CENY'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Dodatki</label>
          <div className="addon-assignment">
            <div className="assigned-addons">
              <h4>Przypisane grupy dodatków:</h4>
              {selectedDish?.addonGroups && selectedDish.addonGroups.length > 0 ? (
                <div className="assigned-list">
                  {selectedDish.addonGroups.map((addonGroup: any) => (
                      <div key={addonGroup.id} className="assigned-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveAddonGroup(addonGroup.id)}
                          disabled={removeAddonGroupMutation.isPending}
                          title="Usuń grupę dodatków z dania"
                        >
                          {removeAddonGroupMutation.isPending ? '...' : '✕'}
                        </button>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="no-addons">Brak przypisanych dodatków</p>
              )}
            </div>
            
            <div className="available-addons">
              <h4>Dostępne grupy dodatków:</h4>
              {addonGroups.length > 0 ? (
                <div className="available-list">
                  {addonGroups
                    .filter((group: any) => {
                      const isAssigned = selectedDish?.addonGroups?.some((ag: any) => ag.id === group.id);
                      return !isAssigned;
                    })
                    .map((addonGroup: any) => (
                      <div key={addonGroup.id} className="available-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="assign-btn"
                          onClick={() => handleAssignAddonGroup(addonGroup.id)}
                          disabled={assignAddonGroupMutation.isPending}
                          title="Przypisz grupę dodatków do dania"
                        >
                          {assignAddonGroupMutation.isPending ? '...' : '+'}
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="no-addons">Brak dostępnych grup dodatków. Utwórz grupę w zakładce "Dodatki".</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Składniki</label>
          <IngredientsManager 
            itemId={currentDish.id}
            ingredients={currentDish.ingredients || []}
            onIngredientsChange={(ingredients) => {
              setSelectedDish({...currentDish, ingredients});
            }}
          />
        </div>
      </div>
    </div>
    );
  };

  const renderAddonGroupEditPanel = () => (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Grupa dodatków: {selectedAddonGroup?.name}</h2>
        <div className="panel-actions">
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => selectedAddonGroup && updateAddonGroupMutation.mutate({ 
              id: selectedAddonGroup.id, 
              data: { name: selectedAddonGroup.name } 
            })}
            disabled={updateAddonGroupMutation.isPending}
          >
            {updateAddonGroupMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={handleDeleteAddonGroup}>
            🗑️ USUŃ
          </button>
        </div>
      </div>

      {selectedAddonGroup && (
        <div className="edit-form">
          <div className="form-group">
            <label>Nazwa grupy dodatków</label>
            <input
              type="text"
              value={selectedAddonGroup.name}
              onChange={(e) => {
                const newName = e.target.value;
                setSelectedAddonGroup({...selectedAddonGroup, name: newName});
              }}
              className="form-input"
            />
          </div>
          
          {/* Debug info */}
          <div style={{ background: '#f0f0f0', padding: '10px', margin: '10px 0', fontSize: '12px' }}>
            <strong>Debug Info:</strong><br/>
            Selected Group ID: {selectedAddonGroup.id}<br/>
            Addon Items Count: {selectedAddonGroup.addonItems?.length || 0}<br/>
            Addon Items: {JSON.stringify(selectedAddonGroup.addonItems?.map(item => ({ id: item.id, name: item.name, price: item.price })) || [])}
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={selectedAddonGroup.isOnline}
                onChange={(e) => {
                  setSelectedAddonGroup({...selectedAddonGroup, isOnline: e.target.checked});
                }}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Dostępność w E-restauracji
            </label>
          </div>

          <div className="form-group">
            <label>Dodatki w grupie</label>
            <div className="addon-items-list">
              {selectedAddonGroup.addonItems && selectedAddonGroup.addonItems.length > 0 ? selectedAddonGroup.addonItems.map((item: any) => (
                <div key={item.id} className="addon-item">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      console.log('Changing addon name:', e.target.value);
                      const updatedItems = selectedAddonGroup.addonItems?.map((i: any) => 
                        i.id === item.id ? {...i, name: e.target.value} : i
                      );
                      console.log('Updated items:', updatedItems);
                      setSelectedAddonGroup({...selectedAddonGroup, addonItems: updatedItems});
                    }}
                    className="addon-name-input"
                    placeholder="Nazwa dodatku"
                    style={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #007bff',
                      pointerEvents: 'auto',
                      cursor: 'text'
                    }}
                    readOnly={false}
                    disabled={false}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.price || 0}
                    onChange={(e) => {
                      console.log('Changing addon price:', e.target.value);
                      const price = parseFloat(e.target.value) || 0;
                      const updatedItems = selectedAddonGroup.addonItems?.map((i: any) => 
                        i.id === item.id ? {...i, price: price} : i
                      );
                      console.log('Updated items with price:', updatedItems);
                      setSelectedAddonGroup({...selectedAddonGroup, addonItems: updatedItems});
                    }}
                    className="addon-price-input"
                    placeholder="0.00"
                    style={{ 
                      backgroundColor: 'white', 
                      border: '2px solid #007bff',
                      pointerEvents: 'auto',
                      cursor: 'text'
                    }}
                    readOnly={false}
                    disabled={false}
                  />
                  <span className="currency">zł</span>
                  <button 
                    className="save-addon-btn"
                    onClick={() => {
                      const currentItem = selectedAddonGroup.addonItems?.find((i: any) => i.id === item.id);
                      if (currentItem) {
                        updateAddonMutation.mutate({
                          groupId: selectedAddonGroup.id,
                          addonId: item.id,
                          data: { name: currentItem.name, price: currentItem.price }
                        });
                      }
                    }}
                    disabled={updateAddonMutation.isPending}
                    title="Zapisz zmiany"
                  >
                    {updateAddonMutation.isPending ? '...' : '💾'}
                  </button>
                  <button 
                    className="delete-addon-btn"
                    onClick={() => handleDeleteAddon(item.id)}
                    title="Usuń dodatek"
                  >
                    🗑️
                  </button>
                </div>
              )) : <div className="no-addons">Brak dodatków w grupie</div>}
            </div>
            {!isAddingNewAddon ? (
              <button 
                className="add-addon-btn"
                onClick={handleAddAddon}
              >
                + Dodaj nowy dodatek
              </button>
            ) : (
              <div className="new-addon-form">
                <div className="form-group">
                  <label>Nazwa dodatku</label>
                  <input
                    type="text"
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    className="form-input"
                    placeholder="Wpisz nazwę dodatku"
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label>Cena dodatku</label>
                  <div className="price-input-group">
                    <input
                      type="number"
                      step="0.01"
                      value={newAddonPrice}
                      onChange={(e) => setNewAddonPrice(parseFloat(e.target.value) || 0)}
                      className="form-input"
                      placeholder="0.00"
                    />
                    <span className="currency">zł</span>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    className="save-btn"
                    onClick={handleSaveNewAddon}
                    disabled={!newAddonName.trim()}
                  >
                    💾 ZAPISZ
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={handleCancelNewAddon}
                  >
                    ❌ ANULUJ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderModifierEditPanel = () => (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Grupa modyfikatorów: {selectedModifierGroup?.name}</h2>
        <div className="panel-actions">
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => selectedModifierGroup && updateAddonGroupMutation.mutate({ 
              id: selectedModifierGroup.id, 
              data: { name: selectedModifierGroup.name } 
            })}
            disabled={updateAddonGroupMutation.isPending}
          >
            {updateAddonGroupMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={handleDeleteModifierGroup}>
            🗑️ USUŃ
          </button>
        </div>
      </div>

      {selectedModifierGroup && (
        <div className="edit-form">
          <div className="form-group">
            <label>Nazwa grupy modyfikatorów</label>
            <input
              type="text"
              value={selectedModifierGroup.name}
              onChange={(e) => {
                const newName = e.target.value;
                setSelectedModifierGroup({...selectedModifierGroup, name: newName});
              }}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={selectedModifierGroup.isOnline}
                onChange={(e) => {
                  setSelectedModifierGroup({...selectedModifierGroup, isOnline: e.target.checked});
                }}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Dostępność w E-restauracji
            </label>
          </div>

          <div className="form-group">
            <label>Modyfikator grupy</label>
            {selectedModifier ? (
              <div className="modifier-config">
                <div className="form-row">
                  <div className="form-field">
                    <label>Typ wyboru</label>
                    <select
                      value={selectedModifier.selectionType}
                      onChange={(e) => {
                        const updatedModifier = {...selectedModifier, selectionType: e.target.value as 'SINGLE' | 'MULTI'};
                        setSelectedModifier(updatedModifier);
                      }}
                      className="form-select"
                    >
                      <option value="SINGLE">Pojedynczy wybór</option>
                      <option value="MULTI">Wielokrotny wybór</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Minimalna liczba</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedModifier.minSelect}
                      onChange={(e) => {
                        const updatedModifier = {...selectedModifier, minSelect: parseInt(e.target.value) || 0};
                        setSelectedModifier(updatedModifier);
                      }}
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>Maksymalna liczba</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedModifier.maxSelect || ''}
                      onChange={(e) => {
                        const value = e.target.value === '' ? null : parseInt(e.target.value) || 0;
                        const updatedModifier = {...selectedModifier, maxSelect: value};
                        setSelectedModifier(updatedModifier);
                      }}
                      className="form-input"
                      placeholder="Bez limitu"
                    />
                  </div>
                  <div className="form-field">
                    <label>Darmowa ilość</label>
                    <input
                      type="number"
                      min="0"
                      value={selectedModifier.includedFreeQty}
                      onChange={(e) => {
                        const updatedModifier = {...selectedModifier, includedFreeQty: parseInt(e.target.value) || 0};
                        setSelectedModifier(updatedModifier);
                      }}
                      className="form-input"
                    />
                  </div>
                </div>
                <button 
                  className="save-modifier-btn"
                  onClick={() => selectedModifierGroup && updateModifierMutation.mutate({
                    groupId: selectedModifierGroup.id,
                    data: {
                      selectionType: selectedModifier.selectionType,
                      minSelect: selectedModifier.minSelect,
                      maxSelect: selectedModifier.maxSelect,
                      includedFreeQty: selectedModifier.includedFreeQty
                    }
                  })}
                  disabled={updateModifierMutation.isPending}
                >
                  {updateModifierMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ MODYFIKATOR'}
                </button>
                <button 
                  className="delete-modifier-btn"
                  onClick={() => selectedModifierGroup && deleteModifierMutation.mutate(selectedModifierGroup.id)}
                  disabled={deleteModifierMutation.isPending}
                >
                  {deleteModifierMutation.isPending ? 'USUWANIE...' : 'USUŃ MODYFIKATOR'}
                </button>
              </div>
            ) : (
              <div className="no-modifier">
                <p>Brak modyfikatora dla tej grupy</p>
                <button 
                  className="add-modifier-btn"
                  onClick={handleAddModifier}
                  disabled={createModifierMutation.isPending}
                >
                  {createModifierMutation.isPending ? 'DODAWANIE...' : '+ Dodaj modyfikator'}
                </button>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );

  const renderHalfHalfEditPanel = () => {
    if (!selectedHalfHalfConfig) return null;
    
    const selectedCategory = categories.find(cat => cat.id === selectedHalfHalfConfig.categoryId);
    const availableDishes = allMenuItems.filter(item => item.categoryId === selectedHalfHalfConfig.categoryId);
    const availableSizes = selectedCategory?.sizes || [];
    
    // Debugowanie
    console.log('🔧 Half-Half Edit Panel Debug:');
    console.log('selectedHalfHalfConfig:', selectedHalfHalfConfig);
    console.log('selectedCategory:', selectedCategory);
    console.log('allMenuItems length:', allMenuItems.length);
    console.log('availableDishes length:', availableDishes.length);
    console.log('availableSizes length:', availableSizes.length);
    
    const handleCategorySelect = (categoryId: string) => {
      setSelectedHalfHalfConfig({
        ...selectedHalfHalfConfig,
        categoryId,
        dishes: [], // Reset dishes when category changes
        sizes: [] // Reset sizes when category changes
      });
    };
    
    const handleDishToggle = (dishId: string) => {
      console.log('🍽️ Toggling dish:', dishId);
      console.log('Current dishes:', selectedHalfHalfConfig.dishes);
      
      const isSelected = selectedHalfHalfConfig.dishes.includes(dishId);
      console.log('Is selected:', isSelected);
      
      if (isSelected) {
        const newDishes = selectedHalfHalfConfig.dishes.filter(id => id !== dishId);
        console.log('Removing dish, new dishes:', newDishes);
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          dishes: newDishes
        });
      } else {
        const newDishes = [...selectedHalfHalfConfig.dishes, dishId];
        console.log('Adding dish, new dishes:', newDishes);
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          dishes: newDishes
        });
      }
    };
    
    const handleSizeToggle = (sizeId: string) => {
      const isSelected = selectedHalfHalfConfig.sizes.includes(sizeId);
      if (isSelected) {
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          sizes: selectedHalfHalfConfig.sizes.filter(id => id !== sizeId)
        });
      } else {
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          sizes: [...selectedHalfHalfConfig.sizes, sizeId]
        });
      }
    };
    
    const handleSelectAllDishes = () => {
      if (selectedHalfHalfConfig.dishes.length === availableDishes.length) {
        // Deselect all
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          dishes: []
        });
      } else {
        // Select all
        setSelectedHalfHalfConfig({
          ...selectedHalfHalfConfig,
          dishes: availableDishes.map(dish => dish.id)
        });
      }
    };
    
    return (
      <div className="edit-panel">
        <div className="panel-header">
          <h2>Konfiguracja: {selectedHalfHalfConfig.name}</h2>
          <div className="panel-actions">
            <button className="cancel-btn">ANULUJ</button>
            <button 
              className="save-btn" 
              onClick={handleSaveHalfHalfConfig}
            >
              ZAPISZ
            </button>
            <button className="delete-btn" onClick={handleDeleteHalfHalfConfig}>
              🗑️ USUŃ
            </button>
          </div>
        </div>

        <div className="edit-form">
          <div className="form-group">
            <label>Nazwa konfiguracji</label>
            <input
              type="text"
              value={selectedHalfHalfConfig.name}
              onChange={(e) => {
                setSelectedHalfHalfConfig({
                  ...selectedHalfHalfConfig,
                  name: e.target.value
                });
              }}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={selectedHalfHalfConfig.available}
                onChange={(e) => {
                  setSelectedHalfHalfConfig({
                    ...selectedHalfHalfConfig,
                    available: e.target.checked
                  });
                }}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Dostępna
            </label>
          </div>

          {/* Wybierz kategorię - przyciski */}
          <div className="form-group">
            <label>Wybierz kategorię</label>
            <div className="category-buttons">
              {categories.map((category) => (
                <button
                  key={category.id}
                  className={`category-btn ${selectedHalfHalfConfig.categoryId === category.id ? 'selected' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Wybierz rozmiary - przyciski */}
          {selectedCategory && (
            <div className="form-group">
              <label>Wybierz rozmiary</label>
              <div className="size-buttons">
                {availableSizes.map((size) => (
                  <button
                    key={size.id}
                    className={`size-btn ${selectedHalfHalfConfig.sizes.includes(size.id) ? 'selected' : ''}`}
                    onClick={() => handleSizeToggle(size.id)}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wybierz dania - przyciski */}
          {selectedCategory && (
            <div className="form-group">
              <div className="dishes-header">
                <label>Wybierz dania</label>
                <button
                  className="select-all-btn"
                  onClick={handleSelectAllDishes}
                  disabled={availableDishes.length === 0}
                >
                  {selectedHalfHalfConfig.dishes.length === availableDishes.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
                </button>
              </div>
              {availableDishes.length === 0 ? (
                <div className="no-dishes-message">
                  <p>Brak dostępnych dań dla tej kategorii. Sprawdź czy dane zostały załadowane.</p>
                  <p>Długość allMenuItems: {allMenuItems.length}</p>
                </div>
              ) : (
                <div className="dish-buttons">
                  {availableDishes.map((dish) => (
                    <button
                      key={dish.id}
                      className={`dish-btn ${selectedHalfHalfConfig.dishes.includes(dish.id) ? 'selected' : ''}`}
                      onClick={() => handleDishToggle(dish.id)}
                    >
                      {dish.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEditPanel = () => {
    switch (activeTab) {
      case 'categories':
        return renderCategoryEditPanel();
      case 'dishes':
        return selectedDish ? renderDishEditPanel() : null;
      case 'halfhalf':
        return selectedHalfHalfConfig ? renderHalfHalfEditPanel() : null;
      case 'modifiers':
        return selectedModifierGroup ? renderModifierEditPanel() : null;
      case 'addons':
        return selectedAddonGroup ? renderAddonGroupEditPanel() : null;
      default:
        return null;
    }
  };


  const renderCategoryEditPanel = () => {
    const currentCategory = selectedCategory;
    if (!currentCategory) return null;
    
    return (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Edycja kategorii</h2>
        <div className="panel-actions">
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => currentCategory && updateCategoryMutation.mutate({ 
              id: currentCategory.id, 
              data: { name: currentCategory.name } 
            })}
            disabled={updateCategoryMutation.isPending}
          >
            {updateCategoryMutation.isPending ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={handleDeleteCategory}>
            🗑️ USUŃ
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-group">
          <label>Nazwa kategorii</label>
          <input
            type="text"
            value={currentCategory.name}
            onChange={(e) => {
              const newName = e.target.value;
              setSelectedCategory({...currentCategory, name: newName});
            }}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isDefaultCategory}
              onChange={handleSetDefaultCategory}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
            Kategoria domyślna
          </label>
        </div>

        <div className="form-group">
          <label>Stawka VAT</label>
          <select
            value={vatRate}
            onChange={(e) => setVatRate(e.target.value)}
            className="form-select"
          >
            <option value="8% B">8% B</option>
            <option value="23% A">23% A</option>
            <option value="5% C">5% C</option>
            <option value="0% D">0% D</option>
          </select>
        </div>

        <div className="form-group">
          <label>Rozmiary kategorii</label>
          <div className="sizes-list">
            {currentCategory.sizes?.map((size: any, index: any) => {
              const sizeName = typeof size === 'string' ? size : size.name;
              const isEditing = editingSize === sizeName;
              
              return (
                <div key={index} className="size-item">
                  {isEditing ? (
                    <div className="size-edit-form">
                      <input
                        type="text"
                        value={editingSizeName}
                        onChange={(e) => setEditingSizeName(e.target.value)}
                        className="size-edit-input"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditSize();
                          } else if (e.key === 'Escape') {
                            handleCancelEditSize();
                          }
                        }}
                      />
                      <button
                        className="save-size-btn"
                        onClick={handleSaveEditSize}
                        disabled={!editingSizeName.trim() || editingSizeName === editingSize}
                      >
                        ✓
                      </button>
                      <button
                        className="cancel-size-btn"
                        onClick={handleCancelEditSize}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="size-name">{sizeName}</span>
                      <div className="size-actions">
                        <button
                          className="edit-size-btn"
                          onClick={() => handleStartEditSize(sizeName)}
                          title="Edytuj nazwę rozmiaru"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-size-btn"
                          onClick={() => handleRemoveCategorySize(sizeName)}
                          title="Usuń rozmiar"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            }) || <div className="no-sizes">Brak rozmiarów</div>}
          </div>
          <div className="add-size-form">
            <input
              type="text"
              placeholder="Nazwa rozmiaru (np. 20cm, 30cm, Mała, Duża)"
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              className="size-input"
            />
            <button 
              className="add-size-btn" 
              onClick={handleAddCategorySize}
              disabled={!newSizeName.trim()}
            >
              + Dodaj rozmiar
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={eRestaurantAvailable}
              onChange={(e) => setERestaurantAvailable(e.target.checked)}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
            Dostępność w E-restauracji
          </label>
        </div>

        <div className="form-group">
          <label>Obraz kategorii widoczny w E-Restauracji:</label>
          <div className="image-upload">
            <input
              type="file"
              accept="image/*"
              className="file-input"
            />
            <button className="choose-btn">Wybierz</button>
            <button className="delete-image-btn">🗑️</button>
          </div>
        </div>

        <div className="form-group">
          <label>Dodatki</label>
          <div className="addon-assignment">
            <div className="assigned-addons">
              <h4>Przypisane grupy dodatków:</h4>
              {selectedCategory?.addonGroups && selectedCategory.addonGroups.length > 0 ? (
                <div className="assigned-list">
                  {selectedCategory.addonGroups.map((addonGroup: any) => (
                      <div key={addonGroup.id} className="assigned-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveAddonGroupFromCategory(addonGroup.id)}
                          disabled={removeAddonGroupFromCategoryMutation.isPending}
                          title="Usuń grupę dodatków z kategorii"
                        >
                          {removeAddonGroupFromCategoryMutation.isPending ? '...' : '✕'}
                        </button>
                      </div>
                  ))}
                </div>
              ) : (
                <p className="no-addons">Brak przypisanych dodatków</p>
              )}
            </div>
            
            <div className="available-addons">
              <h4>Dostępne grupy dodatków:</h4>
              {addonGroups.length > 0 ? (
                <div className="available-list">
                  {addonGroups
                    .filter((group: any) => {
                      const isAssigned = selectedCategory?.addonGroups?.some((ag: any) => ag.id === group.id);
                      return !isAssigned;
                    })
                    .map((addonGroup: any) => (
                      <div key={addonGroup.id} className="available-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="assign-btn"
                          onClick={() => handleAssignAddonGroupToCategory(addonGroup.id)}
                          disabled={assignAddonGroupToCategoryMutation.isPending}
                          title="Przypisz grupę dodatków do kategorii"
                        >
                          {assignAddonGroupToCategoryMutation.isPending ? '...' : '+'}
                        </button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="no-addons">Brak dostępnych grup dodatków. Utwórz grupę w zakładce "Dodatki".</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="menu-management-page">
      <div className="top-nav">
        <div className="nav-left">
          <span className="back-arrow">←</span>
          <span>Zarządzanie menu</span>
        </div>
        <div className="nav-center">
          <div className="restaurant-selector">
            <span>🍽</span>
            <span>Tutto Pizza</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          <div className="menu-selector">
            <span>👔️</span>
            <span>Menu domyślne</span>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
      </div>

      <div className="breadcrumbs">
        Zarządzanie / Zarządzanie menu : Tutto Pizza / Menu domyślne
      </div>

      <div className="menu-management-layout">
        <div className="sidebar">
          <div className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => handleTabChange('categories')}
            >
              Kategorie
            </button>
            <button
              className={`nav-tab ${activeTab === 'addons' ? 'active' : ''}`}
              onClick={() => handleTabChange('addons')}
            >
              Dodatki
            </button>
            <button
              className={`nav-tab ${activeTab === 'halfhalf' ? 'active' : ''}`}
              onClick={() => handleTabChange('halfhalf')}
            >
              Pół na pół
            </button>
            <button
              className={`nav-tab ${activeTab === 'modifiers' ? 'active' : ''}`}
              onClick={() => handleTabChange('modifiers')}
            >
              Modyfikatory
            </button>
            <button
              className={`nav-tab ${activeTab === 'dishes' ? 'active' : ''}`}
              onClick={() => handleTabChange('dishes')}
            >
              Dania
            </button>
          </div>

          {activeTab === 'categories' && renderCategoriesTab()}
          {activeTab === 'dishes' && renderDishesTab()}
          {activeTab === 'halfhalf' && renderHalfHalfTab()}
          {activeTab === 'modifiers' && renderModifiersTab()}
          {activeTab === 'addons' && renderAddonsTab()}
        </div>

        {renderEditPanel()}
      </div>
    </div>
  );
};

export default MenuManagementPage;
