import { Router } from 'express';
import MenuController from '../controllers/menu.controller';
import { prisma } from '../lib/database';

export function createMenuRouter() {
  const router = Router();
  
  // Always use Prisma-backed controller
  const menuController = new MenuController(prisma);

// Kategorie
router.get('/categories', menuController.getCategories);
router.post('/categories', menuController.createCategory);
router.put('/categories/:id', menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Pozycje menu
router.get('/items/:categoryId', menuController.getMenuItems);
router.post('/items', menuController.createMenuItem);
router.put('/items/:id', menuController.updateMenuItem);
router.put('/items/:id/sizes', menuController.updateMenuItemSizes);
router.post('/items/:id/ingredients', menuController.addIngredient);
router.put('/items/:id/ingredients/:ingredientId', menuController.updateIngredient);
router.delete('/items/:id/ingredients/:ingredientId', menuController.removeIngredient);
router.delete('/items/:id', menuController.deleteMenuItem);

// Dodatki do pozycji menu
router.post('/items/:id/addon-groups', menuController.assignAddonGroup);
router.delete('/items/:id/addon-groups', menuController.removeAddonGroup);

// Alias dla frontend (używa "dishes" zamiast "items")
router.post('/dishes/:id/addon-groups', menuController.assignAddonGroup);
router.delete('/dishes/:id/addon-groups', menuController.removeAddonGroup);

// Dodatki do kategorii
router.post('/categories/:id/addon-groups', menuController.assignAddonGroupToCategory);
router.delete('/categories/:id/addon-groups', menuController.removeAddonGroupFromCategory);

// Rozmiary kategorii
router.post('/categories/:categoryId/sizes', menuController.addCategorySize);
router.put('/categories/:categoryId/sizes/:sizeName', menuController.updateCategorySize);
router.delete('/categories/:categoryId/sizes/:sizeName', menuController.removeCategorySize);

// Dodatki
router.get('/addon-groups', menuController.getAddonGroups);
router.post('/addon-groups', menuController.createAddonGroup);
router.put('/addon-groups/:id', menuController.updateAddonGroup);
router.delete('/addon-groups/:id', menuController.deleteAddonGroup);
router.get('/addon-groups/:groupId/items', menuController.getAddonItems);
router.post('/addon-groups/:groupId/items', menuController.createAddonItem);
router.put('/addon-groups/:groupId/items/:addonId', menuController.updateAddonItem);
router.delete('/addon-groups/:groupId/items/:addonId', menuController.deleteAddonItem);

// Modifiers
router.get('/addon-groups/:groupId/modifier', menuController.getModifiers);
router.post('/addon-groups/:groupId/modifier', menuController.createModifier);
router.put('/addon-groups/:groupId/modifier', menuController.updateModifier);
router.delete('/addon-groups/:groupId/modifier', menuController.deleteModifier);

// Rozmiary
router.get('/categories/:categoryId/sizes', menuController.getCategorySizes);

// Grupy dodatków dla kategorii i pozycji menu
router.get('/categories/:categoryId/addon-groups', menuController.getCategoryAddonGroups);
router.get('/items/:itemId/addon-groups', menuController.getMenuItemAddonGroups);

// Public menu endpoint for QR code
router.get('/public', menuController.getPublicMenu);

// Menu endpoint for restaurant shop (returns { categories, items } format)
router.get('/', menuController.getMenuForShop);

  return router;
}
