import type { Employe } from '../types/index.ts';

export interface ScriptCallBlockNotice {
  reason: string;
  blockedUntil: string | null;
}

export function getScriptCallBlockNotice(employe: Employe): ScriptCallBlockNotice | null {
  if (!employe.appels_script_bloques) return null;
  return {
    reason: employe.motif_blocage_appels_script?.trim() || 'Aucun motif précisé.',
    blockedUntil: employe.appels_script_bloques_jusqu_au ?? null,
  };
}

export function buildScriptCallBlockAlertMessage(notice: ScriptCallBlockNotice): string {
  const until = notice.blockedUntil ? new Date(notice.blockedUntil) : null;
  const formattedUntil = until && !Number.isNaN(until.getTime())
    ? until.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : null;
  const unlockMessage = formattedUntil
    ? `Déblocage automatique prévu le ${formattedUntil}.`
    : 'La reprise des appels devra être autorisée par la supervision.';

  return [
    'Votre accès aux appels dans le Script est bloqué. Vous ne pouvez plus passer disponible ni lancer un appel manuel. Après avoir appuyé sur « OK », vous serez déconnecté et redirigé vers l’authentification.',
    `Motif :\n${notice.reason}`,
    unlockMessage,
  ].join('\n\n');
}
