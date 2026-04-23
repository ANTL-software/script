import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../API/services';
import type { Objection, ObjectionsByCategorie } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';
import { OBJECTION_CATEGORIES_ORDER } from '../utils/constants';

interface UseObjectionsReturn {
  objections: Objection[];
  objectionsByCategory: ObjectionsByCategorie[];
  campagneName: string;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openCategory: string | null;
  setOpenCategory: (category: string | null) => void;
  filteredObjections: Objection[];
}

export function useObjections(): UseObjectionsReturn {
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

  // Grouper par categorie et trier selon l'ordre defini
  const objectionsByCategory = useMemo((): ObjectionsByCategorie[] => {
    const grouped: Record<string, Objection[]> = {};

    filteredObjections.forEach(objection => {
      const cat = objection.categorie || 'Autre';
      if (!grouped[cat]) {
        grouped[cat] = [];
      }
      grouped[cat].push(objection);
    });

    // Trier par ordre defini dans OBJECTION_CATEGORIES_ORDER
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

  return {
    objections,
    objectionsByCategory,
    campagneName,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    openCategory,
    setOpenCategory,
    filteredObjections,
  };
}
