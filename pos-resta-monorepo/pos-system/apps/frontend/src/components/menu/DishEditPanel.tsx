import React, { useState } from 'react';
import { Dish, MenuCategory } from '../../api/menu';
import { IngredientsManager } from './IngredientsManager';

interface DishEditPanelProps {
  selectedDish: Dish | null;
  categories: MenuCategory[];
  addonGroups: any[];
  onUpdateDish: (id: string, data: any) => void;
  onDeleteDish: () => void;
  onUpdateDishSizes: (id: string, sizes: { name: string; price: number }[]) => void;
  onAssignAddonGroup: (dishId: string, addonGroupId: string) => void;
  onRemoveAddonGroup: (dishId: string, addonGroupId: string) => void;
  onFileUpload: (file: File) => Promise<void>;
  isUpdating: boolean;
  isDeleting: boolean;
  isUpdatingSizes: boolean;
  isAssigningAddon: boolean;
  isRemovingAddon: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export const DishEditPanel: React.FC<DishEditPanelProps> = ({
  selectedDish,
  categories,
  addonGroups,
  onUpdateDish,
  onDeleteDish,
  onUpdateDishSizes,
  onAssignAddonGroup,
  onRemoveAddonGroup,
  onFileUpload,
  isUpdating,
  isDeleting,
  isUpdatingSizes,
  isAssigningAddon,
  isRemovingAddon,
  saveStatus
}) => {
  const [localDish, setLocalDish] = useState<Dish | null>(selectedDish);

  React.useEffect(() => {
    setLocalDish(selectedDish);
  }, [selectedDish]);

  if (!localDish) return null;

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !localDish) return;

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
      await onFileUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Błąd podczas przesyłania pliku. Spróbuj ponownie.');
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  const handleNameChange = (newName: string) => {
    setLocalDish({ ...localDish, name: newName });
    // Auto-save on blur
    setTimeout(() => {
      if (localDish && newName.trim()) {
        onUpdateDish(localDish.id, { name: newName.trim() });
      }
    }, 1000);
  };

  const handleCategoryChange = (newCategoryId: string) => {
    setLocalDish({ ...localDish, categoryId: newCategoryId });
    // Auto-save on blur
    setTimeout(() => {
      if (localDish && newCategoryId) {
        onUpdateDish(localDish.id, { categoryId: newCategoryId });
      }
    }, 1000);
  };

  const handleImageUrlChange = (newImageUrl: string) => {
    setLocalDish({ ...localDish, imageUrl: newImageUrl });
    // Auto-save on blur
    setTimeout(() => {
      if (localDish) {
        onUpdateDish(localDish.id, { imageUrl: newImageUrl || null });
      }
    }, 1000);
  };

  const handleSizePriceChange = (index: number, newPrice: number) => {
    if (!localDish?.sizes) return;
    
    const newSizes = [...localDish.sizes];
    newSizes[index] = { ...newSizes[index], price: newPrice };
    setLocalDish({ ...localDish, sizes: newSizes });
    
    // Auto-save after a delay
    setTimeout(() => {
      if (localDish && localDish.sizes && localDish.sizes.length > 0) {
        onUpdateDishSizes(localDish.id, localDish.sizes.map(size => ({
          name: size.name,
          price: size.price || 0
        })));
      }
    }, 1000);
  };

  return (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Edycja dania: {localDish.name}</h2>
        <div className="panel-actions">
          <div className="save-status">
            {saveStatus === 'saving' && <span className="status-saving">💾 Zapisywanie...</span>}
            {saveStatus === 'saved' && <span className="status-saved">✅ Zapisano</span>}
            {saveStatus === 'error' && <span className="status-error">❌ Błąd zapisu</span>}
          </div>
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => localDish && onUpdateDish(localDish.id, { name: localDish.name })}
            disabled={isUpdating}
          >
            {isUpdating ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={onDeleteDish} disabled={isDeleting}>
            {isDeleting ? 'USUWANIE...' : '🗑️ USUŃ'}
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-group">
          <label>Nazwa dania</label>
          <input
            type="text"
            value={localDish.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Kategoria</label>
          <select
            className="form-select"
            value={localDish.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
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
                  value={localDish.imageUrl || ''}
                  onChange={(e) => handleImageUrlChange(e.target.value)}
                  className="form-input"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            {localDish.imageUrl && (
              <div className="image-preview">
                <img 
                  src={localDish.imageUrl} 
                  alt={localDish.name}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <button 
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    setLocalDish({...localDish, imageUrl: ''});
                    onUpdateDish(localDish.id, { imageUrl: null });
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
            {localDish.sizes?.map((size: any, index: any) => (
              <div key={index} className="size-item">
                <span className="size-name">{size.name}</span>
                <input
                  type="number"
                  step="0.01"
                  value={size.price || 0}
                  onChange={(e) => handleSizePriceChange(index, parseFloat(e.target.value) || 0)}
                  className="price-input"
                  placeholder="0.00"
                />
                <span className="currency">zł</span>
              </div>
            )) || <div className="no-sizes">Brak rozmiarów - dodaj rozmiary w kategorii</div>}
          </div>
          {localDish.sizes && localDish.sizes.length > 0 && (
            <button 
              className="save-sizes-btn"
              onClick={() => onUpdateDishSizes(localDish.id, (localDish.sizes || []).map(size => ({
                name: size.name,
                price: size.price || 0
              })))}
              disabled={isUpdatingSizes}
            >
              {isUpdatingSizes ? 'ZAPISYWANIE...' : 'ZAPISZ CENY'}
            </button>
          )}
        </div>

        <div className="form-group">
          <label>Dodatki</label>
          <div className="addon-assignment">
            <div className="assigned-addons">
              <h4>Przypisane grupy dodatków:</h4>
              {localDish.addonGroups && localDish.addonGroups.length > 0 ? (
                <div className="assigned-list">
                  {localDish.addonGroups.map((addonGroup: any) => (
                      <div key={addonGroup.id} className="assigned-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="remove-btn"
                          onClick={() => onRemoveAddonGroup(localDish.id, addonGroup.id)}
                          disabled={isRemovingAddon}
                          title="Usuń grupę dodatków z dania"
                        >
                          {isRemovingAddon ? '...' : '✕'}
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
                      const isAssigned = localDish?.addonGroups?.some((ag: any) => ag.id === group.id);
                      return !isAssigned;
                    })
                    .map((addonGroup: any) => (
                      <div key={addonGroup.id} className="available-item">
                        <span>{addonGroup.name}</span>
                        <button 
                          className="assign-btn"
                          onClick={() => onAssignAddonGroup(localDish.id, addonGroup.id)}
                          disabled={isAssigningAddon}
                          title="Przypisz grupę dodatków do dania"
                        >
                          {isAssigningAddon ? '...' : '+'}
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
            itemId={localDish.id}
            ingredients={localDish.ingredients || []}
            onIngredientsChange={(ingredients) => {
              setLocalDish({...localDish, ingredients});
            }}
          />
        </div>
      </div>
    </div>
  );
};

