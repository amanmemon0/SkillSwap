/* ═══════════════════════════════════════════════════════════
   VideoTile — Renders a single participant's video stream
   Falls back to Avatar when camera is off
   ═══════════════════════════════════════════════════════════ */
import { DailyVideo, useParticipantProperty } from '@daily-co/daily-react';
import { MicOff } from 'lucide-react';
import { Avatar } from './Primitives';

interface VideoTileProps {
  /** Daily session ID of the participant */
  sessionId: string;
  /** Whether this is the local user */
  isLocal?: boolean;
  /** Whether this is the featured/large tile */
  isFeatured?: boolean;
  /** Custom label (e.g. 'Tutor') */
  badge?: string;
  /** Screen share tile */
  isScreenShare?: boolean;
}

export function VideoTile({
  sessionId,
  isLocal = false,
  isFeatured = false,
  badge,
  isScreenShare = false,
}: VideoTileProps) {
  const userName = useParticipantProperty(sessionId, 'user_name') as string | undefined;
  const videoState = useParticipantProperty(sessionId, 'tracks.video.state') as string | undefined;
  const audioState = useParticipantProperty(sessionId, 'tracks.audio.state') as string | undefined;

  const hasVideo = videoState === 'playable';
  const hasAudio = audioState === 'playable';
  const displayName = userName || 'Participant';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-ink to-violet/10 ${
        isFeatured ? 'flex-1' : 'h-28 w-40 shrink-0'
      }`}
    >
      {/* Video stream */}
      {hasVideo ? (
        <DailyVideo
          sessionId={sessionId}
          type={isScreenShare ? 'screenVideo' : 'video'}
          mirror={isLocal && !isScreenShare}
          className="h-full w-full object-cover"
          style={{ transform: isLocal && !isScreenShare ? 'scaleX(-1)' : undefined }}
        />
      ) : (
        /* Avatar fallback when camera is off */
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Avatar name={displayName} size={isFeatured ? 'xl' : 'md'} />
          {isFeatured && (
            <p className="mt-4 text-lg font-bold text-white">{displayName}</p>
          )}
        </div>
      )}

      {/* Name overlay (small tiles only) */}
      {!isFeatured && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
          <p className="text-xs font-bold text-white truncate">{displayName}</p>
        </div>
      )}

      {/* Badge (e.g. "Tutor", "You") */}
      {badge && (
        <div className="absolute top-2 left-2 rounded-full bg-violet/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </div>
      )}

      {/* "You" indicator */}
      {isLocal && !badge && (
        <span className="absolute top-2 left-2 text-[10px] font-bold text-cyan">You</span>
      )}

      {/* Muted indicator */}
      {!hasAudio && (
        <div className="absolute top-2 right-2 rounded-full bg-rose-500/80 backdrop-blur p-1">
          <MicOff size={10} className="text-white" />
        </div>
      )}

      {/* Screen share badge */}
      {isScreenShare && (
        <div className="absolute top-2 right-2 rounded-full bg-emerald-500/80 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-white">
          🖥 Screen
        </div>
      )}
    </div>
  );
}
