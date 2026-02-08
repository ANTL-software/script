import './objectionsPage.scss';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../../../API/services';
import Button from '../../components/button/Button';
import Input from '../../components/input/Input';
import Loader from '../../components/loader/Loader';
import { FaPrint, FaCommentDots, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import type { Objection, ObjectionsByCategorie } from '../../../utils/types';
import { OBJECTION_CATEGORIES_ORDER } from '../../../utils/constants';
import { getErrorMessage, pluralize } from '../../../utils/scripts/formatters';

export default function ObjectionsPage() {
  const [searchParams] = useSearchParams();
  const campagneId = searchParams.get('campagne');

  const [objections, setObjections] = useState<Objection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campagneName, setCampagneName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadObjections = async () => {
      if (!campagneId) {
        setError('ID de campagne manquant');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Charger la campagne pour avoir le nom
        const campaign = await campaignService.getCampaignById(Number(campagneId));
        setCampagneName(campaign.toJSON().nom_campagne);

        // Charger les objections
        const objectionsData = await campaignService.getObjections(Number(campagneId));
        setObjections(objectionsData);

        if (objectionsData.length === 0) {
          setError('Aucune objection definie pour cette campagne');
        }
      } catch (err) {
        setError(getErrorMessage(err, 'Erreur lors du chargement'));
      } finally {
        setIsLoading(false);
      }
    };

    loadObjections();
  }, [campagneId]);

  // Filtrer les objections par recherche
  const filteredObjections = useMemo(() => {
    if (!searchTerm.trim()) return objections;

    const term = searchTerm.toLowerCase();
    return objections.filter(
      o =>
        o.titre.toLowerCase().includes(term) ||
        o.texte_reponse.toLowerCase().includes(term) ||
        (o.texte_objection && o.texte_objection.toLowerCase().includes(term))
    );
  }, [objections, searchTerm]);

  // Grouper par categorie
  const objectionsByCategorie = useMemo((): ObjectionsByCategorie[] => {
    const grouped: Record<string, Objection[]> = {};

    filteredObjections.forEach(objection => {
      const cat = objection.categorie || 'Autre';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(objection);
    });

    // Trier par ordre defini
    return Object.entries(grouped)
      .sort(([a], [b]) => {
        const indexA = OBJECTION_CATEGORIES_ORDER.indexOf(a);
        const indexB = OBJECTION_CATEGORIES_ORDER.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .map(([categorie, objs]) => ({ categorie, objections: objs }));
  }, [filteredObjections]);

  const toggleCategory = (categorie: string) => {
    setOpenCategory(prev => prev === categorie ? null : categorie);
  };

  const closeCategory = () => {
    setOpenCategory(null);
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

  if (error && objections.length === 0) {
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
        {openCategory && (
          <Button variant="ghost" size="small" onClick={closeCategory}>
            Fermer
          </Button>
        )}
      </div>

      <main className="objections-page__content">
        {objectionsByCategorie.length === 0 ? (
          <div className="objections-page__empty">
            <p>Aucune objection ne correspond a votre recherche</p>
          </div>
        ) : (
          objectionsByCategorie.map(group => {
            const isOpen = openCategory === group.categorie;
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
