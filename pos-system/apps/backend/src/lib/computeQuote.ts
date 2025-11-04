import { Decimal } from 'decimal.js';
import { QuoteRequest, QuoteResponse } from '../types/local';
import { mockDishes, mockDishSizes, mockSizes, mockCategories, mockAddonGroups, mockAddonItems, mockModifiers, mockGroupAssignments } from './mockData';

/**
 * Computes pricing quote for a dish with selected addons
 * Implements all business rules for visibility, VAT, and modifiers
 */
export async function computeQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const { dishId, sizeId, selections } = request;

  // Use mock data
  const dish = mockDishes.find(d => d.id === dishId);
  if (!dish) {
    throw new Error('Dish not found');
  }

  const dishSize = mockDishSizes.find(ds => ds.dishId === dishId && ds.sizeId === sizeId);
  if (!dishSize) {
    throw new Error('Dish size not found');
  }

  const size = mockSizes.find(s => s.id === sizeId);
  if (!size) {
    throw new Error('Size not found');
  }

  const category = mockCategories.find(c => c.id === dish.categoryId);
  if (!category) {
    throw new Error('Category not found');
  }


  // Check AND-visibility for online: Category.isOnline AND Dish.isOnline AND Size.isOnline AND DishSize.isOnline
  if (!category.isOnline || !dish.isOnline || !dishSize.isOnline) {
    throw new Error('Dish size is not available online');
  }

  // Calculate base price
  const basePrice = new Decimal(dishSize.price);

  // Calculate VAT rate
  let vatRate: Decimal;
  if (dishSize.vatSource === 'INHERIT') {
    vatRate = new Decimal(category.vatRate);
  } else {
    vatRate = new Decimal(dishSize.vatOverride || 0);
  }

  // Process addon selections
  const addonLines: Array<{ label: string; price: number }> = [];
  let addonsPrice = new Decimal(0);

  for (const selection of selections) {
    // Find the addon group and item using mock data
    const assignment = mockGroupAssignments.find(a => 
      a.groupId === selection.groupId && (a.dishId === dishId || a.categoryId === dish.categoryId)
    );
    if (!assignment) {
      throw new Error(`Addon group ${selection.groupId} not assigned to this dish`);
    }

    const group = mockAddonGroups.find(g => g.id === selection.groupId);
    if (!group) {
      throw new Error(`Addon group ${selection.groupId} not found`);
    }

    const item = mockAddonItems.find(i => i.id === selection.itemIds[0]);
    if (!item) {
      throw new Error(`Addon item ${selection.itemIds[0]} not found in group ${selection.groupId}`);
    }

    // Check group and item visibility
    if (!group.isOnline || !item.isOnline) {
      throw new Error(`Addon group or item is not available online`);
    }

    // Apply modifier rules
    const modifier = mockModifiers.find(m => m.groupId === group.id);
    if (modifier) {
      // Check selection type
      if (modifier.selectionType === 'SINGLE' && selection.qty > 1) {
        throw new Error(`Group ${group.name} only allows single selection`);
      }

      // Check min/max selection
      if (selection.qty < modifier.minSelect) {
        throw new Error(`Group ${group.name} requires minimum ${modifier.minSelect} selections`);
      }

      if (modifier.maxSelect && selection.qty > modifier.maxSelect) {
        throw new Error(`Group ${group.name} allows maximum ${modifier.maxSelect} selections`);
      }

      // Apply included free quantity
      const chargeableQty = Math.max(0, selection.qty - modifier.includedFreeQty);
      const freeQty = Math.min(selection.qty, modifier.includedFreeQty);

      if (chargeableQty > 0) {
        const itemPrice = new Decimal(item.price).mul(chargeableQty);
        addonsPrice = addonsPrice.add(itemPrice);
        addonLines.push({
          label: `${item.name} (${chargeableQty}x)`,
          price: itemPrice.toNumber()
        });
      }

      if (freeQty > 0) {
        addonLines.push({
          label: `${item.name} (${freeQty}x) - GRATIS`,
          price: 0
        });
      }
    } else {
      // No modifier, charge full price
      const itemPrice = new Decimal(item.price).mul(selection.qty);
      addonsPrice = addonsPrice.add(itemPrice);
      addonLines.push({
        label: `${item.name} (${selection.qty}x)`,
        price: itemPrice.toNumber()
      });
    }
  }

  // Calculate totals
  const subtotal = basePrice.add(addonsPrice);
  const vatAmount = subtotal.mul(vatRate).div(100);
  const total = subtotal.add(vatAmount);

  // Build response lines
  const lines: Array<{ label: string; price: number }> = [
    {
      label: `${dish.name} (Size ${dishSize.sizeId})`,
      price: basePrice.toNumber()
    },
    ...addonLines,
    {
      label: `VAT ${vatRate.toNumber()}%`,
      price: vatAmount.toNumber()
    }
  ];

  return {
    dishId,
    sizeId,
    basePrice: basePrice.toNumber(),
    addonPrice: addonsPrice.toNumber(),
    totalPrice: total.toNumber(),
    vatAmount: vatRate.toNumber(),
    finalPrice: total.toNumber(),
    breakdown: {
      dish: {
        name: dish.name,
        price: basePrice.toNumber()
      },
      size: {
        name: size.name,
        price: 0 // Size price is included in base price
      },
      addons: lines.map(line => ({
        groupName: line.label,
        items: [{
          name: line.label,
          price: line.price,
          quantity: 1,
          total: line.price
        }],
        total: line.price
      }))
    }
  };
}

/**
 * Validates that a dish size is visible online
 */
export async function isDishSizeVisibleOnline(dishId: string, sizeId: string): Promise<boolean> {
  const dish = mockDishes.find(d => d.id === dishId);
  if (!dish) return false;

  const category = mockCategories.find(c => c.id === dish.categoryId);
  if (!category) return false;

  const dishSize = mockDishSizes.find(ds => ds.dishId === dishId && ds.sizeId === sizeId);
  if (!dishSize) return false;

  // AND-visibility: Category.isOnline AND Dish.isOnline AND DishSize.isOnline
  return category.isOnline && dish.isOnline && dishSize.isOnline;
}

/**
 * Gets all visible addon groups for a dish
 */
export async function getVisibleAddonGroups(dishId: string) {
  const dish = mockDishes.find(d => d.id === dishId);
  if (!dish) return [];

  const assignments = mockGroupAssignments.filter(a => 
    a.dishId === dishId || a.categoryId === dish.categoryId
  );

  return assignments
    .map(assignment => mockAddonGroups.find(g => g.id === assignment.groupId))
    .filter(group => group && group.isOnline)
    .filter(group => {
      const items = mockAddonItems.filter(item => item.groupId === group!.id && item.isOnline);
      return items.length > 0;
    });
}
