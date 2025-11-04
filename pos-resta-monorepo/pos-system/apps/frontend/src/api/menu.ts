import { apiClient } from './client';

// Types
export interface MenuCategory {
  id: string;
  name: string;
  vatRate: number;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
  sizes?: Size[];
  addonGroups?: AddonGroup[];
  itemCount?: number;
}

export interface Size {
  id: string;
  name: string;
  price?: number;
  isDefaultInCategory: boolean;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Dish {
  id: string;
  name: string;
  categoryId: string;
  imageUrl?: string;
  price?: number;
  sizes?: Size[];
  addonGroupIds?: string[];
  addonGroups?: AddonGroup[];
  ingredients?: Ingredient[];
  createdAt: string;
  updatedAt: string;
}

export interface AddonGroup {
  id: string;
  name: string;
  isOnline: boolean;
  addonItems?: AddonItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddonItem {
  id: string;
  name: string;
  price: number;
  available?: boolean;
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Ingredient {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Modifier {
  id: string;
  groupId: string;
  selectionType: 'SINGLE' | 'MULTI';
  minSelect: number;
  maxSelect?: number;
  includedFreeQty: number;
  createdAt: string;
  updatedAt: string;
  group?: AddonGroup;
}

// API calls
export const menuApi = {
  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/menu/categories');
    return response as { success: boolean; data: MenuCategory[] };
  },

  createCategory: async (data: { name: string; vatRate?: number }) => {
    const response = await apiClient.post('/menu/categories', data);
    return response as { success: boolean; data: MenuCategory };
  },

  updateCategory: async (id: string, data: Partial<MenuCategory>) => {
    const response = await apiClient.put(`/menu/categories/${id}`, data);
    return response as { success: boolean; data: MenuCategory };
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete(`/menu/categories/${id}`);
    return response as { success: boolean; message: string };
  },

  // Dishes
  getDishes: async (categoryId?: string) => {
    if (!categoryId) {
      return { success: true, data: [] };
    }
    const response = await apiClient.get(`/menu/items/${categoryId}`);
    return response as { success: boolean; data: Dish[] };
  },

  // Get all dishes without category filter
  getAllDishes: async () => {
    const categoriesResponse = await apiClient.get('/menu/categories') as { success: boolean; data: MenuCategory[] };
    if (!categoriesResponse.success) return { success: false, data: [] };
    
    const allDishes: Dish[] = [];
    for (const category of categoriesResponse.data) {
      const dishesResponse = await apiClient.get(`/menu/items/${category.id}`) as { success: boolean; data: Dish[] };
      if (dishesResponse.success) {
        allDishes.push(...dishesResponse.data);
      }
    }
    
    return { success: true, data: allDishes };
  },

  createDish: async (data: { name: string; categoryId: string; price?: number }) => {
    const response = await apiClient.post('/menu/items', data);
    return response as { success: boolean; data: Dish };
  },

  updateDish: async (id: string, data: Partial<Dish>) => {
    const response = await apiClient.put(`/menu/items/${id}`, data);
    return response as { success: boolean; data: Dish };
  },

  deleteDish: async (id: string) => {
    const response = await apiClient.delete(`/menu/items/${id}`);
    return response as { success: boolean; message: string };
  },

  // Sizes
  getSizes: async (categoryId: string) => {
    const response = await apiClient.get(`/menu/categories/${categoryId}/sizes`);
    return response as { success: boolean; data: Size[] };
  },

  createSize: async (data: { name: string; categoryId: string }) => {
    const response = await apiClient.post(`/menu/categories/${data.categoryId}/sizes`, { name: data.name });
    return response as { success: boolean; data: Size };
  },

  deleteSize: async (id: string) => {
    const response = await apiClient.delete(`/menu/sizes/${id}`);
    return response as { success: boolean; message: string };
  },

  // Addon Groups
  getAddonGroups: async () => {
    const response = await apiClient.get('/menu/addon-groups');
    return response as { success: boolean; data: AddonGroup[] };
  },

  createAddonGroup: async (data: { name: string }) => {
    const response = await apiClient.post('/menu/addon-groups', data);
    return response as { success: boolean; data: AddonGroup };
  },

  updateAddonGroup: async (id: string, data: Partial<AddonGroup>) => {
    const response = await apiClient.put(`/menu/addon-groups/${id}`, data);
    return response as { success: boolean; data: AddonGroup };
  },

  deleteAddonGroup: async (id: string) => {
    const response = await apiClient.delete(`/menu/addon-groups/${id}`);
    return response as { success: boolean; message: string };
  },

  // Ingredients
  getIngredients: async () => {
    const response = await apiClient.get('/menu/ingredients');
    return response as { success: boolean; data: Ingredient };
  },

  createIngredient: async (data: { name: string }) => {
    const response = await apiClient.post('/menu/ingredients', data);
    return response as { success: boolean; data: Ingredient };
  },

  deleteIngredient: async (id: string) => {
    const response = await apiClient.delete(`/menu/ingredients/${id}`);
    return response as { success: boolean; message: string };
  },

  // Ingredient management for dishes
  addIngredient: async (dishId: string, name: string) => {
    const response = await apiClient.post(`/menu/items/${dishId}/ingredients`, { name });
    return response as { success: boolean; data: Ingredient };
  },

  updateIngredient: async (dishId: string, ingredientId: string, name: string) => {
    const response = await apiClient.put(`/menu/items/${dishId}/ingredients/${ingredientId}`, { name });
    return response as { success: boolean; data: Ingredient };
  },

  removeIngredient: async (dishId: string, ingredientId: string) => {
    const response = await apiClient.delete(`/menu/items/${dishId}/ingredients/${ingredientId}`);
    return response as { success: boolean; message: string };
  },

  // Category assignments
  assignAddonGroupToCategory: async (categoryId: string, addonGroupId: string) => {
    const response = await apiClient.post(`/menu/categories/${categoryId}/addon-groups`, { addonGroupId });
    return response as { success: boolean; data: MenuCategory };
  },

  removeAddonGroupFromCategory: async (categoryId: string, addonGroupId: string) => {
    const response = await apiClient.delete(`/menu/categories/${categoryId}/addon-groups`, { addonGroupId });
    return response as { success: boolean; data: MenuCategory };
  },

  // Dish assignments
  assignAddonGroupToDish: async (dishId: string, addonGroupId: string) => {
    const response = await apiClient.post(`/menu/dishes/${dishId}/addon-groups`, { addonGroupId });
    return response as { success: boolean; data: Dish };
  },

  removeAddonGroupFromDish: async (dishId: string, addonGroupId: string) => {
    const response = await apiClient.delete(`/menu/dishes/${dishId}/addon-groups`, { addonGroupId });
    return response as { success: boolean; data: Dish };
  },

  // Category sizes
  addCategorySize: async (categoryId: string, data: { name: string }) => {
    const response = await apiClient.post(`/menu/categories/${categoryId}/sizes`, data);
    return response as { success: boolean; data: Size };
  },

  updateCategorySize: async (categoryId: string, sizeName: string, newName: string) => {
    const response = await apiClient.put(`/menu/categories/${categoryId}/sizes/${sizeName}`, { newName });
    return response as { success: boolean; data: Size; message: string };
  },

  removeCategorySize: async (categoryId: string, sizeName: string) => {
    const response = await apiClient.delete(`/menu/categories/${categoryId}/sizes/${sizeName}`);
    return response as { success: boolean; message: string };
  },

  // Menu item sizes
  updateMenuItemSizes: async (itemId: string, sizes: any[]) => {
    const response = await apiClient.put(`/menu/items/${itemId}/sizes`, { sizes });
    return response as { success: boolean; data: Dish };
  },

  // Addon Group Items
  createAddonItem: async (groupId: string, data: Partial<AddonItem>) => {
    const response = await apiClient.post(`/menu/addon-groups/${groupId}/items`, data);
    return response as { success: boolean; data: AddonItem };
  },

  updateAddonItem: async (groupId: string, addonId: string, data: Partial<AddonItem>) => {
    const response = await apiClient.put(`/menu/addon-groups/${groupId}/items/${addonId}`, data);
    return response as { success: boolean; data: AddonItem };
  },

  deleteAddonItem: async (groupId: string, addonId: string) => {
    const response = await apiClient.delete(`/menu/addon-groups/${groupId}/items/${addonId}`);
    return response as { success: boolean; message: string };
  },

  // Modifiers
  getModifier: async (groupId: string) => {
    const response = await apiClient.get(`/menu/addon-groups/${groupId}/modifier`);
    return response as { success: boolean; data: Modifier | null };
  },

  createModifier: async (groupId: string, data: {
    selectionType?: 'SINGLE' | 'MULTI';
    minSelect?: number;
    maxSelect?: number;
    includedFreeQty?: number;
  }) => {
    const response = await apiClient.post(`/menu/addon-groups/${groupId}/modifier`, data);
    return response as { success: boolean; data: Modifier };
  },

  updateModifier: async (groupId: string, data: {
    selectionType?: 'SINGLE' | 'MULTI';
    minSelect?: number;
    maxSelect?: number;
    includedFreeQty?: number;
  }) => {
    const response = await apiClient.put(`/menu/addon-groups/${groupId}/modifier`, data);
    return response as { success: boolean; data: Modifier };
  },

  deleteModifier: async (groupId: string) => {
    const response = await apiClient.delete(`/menu/addon-groups/${groupId}/modifier`);
    return response as { success: boolean; message: string };
  },

  // Public menu
  getPublicMenu: async () => {
    const response = await apiClient.get('/menu/public');
    return response as { success: boolean; data: MenuCategory[] };
  }
};
