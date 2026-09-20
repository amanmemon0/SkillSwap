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
  localMediaStream: MediaStream | null;
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
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);

  /* ─── Join a Daily room or fallback to local media ─── */
  const join = useCallback(
    async (roomUrl: string, userName: string) => {
      setCallState('joining');
      setError(null);

      // Try Daily room if not default placeholder
      if (daily && !roomUrl.includes('your-team.daily.co')) {
        try {
          await daily.join({ url: roomUrl, userName });
          setCallState('joined');
          return;
        } catch (err: any) {
          console.warn('[Daily] join failed, using local browser media stream', err);
        }
      }

      // Local browser media stream fallback
      try {
        let stream: MediaStream | null = null;
        if (navigator?.mediaDevices?.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          } catch {
            try {
              stream = await navigator.mediaDevices.getUserMedia({ video: true });
            } catch {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            }
          }
        }
        setLocalMediaStream(stream);
        setCallState('joined');
        setError(null);
      } catch (err: any) {
        console.warn('[MediaStream] camera/mic warning:', err);
        setCallState('joined');
        setError(null);
      }
    },
    [daily],
  );

  /* ─── Leave ─── */
  const leave = useCallback(async () => {
    try {
      setCallState('leaving');
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((t) => t.stop());
        setLocalMediaStream(null);
      }
      if (daily) {
        await daily.leave().catch(() => {});
      }
      setCallState('idle');
    } catch (err: any) {
      console.error('[Call] leave error', err);
      setCallState('idle');
    }
  }, [daily, localMediaStream]);

  /* ─── Toggle Mic ─── */
  const toggleMic = useCallback(() => {
    const next = !isMicOn;
    setIsMicOn(next);
    if (daily) {
      try { daily.setLocalAudio(next); } catch {}
    }
    if (localMediaStream) {
      localMediaStream.getAudioTracks().forEach((t) => { t.enabled = next; });
    }
  }, [daily, isMicOn, localMediaStream]);

  /* ─── Toggle Camera ─── */
  const toggleCam = useCallback(() => {
    const next = !isCamOn;
    setIsCamOn(next);
    if (daily) {
      try { daily.setLocalVideo(next); } catch {}
    }
    if (localMediaStream) {
      localMediaStream.getVideoTracks().forEach((t) => { t.enabled = next; });
    }
  }, [daily, isCamOn, localMediaStream]);

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
    if (callState === 'joining') {
      // Allow fallback rather than hard error
      setError(null);
    }
  });

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (localMediaStream) {
        localMediaStream.getTracks().forEach((t) => t.stop());
      }
      if (daily && callState === 'joined') {
        daily.leave().catch(() => {});
      }
    };
  }, [daily, callState, localMediaStream]);

  return {
    callState,
    error,
    isMicOn,
    isCamOn,
    isScreenSharing: isSharingScreen,
    localSessionId,
    participantIds,
    localMediaStream,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
}
