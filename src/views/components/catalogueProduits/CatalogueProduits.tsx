import './catalogueProduits.scss';
import { useState, useMemo } from 'react';
import { useCampaign, useCart } from '../../../hooks';
import type { Produit } from '../../../utils/types';
import ProduitCard from './ProduitCard';
import Loader from '../loader/Loader';
import ErrorMessage from '../errorMessage/ErrorMessage';
import Input from '../input/Input';

export default function CatalogueProduits() {
  const { produits, categories, produitsLoading, produitsError, clearProduitsError } = useCampaign();
  const { addItem } = useCart();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategorie, setSelectedCategorie] = useState<number | null>(null);

  const filteredProduits = useMemo(() => {
    let filtered = produits;

    // Filtre par catégorie
    if (selectedCategorie) {
      filtered = filtered.filter((p) => p.id_categorie === selectedCategorie);
    }

    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nom_produit.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [searchTerm, selectedCategorie, produits]);

  const handleAddToCart = (produit: Produit) => {
    addItem(produit, 1, 0);
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
        <h2>Catalogue de produits</h2>
        <p className="catalogue-produits__subtitle">
          {filteredProduits.length} produit{filteredProduits.length > 1 ? 's' : ''} disponible{filteredProduits.length > 1 ? 's' : ''}
        </p>
      </div>

      <div className="catalogue-produits__filters">
        <div className="catalogue-produits__search">
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="catalogue-produits__categories">
          <button
            className={`category-btn ${selectedCategorie === null ? 'active' : ''}`}
            onClick={() => setSelectedCategorie(null)}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id_categorie}
              className={`category-btn ${selectedCategorie === cat.id_categorie ? 'active' : ''}`}
              onClick={() => setSelectedCategorie(cat.id_categorie)}
            >
              {cat.nom_categorie}
            </button>
          ))}
        </div>
      </div>

      {filteredProduits.length === 0 ? (
        <div className="catalogue-produits__empty">
          <p>Aucun produit trouvé</p>
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
    </div>
  );
}
