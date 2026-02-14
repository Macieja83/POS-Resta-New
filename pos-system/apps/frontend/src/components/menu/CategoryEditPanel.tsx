import React, { useState } from 'react';
import type { MenuCategory, Size } from '../../api/menu';

interface CategoryEditPanelProps {
  selectedCategory: MenuCategory | null;
  onUpdateCategory: (id: string, data: Partial<MenuCategory>) => void;
  onDeleteCategory: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
  onAddCategorySize: (categoryId: string, name: string) => void;
  onRemoveCategorySize: (categoryId: string, sizeName: string) => void;
  onUpdateCategorySize: (categoryId: string, sizeName: string, newName: string) => void;
  isDefaultCategory: boolean;
  onSetDefaultCategory: () => void;
  vatRate: string;
  onVatRateChange: (rate: string) => void;
  eRestaurantAvailable: boolean;
  onERestaurantAvailableChange: (available: boolean) => void;
}

export const CategoryEditPanel: React.FC<CategoryEditPanelProps> = ({
  selectedCategory,
  onUpdateCategory,
  onDeleteCategory,
  isUpdating,
  isDeleting,
  onAddCategorySize,
  onRemoveCategorySize,
  onUpdateCategorySize,
  isDefaultCategory,
  onSetDefaultCategory,
  vatRate,
  onVatRateChange,
  eRestaurantAvailable,
  onERestaurantAvailableChange
}) => {
  const [newSizeName, setNewSizeName] = useState('');
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editingSizeName, setEditingSizeName] = useState('');

  if (!selectedCategory) return null;

  const handleAddCategorySize = () => {
    if (selectedCategory && newSizeName.trim()) {
      onAddCategorySize(selectedCategory.id, newSizeName.trim());
      setNewSizeName('');
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
      onUpdateCategorySize(selectedCategory.id, editingSize, editingSizeName.trim());
    }
    setEditingSize(null);
    setEditingSizeName('');
  };

  return (
    <div className="edit-panel">
      <div className="panel-header">
        <h2>Edycja kategorii</h2>
        <div className="panel-actions">
          <button className="cancel-btn">ANULUJ</button>
          <button 
            className="save-btn" 
            onClick={() => selectedCategory && onUpdateCategory(selectedCategory.id, { name: selectedCategory.name })}
            disabled={isUpdating}
          >
            {isUpdating ? 'ZAPISYWANIE...' : 'ZAPISZ'}
          </button>
          <button className="delete-btn" onClick={onDeleteCategory} disabled={isDeleting}>
            {isDeleting ? 'USUWANIE...' : '🗑️ USUŃ'}
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-group">
          <label>Nazwa kategorii</label>
          <input
            type="text"
            value={selectedCategory.name}
            onChange={(e) => {
              // TODO: this should trigger a local state update in parent
              void e;
            }}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isDefaultCategory}
              onChange={onSetDefaultCategory}
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
            onChange={(e) => onVatRateChange(e.target.value)}
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
            {selectedCategory.sizes?.map((size: Size | string, index: number) => {
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
                          onClick={() => onRemoveCategorySize(selectedCategory.id, sizeName)}
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
              onChange={(e) => onERestaurantAvailableChange(e.target.checked)}
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
      </div>
    </div>
  );
};

