import { useMemo, useState } from 'react';
import { useScriptSupport } from './index.ts';
import { supportToPlan } from '../API/models/index.ts';
import type { ScriptSupport } from '../utils/types/index.ts';

export function usePlanAppel() {
  const support = useScriptSupport('plan-appel');
  const [selection, setSelection] = useState<{ data: ScriptSupport | null; index: number }>({ data: null, index: 0 });
  const etapes = useMemo(() => support.data && support.campaignId ? supportToPlan(support.data, support.campaignId) : [], [support.data, support.campaignId]);
  const currentEtapeIndex = selection.data === support.data ? selection.index : 0;
  const setCurrentEtapeIndex = (index: number) => setSelection({ data: support.data, index });
  return {
    etapes, currentEtapeIndex, setCurrentEtapeIndex, campagneName: support.data?.nom_campagne ?? '',
    isLoading: support.isLoading, error: support.error, loadPlanAppel: support.refresh,
  };
}
