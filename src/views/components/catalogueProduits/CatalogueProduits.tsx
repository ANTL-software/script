import './catalogueProduits.scss';
import { useState, useMemo, useEffect } from 'react';
import { useCampaign, useCart } from '../../../hooks';
import type { Produit } from '../../../utils/types';
import ProduitCard from './ProduitCard';
import CategoryTree from './CategoryTree';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import Input from '../input/Input';
import Button from '../button/Button';
import { FaList, FaSitemap, FaSearch } from 'react-icons/fa';

type ViewMode = 'tree' | 'search';

export default function CatalogueProduits() {
  const { produits, categoriesTree, produitsLoading, produitsError, clearProduitsError, loadProduitsGrouped, searchProduits } = useCampaign();
  const { addItem } = useCart();

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadProduitsGrouped();
  }, [loadProduitsGrouped]);

  const filteredProduits = useMemo(() => {
    return searchProduits(searchTerm, 3);
  }, [searchTerm, searchProduits]);

  const handleAddToCart = (produit: Produit) => {
    addItem(produit, 1, 0);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length >= 3) {
      setViewMode('search');
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'tree') {
      setSearchTerm('');
    }
  };

  if (produitsLoading) {
    return (
      <div className="catalogue-produits">
        <div className="catalogue-produits__loader">
          <Loader size="large" />
          <p>Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  if (produitsError) {
    return (
      <div className="catalogue-produits">
        <div className="catalogue-produits__error">
          <ErrorMessage message={produitsError} onClose={clearProduitsError} />
        </div>
      </div>
    );
  }

  return (
    <div className="catalogue-produits">
      <div className="catalogue-produits__header">
        <div className="catalogue-produits__title-group">
          <h2>Catalogue de produits</h2>
          <p className="catalogue-produits__subtitle">
            {viewMode === 'search' && searchTerm.length >= 3
              ? `${filteredProduits.length} produit${filteredProduits.length > 1 ? 's' : ''} trouvé${filteredProduits.length > 1 ? 's' : ''}`
              : `${produits.length} produit${produits.length > 1 ? 's' : ''} disponible${produits.length > 1 ? 's' : ''}`
            }
          </p>
        </div>

        <div className="catalogue-produits__view-toggle">
          <Button
            variant={viewMode === 'tree' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => handleViewModeChange('tree')}
          >
            <FaSitemap /> Navigation
          </Button>
          <Button
            variant={viewMode === 'search' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => handleViewModeChange('search')}
          >
            <FaList /> Recherche
          </Button>
        </div>
      </div>

      <div className="catalogue-produits__filters">
        <div className="catalogue-produits__search">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <Input
              type="text"
              placeholder="Rechercher un produit (min. 3 caractères)..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <span className="catalogue-produits__search-hint">
              Saisissez au moins 3 caractères pour lancer la recherche
            </span>
          )}
        </div>
      </div>

      {viewMode === 'tree' || searchTerm.length < 3 ? (
        <div className="catalogue-produits__tree-view">
          <CategoryTree categories={categoriesTree} onAddToCart={handleAddToCart} />
        </div>
      ) : (
        <>
          {filteredProduits.length === 0 ? (
            <div className="catalogue-produits__empty">
              <p>Aucun produit trouvé</p>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    setViewMode('tree');
                  }}
                >
                  Réinitialiser la recherche
                </Button>
              )}
            </div>
          ) : (
            <div className="catalogue-produits__grid">
              {filteredProduits.map((produit) => (
                <ProduitCard
                  key={produit.id_produit}
                  produit={produit}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
