/* ═══════════════════════════════════════════════════════════
   useDailyCall — Custom hook wrapping Daily.co SDK
   Provides: join/leave, mic/cam/screen toggles, participants
   ═══════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useState } from 'react';
import {
  useDaily,
  useLocalSessionId,
  useParticipantIds,
  useScreenShare,
  useDailyEvent,
  useDevices,
} from '@daily-co/daily-react';

/* ─── Types ─── */
export type CallState = 'idle' | 'joining' | 'joined' | 'leaving' | 'error';

export interface DailyCallControls {
  /* State */
  callState: CallState;
  error: string | null;
  isMicOn: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  localSessionId: string | null;
  participantIds: string[];
  /* Actions */
  join: (roomUrl: string, userName: string) => Promise<void>;
  leave: () => Promise<void>;
  toggleMic: () => void;
  toggleCam: () => void;
  toggleScreenShare: () => void;
}

/**
 * Must be used inside a <DailyProvider>.
 * Encapsulates all Daily.co call logic so page components stay clean.
 */
export function useDailyCall(): DailyCallControls {
  const daily = useDaily();
  const localSessionId = useLocalSessionId();
  const participantIds = useParticipantIds({ filter: 'remote' });
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  /* ─── Join a Daily room ─── */
  const join = useCallback(
    async (roomUrl: string, userName: string) => {
      if (!daily) return;
      try {
        setCallState('joining');
        setError(null);
        await daily.join({ url: roomUrl, userName });
        setCallState('joined');
      } catch (err: any) {
        console.error('[Daily] join error', err);
        setError(err?.message ?? 'Failed to join call');
        setCallState('error');
      }
    },
    [daily],
  );

  /* ─── Leave ─── */
  const leave = useCallback(async () => {
    if (!daily) return;
    try {
      setCallState('leaving');
      await daily.leave();
      setCallState('idle');
    } catch (err: any) {
      console.error('[Daily] leave error', err);
      setCallState('idle');
    }
  }, [daily]);

  /* ─── Toggle Mic ─── */
  const toggleMic = useCallback(() => {
    if (!daily) return;
    const next = !isMicOn;
    daily.setLocalAudio(next);
    setIsMicOn(next);
  }, [daily, isMicOn]);

  /* ─── Toggle Camera ─── */
  const toggleCam = useCallback(() => {
    if (!daily) return;
    const next = !isCamOn;
    daily.setLocalVideo(next);
    setIsCamOn(next);
  }, [daily, isCamOn]);

  /* ─── Toggle Screen Share ─── */
  const toggleScreenShare = useCallback(() => {
    if (isSharingScreen) {
      stopScreenShare();
    } else {
      startScreenShare();
    }
  }, [isSharingScreen, startScreenShare, stopScreenShare]);

  /* ─── Sync local tracks on joined-meeting ─── */
  useDailyEvent('joined-meeting', (evt) => {
    if (evt) {
      const localParticipant = evt.participants?.local;
      if (localParticipant) {
        setIsMicOn(!localParticipant.audio === false);
        setIsCamOn(!localParticipant.video === false);
      }
    }
  });

  /* ─── Handle fatal errors ─── */
  useDailyEvent('error', (evt) => {
    console.error('[Daily] error event', evt);
    setError(evt?.error?.msg ?? evt?.errorMsg ?? 'An error occurred');
    setCallState('error');
  });

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (daily && callState === 'joined') {
        daily.leave().catch(() => {});
      }
    };
    // Only run on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    callState,
    error,
    isMicOn,
    isCamOn,
    isScreenSharing: isSharingScreen,
    localSessionId,
    participantIds,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
}
