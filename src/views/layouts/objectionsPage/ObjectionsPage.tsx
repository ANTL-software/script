import './objectionsPage.scss';
import { useState } from 'react';
import Button from '../../components/button/Button';
import Input from '../../components/input/Input';
import Loader from '../../components/loader/Loader';
import { FaPrint, FaCommentDots, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import { useObjections } from '../../../hooks/useObjections';
import { pluralize } from '../../../utils/scripts/formatters';

export default function ObjectionsPage() {
  const {
    objectionsByCategory,
    campagneName,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    filteredObjections,
  } = useObjections();

  const [localOpenCategory, setLocalOpenCategory] = useState<string | null>(null);

  const toggleCategory = (categorie: string) => {
    const newOpen = localOpenCategory === categorie ? null : categorie;
    setLocalOpenCategory(newOpen);
  };

  const closeCategory = () => {
    setLocalOpenCategory(null);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="objections-page">
        <div className="objections-page__loader">
          <Loader size="large" />
          <p>Chargement des objections...</p>
        </div>
      </div>
    );
  }

  if (error && filteredObjections.length === 0) {
    return (
      <div className="objections-page">
        <div className="objections-page__error">
          <FaCommentDots className="objections-page__error-icon" />
          <h2>Objections</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="objections-page">
      <header className="objections-page__header">
        <div className="objections-page__title">
          <FaCommentDots className="objections-page__icon" />
          <div>
            <h1>Objections</h1>
            <span className="objections-page__campaign-name">{campagneName}</span>
          </div>
        </div>
        <div className="objections-page__header-actions">
          <span className="objections-page__count">{pluralize(filteredObjections.length, 'objection')}</span>
          <Button variant="ghost" size="small" onClick={handlePrint} className="print-button">
            <FaPrint /> Imprimer
          </Button>
        </div>
      </header>

      <div className="objections-page__toolbar">
        <div className="objections-page__search">
          <FaSearch className="objections-page__search-icon" />
          <Input
            type="text"
            placeholder="Rechercher une objection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {localOpenCategory && (
          <Button variant="ghost" size="small" onClick={closeCategory}>
            Fermer
          </Button>
        )}
      </div>

      <main className="objections-page__content">
        {objectionsByCategory.length === 0 ? (
          <div className="objections-page__empty">
            <p>Aucune objection ne correspond a votre recherche</p>
          </div>
        ) : (
          objectionsByCategory.map(group => {
            const isOpen = localOpenCategory === group.categorie;
            return (
            <div
              key={group.categorie}
              className={`objections-page__category ${isOpen ? 'objections-page__category--open' : 'objections-page__category--closed'}`}
            >
              <button
                className="objections-page__category-header"
                onClick={() => toggleCategory(group.categorie)}
              >
                <div className="objections-page__category-info">
                  <span className="objections-page__category-name">{group.categorie}</span>
                  <span className="objections-page__category-count">
                    {pluralize(group.objections.length, 'objection')}
                  </span>
                </div>
                {isOpen ? (
                  <FaChevronUp className="objections-page__category-icon" />
                ) : (
                  <FaChevronDown className="objections-page__category-icon" />
                )}
              </button>

              {isOpen && (
                <div className="objections-page__category-content">
                  {group.objections.map(objection => (
                    <div key={objection.id_objection} className="objections-page__objection">
                      <div className="objections-page__objection-header">
                        <h3 className="objections-page__objection-title">{objection.titre}</h3>
                      </div>
                      {objection.texte_objection && (
                        <div className="objections-page__objection-question">
                          <span className="objections-page__label">Objection client :</span>
                          <p>{objection.texte_objection}</p>
                        </div>
                      )}
                      <div className="objections-page__objection-response">
                        <span className="objections-page__label">Reponse :</span>
                        <p>{objection.texte_reponse}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            );
          })
        )}
      </main>
    </div>
  );
}
