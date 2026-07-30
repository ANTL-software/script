import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../API/services';
import { useCampaign, useDialer } from './index';
import type { Objection, ObjectionsByCategorie } from '../utils/types';
import { getErrorMessage } from '../utils/scripts/formatters';
import { OBJECTION_CATEGORIES_ORDER } from '../utils/constants';
import { resolveRuntimeCampaignId } from '../utils/scripts/runtimeCampaign';
import { CAMPAIGN_VARIANTS, isLeadB2BCampaign } from '../utils/scripts/campaignVariants';
import { CIGALES_OBJECTIONS, MMA_OBJECTIONS, FGA_OBJECTIONS } from '../utils/scripts/staticObjections';

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
  const { currentCampaign } = useCampaign();
  const { currentCampagneId } = useDialer();
  const campagneId = resolveRuntimeCampaignId({
    currentCampaignId: currentCampaign?.id_campagne,
    currentDialerCampaignId: currentCampagneId,
    urlCampaignId: searchParams.get('campagne'),
  });
  const matchedContextCampaign = currentCampaign?.id_campagne === campagneId ? currentCampaign : null;

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

        // Charger la campagne pour avoir le nom et le type
        let name = '';
        let type = '';
        try {
          const campaign = await campaignService.getCampaignById(campagneId);
          const data = campaign.toJSON();
          name = data.nom_campagne || '';
          type = data.type_campagne || '';
          setCampagneName(name);
        } catch (err) {
          console.warn('Impossible de charger les infos de la campagne, fallback...', err);
          name = matchedContextCampaign?.nom_campagne || (campagneId === 7 ? 'Les Cigales' : 'MMA Planète Assurance') || '';
          type = matchedContextCampaign?.type_campagne || (campagneId === 7 ? CAMPAIGN_VARIANTS.vente : CAMPAIGN_VARIANTS.lead_b2b);
          setCampagneName(name);
        }

        // Charger les objections de l'API
        let objectionsData: Objection[] = [];
        try {
          objectionsData = await campaignService.getObjections(campagneId);
        } catch (err) {
          console.warn('Impossible de charger les objections de l\'API, utilisation du fallback statique...', err);
        }

        // Fallback statique si la base de données est vide ou injoignable
        if (!objectionsData || objectionsData.length === 0) {
          if (campagneId === 11 || name.toLowerCase().includes('fga')) {
            objectionsData = FGA_OBJECTIONS;
            console.log('[useObjections] Utilisation des objections statiques de fallback pour FGA Consulting');
          } else {
            const isMMA = isLeadB2BCampaign({
              type_campagne: type === CAMPAIGN_VARIANTS.lead_b2b ? CAMPAIGN_VARIANTS.lead_b2b : CAMPAIGN_VARIANTS.vente,
              nom_campagne: name,
            });
            objectionsData = isMMA ? MMA_OBJECTIONS : CIGALES_OBJECTIONS;
            console.log(`[useObjections] Utilisation des objections statiques de fallback pour ${isMMA ? 'MMA' : 'Cigales'}`);
          }
        }

        setObjections(objectionsData);
      } catch (err) {
        setError(getErrorMessage(err, 'Erreur lors du chargement'));
      } finally {
        setIsLoading(false);
      }
    };

    loadObjections();
  }, [campagneId, matchedContextCampaign]);

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
