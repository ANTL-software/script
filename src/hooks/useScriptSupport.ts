import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { campaignService } from '../API/services/index.ts';
import { useCampaign, useDialer } from './index.ts';
import type { ScriptSupport, ScriptSupportKind } from '../utils/types/index.ts';
import { resolveRuntimeCampaignId, getErrorMessage } from '../utils/scripts/index.ts';

export function useScriptSupport(kind: ScriptSupportKind) {
  const [params] = useSearchParams();
  const { currentCampaign } = useCampaign();
  const { currentCampagneId } = useDialer();
  const campaignId = resolveRuntimeCampaignId({
    currentCampaignId: currentCampaign?.id_campagne,
    currentDialerCampaignId: currentCampagneId,
    urlCampaignId: params.get('campagne'),
    preferDialerCampaign: params.get('test') === 'true',
  });
  const [state, setState] = useState<{ key: string; data: ScriptSupport | null; error: string | null }>({ key: '', data: null, error: null });
  const [reload, setReload] = useState(0);
  const key = `${campaignId}:${kind}:${reload}`;
  useEffect(() => {
    let active = true;
    if (!campaignId) return;
    void campaignService.getScriptSupport(campaignId, kind)
      .then((data) => { if (active) setState({ key, data, error: null }); })
      .catch((reason: unknown) => {
        if (active) setState({ key, data: null, error: getErrorMessage(reason, 'Impossible de charger le support') });
      });
    return () => { active = false; };
  }, [campaignId, kind, key]);
  const refresh = useCallback(() => { setReload((value) => value + 1); }, []);
  const matchesRequest = state.key === key;
  return {
    data: matchesRequest ? state.data : null,
    error: !campaignId ? 'ID de campagne manquant' : matchesRequest ? state.error : null,
    isLoading: Boolean(campaignId) && !matchesRequest,
    campaignId,
    refresh,
  };
}
