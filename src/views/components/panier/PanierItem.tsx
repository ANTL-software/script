import './panierItem.scss';
import type { CartItem } from '../../../utils/types/index.ts';
import { formatCurrency, calculateLineTotal } from '../../../utils/scripts/index.ts';
import { FaMinus, FaPlus, FaTrash } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

interface PanierItemProps {
  item: CartItem;
  onUpdateQuantity: (productId: number, quantite: number) => void;
  onRemove: (productId: number) => void;
}

export default function PanierItem({ item, onUpdateQuantity, onRemove }: PanierItemProps) {
  const subtotal = calculateLineTotal(item.prix_unitaire, item.quantite, item.remise);
  const [inputValue, setInputValue] = useState(item.quantite.toString());
  const isPanierLine = item.item_type === 'panier';
  const itemTitle = isPanierLine ? (item.panier_label || item.produit.nom_produit) : item.produit.nom_produit;

  // Synchroniser l'input avec la quantité quand elle change de l'extérieur
  useEffect(() => {
    queueMicrotask(() => setInputValue(item.quantite.toString()));
  }, [item.quantite]);

  const handleIncrement = () => {
    const newQuantite = item.quantite + 1;
    onUpdateQuantity(item.produit.id_produit, newQuantite);
    setInputValue(newQuantite.toString());
  };

  const handleDecrement = () => {
    if (item.quantite > 1) {
      const newQuantite = item.quantite - 1;
      onUpdateQuantity(item.produit.id_produit, newQuantite);
      setInputValue(newQuantite.toString());
    }
  };

  const handleRemove = () => {
    onRemove(item.produit.id_produit);
  };

  const handleInputChange = (e: FormEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setInputValue(value);

    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 9999) {
      onUpdateQuantity(item.produit.id_produit, numValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current quantity if invalid
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 1) {
      setInputValue(item.quantite.toString());
    } else if (numValue > 9999) {
      const capped = 9999;
      setInputValue(capped.toString());
      onUpdateQuantity(item.produit.id_produit, capped);
    } else {
      setInputValue(numValue.toString());
    }
  };

  return (
    <div className="panier-item">
      <div className="panier-item__header">
        <div className="panier-item__title-group">
          <h4 className="panier-item__name">{itemTitle}</h4>
          {isPanierLine && item.panier_produits && item.panier_produits.length > 0 ? (
            <div className="panier-item__sources">
              <span className="panier-item__source-badge">
                {item.panier_produits.length} article{item.panier_produits.length > 1 ? 's' : ''} inclus
              </span>
            </div>
          ) : item.panier_source_labels && item.panier_source_labels.length > 0 ? (
            <div className="panier-item__sources">
              {item.panier_source_labels.map((label) => (
                <span key={label} className="panier-item__source-badge">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <button className="panier-item__remove" onClick={handleRemove} aria-label="Supprimer">
          <FaTrash />
        </button>
      </div>

      <div className="panier-item__details">
        <span className="panier-item__price">
          {formatCurrency(item.prix_unitaire)}
          {isPanierLine ? ' / panier' : ''}
        </span>
        {item.remise > 0 && (
          <span className="panier-item__remise">- {formatCurrency(item.remise)}</span>
        )}
      </div>

      <div className="panier-item__controls">
        <div className="panier-item__quantity">
          <button
            className="quantity-btn"
            onClick={handleDecrement}
            disabled={item.quantite <= 1}
            aria-label="Diminuer"
          >
            <FaMinus />
          </button>
          <input
            type="number"
            className="quantity-input"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min="1"
            max="9999"
            aria-label="Quantité"
          />
          <button
            className="quantity-btn"
            onClick={handleIncrement}
            aria-label="Augmenter"
          >
            <FaPlus />
          </button>
        </div>

        <span className="panier-item__subtotal">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}
