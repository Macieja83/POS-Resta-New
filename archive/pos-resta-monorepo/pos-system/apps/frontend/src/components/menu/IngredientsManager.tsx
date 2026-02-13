import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuApi } from '../../api/menu';
import './IngredientsManager.css';

interface Ingredient {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface IngredientsManagerProps {
  itemId: string;
  ingredients: Ingredient[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
}

export const IngredientsManager: React.FC<IngredientsManagerProps> = ({
  itemId,
  ingredients = [],
  onIngredientsChange
}) => {
  const [newIngredientName, setNewIngredientName] = useState('');
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const queryClient = useQueryClient();

  const addIngredientMutation = useMutation({
    mutationFn: (name: string) => menuApi.addIngredient(itemId, name),
    onSuccess: (response) => {
      const newIngredient = response.data;
      const updatedIngredients = [...(ingredients || []), newIngredient];
      onIngredientsChange(updatedIngredients);
      setNewIngredientName('');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (error: any) => {
      console.error('Błąd podczas dodawania składnika:', error);
      alert(error.response?.data?.error || 'Błąd podczas dodawania składnika');
    }
  });

  const updateIngredientMutation = useMutation({
    mutationFn: ({ ingredientId, name }: { ingredientId: string; name: string }) => 
      menuApi.updateIngredient(itemId, ingredientId, name),
    onSuccess: (response) => {
      const updatedIngredient = response.data;
      const updatedIngredients = (ingredients || []).map(ingredient =>
        ingredient.id === updatedIngredient.id ? updatedIngredient : ingredient
      );
      onIngredientsChange(updatedIngredients);
      setEditingIngredientId(null);
      setEditingName('');
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (error: any) => {
      console.error('Błąd podczas aktualizacji składnika:', error);
      alert(error.response?.data?.error || 'Błąd podczas aktualizacji składnika');
    }
  });

  const removeIngredientMutation = useMutation({
    mutationFn: (ingredientId: string) => menuApi.removeIngredient(itemId, ingredientId),
    onSuccess: (_, ingredientId) => {
      const updatedIngredients = (ingredients || []).filter(ingredient => ingredient.id !== ingredientId);
      onIngredientsChange(updatedIngredients);
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
    onError: (error: any) => {
      console.error('Błąd podczas usuwania składnika:', error);
      alert(error.response?.data?.error || 'Błąd podczas usuwania składnika');
    }
  });

  const handleAddIngredient = () => {
    if (newIngredientName.trim()) {
      addIngredientMutation.mutate(newIngredientName.trim());
    }
  };

  const handleStartEdit = (ingredient: Ingredient) => {
    setEditingIngredientId(ingredient.id);
    setEditingName(ingredient.name);
  };

  const handleSaveEdit = () => {
    if (editingName?.trim() && editingIngredientId) {
      updateIngredientMutation.mutate({
        ingredientId: editingIngredientId,
        name: editingName.trim()
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingIngredientId(null);
    setEditingName('');
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten składnik?')) {
      removeIngredientMutation.mutate(ingredientId);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddIngredient();
      } else {
        handleSaveEdit();
      }
    } else if (e.key === 'Escape') {
      if (action === 'edit') {
        handleCancelEdit();
      }
    }
  };

  return (
    <div className="ingredients-manager">
      <div className="ingredients-header">
        <h3>Składniki dania</h3>
      </div>

      {/* Dodawanie nowego składnika */}
      <div className="ingredient-input-section">
        <div className="ingredient-input-container">
          <input
            type="text"
            value={newIngredientName}
            onChange={(e) => setNewIngredientName(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            placeholder="Wpisz nazwę składnika..."
            className="ingredient-input"
            disabled={addIngredientMutation.isPending}
          />
          <div className="ingredient-actions">
            <button
              type="button"
              onClick={() => setNewIngredientName('')}
              className="ingredient-clear-btn"
              disabled={addIngredientMutation.isPending}
              title="Wyczyść"
            >
              ✕
            </button>
            <button
              type="button"
              onClick={handleAddIngredient}
              className="ingredient-save-btn"
              disabled={!newIngredientName.trim() || addIngredientMutation.isPending}
              title="Dodaj składnik"
            >
              {addIngredientMutation.isPending ? '...' : '💾'}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddIngredient}
          className="add-ingredient-btn"
          disabled={!newIngredientName.trim() || addIngredientMutation.isPending}
        >
          <span className="add-icon">+</span>
          Dodaj składnik
        </button>
      </div>

      {/* Lista składników */}
      <div className="ingredients-list">
        {(ingredients || []).length === 0 ? (
          <div className="no-ingredients">
            <p>Brak składników</p>
          </div>
        ) : (
          (ingredients || []).map((ingredient) => (
            <div key={ingredient.id} className="ingredient-item">
              {editingIngredientId === ingredient.id ? (
                <div className="ingredient-edit-container">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, 'edit')}
                    className="ingredient-edit-input"
                    autoFocus
                  />
                  <div className="ingredient-edit-actions">
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      className="ingredient-save-edit-btn"
                      disabled={!editingName?.trim() || updateIngredientMutation.isPending}
                      title="Zapisz"
                    >
                      {updateIngredientMutation.isPending ? '...' : '✓'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="ingredient-cancel-edit-btn"
                      disabled={updateIngredientMutation.isPending}
                      title="Anuluj"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="ingredient-display">
                  <span className="ingredient-name">{ingredient.name}</span>
                  <div className="ingredient-item-actions">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(ingredient)}
                      className="ingredient-edit-btn"
                      title="Edytuj składnik"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ingredient.id)}
                      className="ingredient-remove-btn"
                      disabled={removeIngredientMutation.isPending}
                      title="Usuń składnik"
                    >
                      {removeIngredientMutation.isPending ? '...' : '🗑️'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};






