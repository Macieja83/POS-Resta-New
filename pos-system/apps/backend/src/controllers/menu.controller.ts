import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

class MenuController {
  constructor(private prisma: PrismaClient) {}

  getCategories = async (_req: Request, res: Response) => {
    try {
      const categories = await this.prisma.category.findMany({
        include: {
          sizes: true,
          dishes: true,
          groupAssignments: {
            include: {
              group: true
            }
          }
        }
      });

      const categoriesWithCount = categories.map(category => ({
        ...category,
        itemCount: category.dishes.length,
        addonGroups: category.groupAssignments.map(ga => ga.group)
      }));

      res.json({
        success: true,
        data: categoriesWithCount
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania kategorii"
      });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const { name, vatRate = 0.23, isDefault = false, isOnline = true, imageUrl } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa kategorii jest wymagana"
        });
      }

      const newCategory = await this.prisma.category.create({
        data: {
          name,
          vatRate,
          isDefault,
          isOnline,
          imageUrl
        }
      });

      res.status(201).json({
        success: true,
        data: newCategory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas tworzenia kategorii"
      });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      const updatedCategory = await this.prisma.category.update({
        where: { id },
        data: { name }
      });
      
      res.json({
        success: true,
        data: updatedCategory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji kategorii"
      });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await this.prisma.category.delete({
        where: { id }
      });
      
      res.json({
        success: true,
        message: "Kategoria została usunięta"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania kategorii"
      });
    }
  };

  getMenuItems = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: "ID kategorii jest wymagane"
        });
      }

      // Pobierz kategorię z grupami dodatków
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          groupAssignments: {
            include: {
              group: {
                include: {
                  addonItems: true
                }
              }
            }
          }
        }
      });

      if (!category) {
        return res.status(404).json({
          success: false,
          error: "Kategoria nie została znaleziona"
        });
      }

      const dishes = await this.prisma.dish.findMany({
        where: { categoryId },
        include: {
          dishSizes: {
            include: {
              size: true
            }
          },
          groupAssignments: {
            include: {
              group: {
                include: {
                  addonItems: true
                }
              }
            }
          },
          ingredients: true
        }
      });

      // Pobierz grupy dodatków na poziomie kategorii
      const categoryAddonGroups = category.groupAssignments.map(assignment => ({
        ...assignment.group,
        items: assignment.group.addonItems
      }));

      const items = dishes.map(dish => {
        // Get sizes for this item
        const itemSizes = dish.dishSizes.map(dishSize => ({
          id: dishSize.size.id,
          name: dishSize.size.name,
          price: dishSize.price
        }));

        // Get addon groups for this item (pozycja + kategoria)
        const itemAddonGroups = dish.groupAssignments.map(assignment => ({
          ...assignment.group,
          items: assignment.group.addonItems
        }));

        // Połącz grupy dodatków z pozycji i kategorii
        const allAddonGroups = [...itemAddonGroups, ...categoryAddonGroups];

        // Get base price from the first size (smallest) or default to 0
        const basePrice = itemSizes.length > 0 ? Math.min(...itemSizes.map(size => size.price)) : 0;
        
        return {
          ...dish,
          price: basePrice, // Add base price to item
          sizes: itemSizes,
          addonGroups: allAddonGroups
        };
      });
      
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania pozycji menu"
      });
    }
  };

  createMenuItem = async (req: Request, res: Response) => {
    try {
      const { name, categoryId } = req.body;
      
      if (!name || !categoryId) {
        return res.status(400).json({
          success: false,
          error: "Nazwa i ID kategorii są wymagane"
        });
      }

      const newMenuItem = await this.prisma.dish.create({
        data: {
          name,
          categoryId
        }
      });
      
      res.status(201).json({
        success: true,
        data: newMenuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas tworzenia pozycji menu"
      });
    }
  };

  updateMenuItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, categoryId } = req.body;
      
      const updatedMenuItem = await this.prisma.dish.update({
        where: { id },
        data: { name, categoryId }
      });
      
      res.json({
        success: true,
        data: updatedMenuItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji pozycji menu"
      });
    }
  };

  updateMenuItemSizes = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { sizes } = req.body;
      
      // Get the dish to find its category
      const dish = await this.prisma.dish.findUnique({
        where: { id },
        include: { category: true }
      });

      if (!dish) {
        return res.status(404).json({
          success: false,
          error: "Pozycja menu nie została znaleziona"
        });
      }

      // Delete existing dish sizes
      await this.prisma.dishSize.deleteMany({
        where: { dishId: id }
      });

      // Create new dish sizes
      for (const size of sizes) {
        // Find the size by name in the category
        const categorySize = await this.prisma.size.findFirst({
          where: {
            categoryId: dish.categoryId,
            name: size.name
          }
        });

        if (categorySize) {
          await this.prisma.dishSize.create({
            data: {
              dishId: id,
              sizeId: categorySize.id,
              price: size.price
            }
          });
        }
      }
      
      res.json({
        success: true,
        message: "Rozmiary pozycji menu zostały zaktualizowane"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji rozmiarów pozycji menu"
      });
    }
  };

  deleteMenuItem = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await this.prisma.dish.delete({
        where: { id }
      });
      
      res.json({
        success: true,
        message: "Pozycja menu została usunięta"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania pozycji menu"
      });
    }
  };

  assignAddonGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { addonGroupId } = req.body;
      
      if (!addonGroupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      // Sprawdź czy grupa dodatków istnieje
      const addonGroup = await this.prisma.addonGroup.findUnique({
        where: { id: addonGroupId }
      });

      if (!addonGroup) {
        return res.status(404).json({
          success: false,
          error: "Grupa dodatków nie została znaleziona"
        });
      }

      // Sprawdź czy danie istnieje
      const dish = await this.prisma.dish.findUnique({
        where: { id }
      });

      if (!dish) {
        return res.status(404).json({
          success: false,
          error: "Pozycja menu nie została znaleziona"
        });
      }

      // Sprawdź czy przypisanie już istnieje
      const existingAssignment = await this.prisma.groupAssignment.findFirst({
        where: {
          groupId: addonGroupId,
          dishId: id
        }
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          error: "Grupa dodatków jest już przypisana do tej pozycji menu"
        });
      }

      const groupAssignment = await this.prisma.groupAssignment.create({
        data: {
          groupId: addonGroupId,
          dishId: id
        },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });
      
      res.json({
        success: true,
        data: {
          groupId: groupAssignment.groupId,
          group: groupAssignment.group
        }
      });
    } catch (error) {
      console.error('Error in assignAddonGroup:', error);
      res.status(500).json({
        success: false,
        error: "Błąd podczas przypisywania grupy dodatków do pozycji menu"
      });
    }
  };

  removeAddonGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { addonGroupId } = req.body;
      
      if (!addonGroupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      await this.prisma.groupAssignment.deleteMany({
        where: {
          dishId: id,
          groupId: addonGroupId
        }
      });
      
      res.json({
        success: true,
        data: {
          groupId: addonGroupId
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania grupy dodatków z pozycji menu"
      });
    }
  };

  assignAddonGroupToCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { addonGroupId } = req.body;
      
      if (!addonGroupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      const groupAssignment = await this.prisma.groupAssignment.create({
        data: {
          groupId: addonGroupId,
          categoryId: id
        }
      });
      
      res.json({
        success: true,
        data: groupAssignment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas przypisywania grupy dodatków do kategorii"
      });
    }
  };

  removeAddonGroupFromCategory = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { addonGroupId } = req.body;
      
      if (!addonGroupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      await this.prisma.groupAssignment.deleteMany({
        where: {
          categoryId: id,
          groupId: addonGroupId
        }
      });
      
      res.json({
        success: true,
        message: "Grupa dodatków została usunięta z kategorii"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania grupy dodatków z kategorii"
      });
    }
  };

  addCategorySize = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa rozmiaru jest wymagana"
        });
      }

      const newSize = await this.prisma.size.create({
        data: {
          categoryId,
          name,
          isDefaultInCategory: false,
          isOnline: true
        }
      });
      
      res.status(201).json({
        success: true,
        data: newSize
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas dodawania rozmiaru"
      });
    }
  };

  removeCategorySize = async (req: Request, res: Response) => {
    try {
      const { categoryId, sizeName } = req.params;
      
      const size = await this.prisma.size.findFirst({
        where: {
          categoryId,
          name: sizeName
        }
      });

      if (!size) {
        return res.status(404).json({
          success: false,
          error: "Rozmiar nie został znaleziony"
        });
      }

      await this.prisma.size.delete({
        where: { id: size.id }
      });
      
      res.json({
        success: true,
        message: "Rozmiar został usunięty"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania rozmiaru"
      });
    }
  };

  updateCategorySize = async (req: Request, res: Response) => {
    try {
      const { categoryId, sizeName } = req.params;
      const { newName } = req.body;
      
      if (!newName) {
        return res.status(400).json({
          success: false,
          error: "Nowa nazwa rozmiaru jest wymagana"
        });
      }

      const size = await this.prisma.size.findFirst({
        where: {
          categoryId,
          name: sizeName
        }
      });

      if (!size) {
        return res.status(404).json({
          success: false,
          error: "Rozmiar nie został znaleziony"
        });
      }

      // Sprawdź czy nowa nazwa nie koliduje z istniejącym rozmiarem
      const existingSize = await this.prisma.size.findFirst({
        where: {
          categoryId,
          name: newName,
          id: { not: size.id }
        }
      });

      if (existingSize) {
        return res.status(400).json({
          success: false,
          error: "Rozmiar o tej nazwie już istnieje w tej kategorii"
        });
      }

      const updatedSize = await this.prisma.size.update({
        where: { id: size.id },
        data: { name: newName }
      });
      
      res.json({
        success: true,
        data: updatedSize,
        message: "Rozmiar został zaktualizowany"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji rozmiaru"
      });
    }
  };

  addIngredient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa składnika jest wymagana"
        });
      }

      const newIngredient = await this.prisma.ingredient.create({
        data: {
          dishId: id,
          name: name.trim()
        }
      });
      
      res.status(201).json({
        success: true,
        data: newIngredient
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas dodawania składnika"
      });
    }
  };

  removeIngredient = async (req: Request, res: Response) => {
    try {
      const { ingredientId } = req.params;
      
      await this.prisma.ingredient.delete({
        where: { id: ingredientId }
      });
      
      res.json({
        success: true,
        message: "Składnik został usunięty"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania składnika"
      });
    }
  };

  updateIngredient = async (req: Request, res: Response) => {
    try {
      const { ingredientId } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa składnika jest wymagana"
        });
      }

      const updatedIngredient = await this.prisma.ingredient.update({
        where: { id: ingredientId },
        data: { name: name.trim() }
      });
      
      res.json({
        success: true,
        data: updatedIngredient
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji składnika"
      });
    }
  };

  // Get all addon groups
  getAddonGroups = async (_req: Request, res: Response) => {
    try {
      const addonGroups = await this.prisma.addonGroup.findMany({
        include: {
          addonItems: true
        }
      });
      
      res.json({
        success: true,
        data: addonGroups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania grup dodatków"
      });
    }
  };

  // Get addon items for a specific group
  getAddonItems = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      const items = await this.prisma.addonItem.findMany({
        where: { groupId }
      });
      
      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania dodatków"
      });
    }
  };

  // Get sizes for a specific category
  getCategorySizes = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: "ID kategorii jest wymagane"
        });
      }

      const categorySizes = await this.prisma.size.findMany({
        where: { categoryId }
      });
      
      res.json({
        success: true,
        data: categorySizes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania rozmiarów"
      });
    }
  };

  // Get addon groups assigned to a category
  getCategoryAddonGroups = async (req: Request, res: Response) => {
    try {
      const { categoryId } = req.params;
      
      if (!categoryId) {
        return res.status(400).json({
          success: false,
          error: "ID kategorii jest wymagane"
        });
      }

      const assignments = await this.prisma.groupAssignment.findMany({
        where: { categoryId },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });
      
      const addonGroups = assignments.map(assignment => assignment.group);
      
      res.json({
        success: true,
        data: addonGroups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania grup dodatków dla kategorii"
      });
    }
  };

  // Get addon groups assigned to a specific menu item
  getMenuItemAddonGroups = async (req: Request, res: Response) => {
    try {
      const { itemId } = req.params;
      
      if (!itemId) {
        return res.status(400).json({
          success: false,
          error: "ID pozycji menu jest wymagane"
        });
      }

      const assignments = await this.prisma.groupAssignment.findMany({
        where: { dishId: itemId },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });
      
      const addonGroups = assignments.map(assignment => assignment.group);
      
      res.json({
        success: true,
        data: addonGroups
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania grup dodatków dla pozycji menu"
      });
    }
  };

  // Addon Groups CRUD
  createAddonGroup = async (req: Request, res: Response) => {
    try {
      const { name, isOnline = true } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa grupy dodatków jest wymagana"
        });
      }

      const newAddonGroup = await this.prisma.addonGroup.create({
        data: {
          name,
          isOnline
        },
        include: {
          addonItems: true
        }
      });

      res.status(201).json({
        success: true,
        data: newAddonGroup
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas tworzenia grupy dodatków"
      });
    }
  };

  updateAddonGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, isOnline } = req.body;
      
      const updatedAddonGroup = await this.prisma.addonGroup.update({
        where: { id },
        data: { name, isOnline },
        include: {
          addonItems: true
        }
      });
      
      res.json({
        success: true,
        data: updatedAddonGroup
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji grupy dodatków"
      });
    }
  };

  deleteAddonGroup = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      await this.prisma.addonGroup.delete({
        where: { id }
      });
      
      res.json({
        success: true,
        message: "Grupa dodatków została usunięta"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania grupy dodatków"
      });
    }
  };

  // Addon Items CRUD
  createAddonItem = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { name, price = 0, isOnline = true, sortOrder = 0 } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Nazwa dodatku jest wymagana"
        });
      }

      const newAddonItem = await this.prisma.addonItem.create({
        data: {
          name,
          price,
          isOnline,
          sortOrder,
          groupId
        }
      });

      res.status(201).json({
        success: true,
        data: newAddonItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas tworzenia dodatku"
      });
    }
  };

  updateAddonItem = async (req: Request, res: Response) => {
    try {
      const { groupId, addonId } = req.params;
      const { name, price, isOnline, sortOrder } = req.body;
      
      const updatedAddonItem = await this.prisma.addonItem.update({
        where: { id: addonId },
        data: { name, price, isOnline, sortOrder }
      });
      
      res.json({
        success: true,
        data: updatedAddonItem
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji dodatku"
      });
    }
  };

  deleteAddonItem = async (req: Request, res: Response) => {
    try {
      const { groupId, addonId } = req.params;
      
      await this.prisma.addonItem.delete({
        where: { id: addonId }
      });
      
      res.json({
        success: true,
        message: "Dodatek został usunięty"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania dodatku"
      });
    }
  };

  // Modifiers CRUD
  getModifiers = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      const modifier = await this.prisma.modifier.findUnique({
        where: { groupId },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });
      
      res.json({
        success: true,
        data: modifier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania modyfikatora"
      });
    }
  };

  createModifier = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { selectionType = "MULTI", minSelect = 0, maxSelect, includedFreeQty = 0 } = req.body;
      
      if (!groupId) {
        return res.status(400).json({
          success: false,
          error: "ID grupy dodatków jest wymagane"
        });
      }

      // Sprawdź czy grupa istnieje
      const group = await this.prisma.addonGroup.findUnique({
        where: { id: groupId }
      });

      if (!group) {
        return res.status(404).json({
          success: false,
          error: "Grupa dodatków nie została znaleziona"
        });
      }

      const newModifier = await this.prisma.modifier.create({
        data: {
          groupId,
          selectionType,
          minSelect,
          maxSelect,
          includedFreeQty
        },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });

      res.status(201).json({
        success: true,
        data: newModifier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas tworzenia modyfikatora"
      });
    }
  };

  updateModifier = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { selectionType, minSelect, maxSelect, includedFreeQty } = req.body;
      
      const updatedModifier = await this.prisma.modifier.update({
        where: { groupId },
        data: { selectionType, minSelect, maxSelect, includedFreeQty },
        include: {
          group: {
            include: {
              addonItems: true
            }
          }
        }
      });
      
      res.json({
        success: true,
        data: updatedModifier
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas aktualizacji modyfikatora"
      });
    }
  };

  deleteModifier = async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      
      await this.prisma.modifier.delete({
        where: { groupId }
      });
      
      res.json({
        success: true,
        message: "Modyfikator został usunięty"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas usuwania modyfikatora"
      });
    }
  };

  // Public menu endpoint for QR code
  getPublicMenu = async (_req: Request, res: Response) => {
    try {
      const categories = await this.prisma.category.findMany({
        include: {
          sizes: true,
          dishes: {
            include: {
              dishSizes: {
                include: {
                  size: true
                }
              },
              groupAssignments: {
                include: {
                  group: {
                    include: {
                      addonItems: true
                    }
                  }
                }
              },
              ingredients: true
            }
          },
          groupAssignments: {
            include: {
              group: {
                include: {
                  addonItems: true
                }
              }
            }
          }
        }
      });

      const categoriesWithItems = categories.map(category => {
        const items = category.dishes.map(dish => {
          // Get sizes for this item
          const itemSizes = dish.dishSizes.map(dishSize => ({
            id: dishSize.size.id,
            name: dishSize.size.name,
            price: dishSize.price
          }));

          // Get addon groups for this item
          const itemAddonGroups = dish.groupAssignments.map(assignment => ({
            ...assignment.group,
            items: assignment.group.addonItems
          }));

          // Get base price from the first size (smallest) or default to 0
          const basePrice = itemSizes.length > 0 ? Math.min(...itemSizes.map(size => size.price)) : 0;
          
          return {
            ...dish,
            price: basePrice,
            sizes: itemSizes,
            addonGroups: itemAddonGroups
          };
        });

        // Get category-level addon groups
        const categoryAddonGroups = category.groupAssignments.map(assignment => ({
          ...assignment.group,
          items: assignment.group.addonItems
        }));

        return {
          ...category,
          items: items,
          sizes: category.sizes,
          addonGroups: categoryAddonGroups
        };
      });

      res.json({
        success: true,
        data: categoriesWithItems
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Błąd podczas pobierania publicznego menu"
      });
    }
  };

  // Menu endpoint for restaurant shop - returns format: { categories: [...], items: [...] }
  getMenuForShop = async (_req: Request, res: Response) => {
    try {
      const categories = await this.prisma.category.findMany({
        where: {
          isOnline: true
        },
        include: {
          sizes: true,
          dishes: {
            where: {
              isOnline: true
            },
            include: {
              dishSizes: {
                where: {
                  isOnline: true
                },
                include: {
                  size: true
                }
              },
              ingredients: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      });

      // Transform categories to simple format
      const transformedCategories = categories.map((category, index) => ({
        id: category.id,
        name: category.name,
        position: index
      }));

      // Transform all dishes to items format expected by restaurant shop
      const allItems: any[] = [];
      
      categories.forEach(category => {
        category.dishes.forEach(dish => {
          // Get variants (sizes) for this dish
          const variants = dish.dishSizes
            .sort((a, b) => a.price - b.price)
            .map(dishSize => ({
              name: dishSize.size.name,
              price: dishSize.price,
              isActive: dishSize.isOnline
            }));

          // Get base price (lowest price from variants)
          const basePrice = variants.length > 0 ? Math.min(...variants.map(v => v.price)) : 0;

          // Get allergens from ingredients (simplified - you might want to enhance this)
          const allergens: string[] = [];

          // Create item in expected format
          allItems.push({
            id: dish.id,
            name: dish.name,
            description: '', // You might want to add description field to Dish model
            price: basePrice,
            imageUrl: dish.imageUrl || '',
            categoryId: category.id,
            variants: variants.length > 0 ? variants : [{ name: 'Standard', price: basePrice, isActive: true }],
            allergens: allergens,
            prepTime: '', // You might want to add prepTime field to Dish model
            isActive: dish.isOnline
          });
        });
      });

      // Return in format expected by restaurant shop
      res.json({
        categories: transformedCategories,
        items: allItems
      });
    } catch (error) {
      console.error('Error fetching menu for shop:', error);
      res.status(500).json({
        error: "Błąd podczas pobierania menu"
      });
    }
  };
}

export default MenuController;
