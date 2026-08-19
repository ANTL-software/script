import { useCallback, useEffect, useRef } from 'react';
import { userService } from '../API/services/index.ts';
import { buildScriptCallBlockAlertMessage, getScriptCallBlockNotice } from '../utils/scripts/index.ts';
import type { ScriptCallBlockNotice } from '../utils/scripts/index.ts';
import { useAlert } from './useAlert.ts';
import { useUser } from './useUser.ts';

const DASHBOARD_ACCESS_CHECK_INTERVAL_MS = 5_000;

export function useScriptCallAccessGuard(isDashboard: boolean): void {
  const { user, isAuthenticated, logout } = useUser();
  const { showAlert } = useAlert();
  const isHandlingBlockRef = useRef(false);
  const isCheckingRef = useRef(false);

  const handleBlockedAccess = useCallback(async (notice: ScriptCallBlockNotice): Promise<void> => {
    if (isHandlingBlockRef.current) return;
    isHandlingBlockRef.current = true;

    await showAlert({
      type: 'warning',
      title: 'Appels bloqués par la supervision',
      message: buildScriptCallBlockAlertMessage(notice),
      acknowledgeOnly: true,
      confirmText: 'OK',
    });
    await logout();
  }, [logout, showAlert]);

  useEffect(() => {
    const notice = user ? getScriptCallBlockNotice(user) : null;
    if (notice) {
      void handleBlockedAccess(notice);
    }
  }, [handleBlockedAccess, user]);

  useEffect(() => {
    if (isAuthenticated) return;
    isHandlingBlockRef.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !isDashboard) return;
    let cancelled = false;

    const checkAccess = async (): Promise<void> => {
      if (isCheckingRef.current || isHandlingBlockRef.current) return;
      isCheckingRef.current = true;
      try {
        const currentUser = await userService.getCurrentUser();
        const notice = getScriptCallBlockNotice(currentUser.toJSON());
        if (!cancelled && notice) {
          await handleBlockedAccess(notice);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[SCRIPT CALL ACCESS] Impossible de vérifier le verrou:', error);
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    const handleWindowFocus = (): void => { void checkAccess(); };
    void checkAccess();
    const intervalId = window.setInterval(() => { void checkAccess(); }, DASHBOARD_ACCESS_CHECK_INTERVAL_MS);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [handleBlockedAccess, isAuthenticated, isDashboard]);
}
