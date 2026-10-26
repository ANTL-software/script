import { useMemo, useState } from 'react';
import { useScriptSupport } from './index.ts';
import { supportToObjections } from '../API/models/index.ts';
import type { Objection, ObjectionsByCategorie } from '../utils/types/index.ts';
import { OBJECTION_CATEGORIES_ORDER } from '../utils/constants/index.ts';
export function useObjections() {
  const support = useScriptSupport('objections');
  const objections = useMemo(() => support.data && support.campaignId ? supportToObjections(support.data, support.campaignId) : [], [support.data, support.campaignId]);
  const campagneName = support.data?.nom_campagne ?? '';
  const isLoading = support.isLoading;
  const error = support.error;
  const [searchTerm, setSearchTerm] = useState('');
  const [openCategory, setOpenCategory] = useState<string | null>(null);

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
