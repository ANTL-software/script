import './categoryTree.scss';
import { useState } from 'react';
import type { CategorieProduit, Produit } from '../../../utils/types';
import { filterNonEmptyCategories } from '../../../utils/scripts/utils';
import ProduitCard from './ProduitCard';
import { FaChevronDown, FaChevronRight, FaFolder, FaFolderOpen } from 'react-icons/fa';

interface CategoryTreeProps {
  categories: CategorieProduit[];
  onAddToCart: (produit: Produit) => void;
}

interface CategoryNodeProps {
  category: CategorieProduit;
  level: number;
  onAddToCart: (produit: Produit) => void;
}

function CategoryNode({ category, level, onAddToCart }: CategoryNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  // Filtrer les sous-catégories vides
  const filteredSousCategories = category.sousCategories
    ? filterNonEmptyCategories(category.sousCategories)
    : [];

  const hasSousCategories = filteredSousCategories.length > 0;
  const hasProduits = category.produits && category.produits.length > 0;
  const hasContent = hasSousCategories || hasProduits;

  const handleToggle = () => {
    if (hasContent) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`category-node category-node--level-${level}`}>
      <div className="category-node__header" onClick={handleToggle}>
        <div className="category-node__toggle">
          {hasContent ? (
            isExpanded ? <FaChevronDown /> : <FaChevronRight />
          ) : (
            <span className="category-node__spacer" />
          )}
        </div>
        <div className="category-node__icon">
          {isExpanded ? <FaFolderOpen /> : <FaFolder />}
        </div>
        <div className="category-node__info">
          <h3 className="category-node__title">{category.nom_categorie}</h3>
          {category.description && (
            <p className="category-node__description">{category.description}</p>
          )}
          <div className="category-node__counts">
            {hasSousCategories && (
              <span className="category-node__count">
                {filteredSousCategories.length} sous-catégorie{filteredSousCategories.length > 1 ? 's' : ''}
              </span>
            )}
            {hasProduits && (
              <span className="category-node__count">
                {category.produits!.length} produit{category.produits!.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {isExpanded && hasContent && (
        <div className="category-node__content">
          {hasSousCategories && (
            <div className="category-node__subcategories">
              {filteredSousCategories.map((subCat) => (
                <CategoryNode
                  key={subCat.id_categorie}
                  category={subCat}
                  level={level + 1}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}

          {hasProduits && (
            <div className="category-node__products">
              {category.produits!.map((produit) => (
                <ProduitCard
                  key={produit.id_produit}
                  produit={produit}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, onAddToCart }: CategoryTreeProps) {
  // Filtrer les catégories vides à la racine aussi
  const filteredCategories = filterNonEmptyCategories(categories);

  if (filteredCategories.length === 0) {
    return (
      <div className="category-tree__empty">
        <p>Aucune catégorie disponible</p>
      </div>
    );
  }

  return (
    <div className="category-tree">
      {filteredCategories.map((category) => (
        <CategoryNode
          key={category.id_categorie}
          category={category}
          level={1}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
