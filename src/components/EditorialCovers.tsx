import type { ReactNode } from 'react';
import type { BannerMood } from '../hooks/useCompanionStore';
import type { TaskCategory } from '../types';

export type PageBannerVariant = 'dashboard' | 'todos' | 'routine' | 'weekly' | 'habits' | 'notes';

const BUILDING_LAYOUT = [
  { x: 0, w: 48, h: 128, lit: [14, 28, 42, 64, 78, 96] },
  { x: 50, w: 62, h: 162, lit: [12, 24, 36, 52, 72, 88, 108, 124] },
  { x: 114, w: 42, h: 112, lit: [18, 34, 58, 82] },
  { x: 158, w: 74, h: 178, lit: [16, 30, 44, 58, 76, 94, 114, 130, 148] },
  { x: 234, w: 54, h: 138, lit: [14, 32, 54, 76, 98] },
  { x: 290, w: 84, h: 192, lit: [12, 26, 40, 56, 74, 92, 110, 128, 146, 162] },
  { x: 376, w: 48, h: 124, lit: [20, 42, 66, 90] },
  { x: 426, w: 68, h: 166, lit: [16, 32, 48, 68, 88, 108, 130] },
  { x: 496, w: 56, h: 144, lit: [18, 36, 58, 84, 108] },
  { x: 554, w: 92, h: 198, lit: [14, 28, 42, 60, 78, 96, 116, 134, 152, 170] },
  { x: 648, w: 52, h: 132, lit: [16, 38, 64, 92] },
  { x: 702, w: 74, h: 172, lit: [14, 30, 46, 66, 86, 106, 128, 148] },
  { x: 778, w: 58, h: 146, lit: [18, 38, 60, 86, 110] },
  { x: 838, w: 84, h: 184, lit: [16, 32, 48, 68, 88, 108, 128, 150] },
  { x: 924, w: 62, h: 152, lit: [16, 36, 58, 82, 108] },
  { x: 988, w: 76, h: 176, lit: [14, 30, 48, 68, 90, 114, 138] },
  { x: 1066, w: 54, h: 136, lit: [18, 40, 66, 94] },
  { x: 1122, w: 78, h: 168, lit: [14, 32, 52, 74, 98, 122] },
];

export function SkylineCoverBanner({ mood }: { mood: BannerMood }) {
  const skyGradient =
    mood === 'burgundy'
      ? 'from-[#160B10] via-[#2B121B] to-[#4A1C2A]'
      : mood === 'espresso'
        ? 'from-[#14100E] via-[#241B15] to-[#3A2B1F]'
        : 'from-[#0D0F14] via-[#1A1A20] to-[#29221B]';

  const glowColor =
    mood === 'burgundy'
      ? 'rgba(229, 138, 155, 0.24)'
      : mood === 'espresso'
        ? 'rgba(212, 168, 94, 0.24)'
        : 'rgba(200, 155, 84, 0.24)';

  const windowColor =
    mood === 'burgundy' ? '#F2C19E' : mood === 'espresso' ? '#E6BE7A' : '#E8C27A';

  return (
    <div
      className={`relative w-full h-36 sm:h-44 overflow-hidden bg-gradient-to-b ${skyGradient}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 105%, ${glowColor} 0%, transparent 70%)`,
        }}
      />
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" className="w-full h-full">
        <g opacity="0.45">
          {BUILDING_LAYOUT.map((b, idx) => (
            <rect
              key={`bg-${idx}`}
              x={b.x + 12}
              y={220 - b.h - 14}
              width={b.w}
              height={b.h + 14}
              fill="#0A0A0C"
            />
          ))}
        </g>
        {BUILDING_LAYOUT.map((b, idx) => {
          const topY = 220 - b.h;
          const cols = Math.max(2, Math.floor((b.w - 14) / 11));
          return (
            <g key={`fg-${idx}`}>
              <rect
                x={b.x}
                y={topY}
                width={b.w}
                height={b.h}
                fill="#111013"
                stroke="#252220"
                strokeWidth="0.75"
              />
              <rect x={b.x + 4} y={topY - 4} width={b.w - 8} height={4} fill="#19171A" />
              {b.lit.map((wy, wIdx) => {
                const absY = topY + wy;
                if (absY > 210) return null;
                return Array.from({ length: cols }).map((_, cIdx) => {
                  const isLit = (idx + wIdx * 3 + cIdx * 7) % 5 !== 0;
                  if (!isLit) return null;
                  const wx = b.x + 7 + cIdx * 11;
                  const isWarmBright = (idx + wIdx + cIdx) % 3 === 0;
                  return (
                    <rect
                      key={`${wIdx}-${cIdx}`}
                      x={wx}
                      y={absY}
                      width={6}
                      height={4.5}
                      rx={0.6}
                      fill={windowColor}
                      opacity={isWarmBright ? 0.88 : 0.34}
                    />
                  );
                });
              })}
            </g>
          );
        })}
        <defs>
          <linearGradient id="skylineFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="100%" stopColor="#0E0D0D" stopOpacity="0.65" />
          </linearGradient>
        </defs>
        <rect x="0" y="150" width="1200" height="70" fill="url(#skylineFade)" />
      </svg>
    </div>
  );
}

function EditorialSubpageBanner({
  variant,
  mood,
}: {
  variant: Exclude<PageBannerVariant, 'dashboard'>;
  mood: BannerMood;
}) {
  const accentStroke =
    mood === 'burgundy' ? '#D68494' : mood === 'espresso' ? '#D4A85E' : '#C89B54';

  if (variant === 'todos') {
    // Stationery desk grid + dusty blush ribbon + burgundy editorial arches
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-gradient-to-r from-[#26161B] via-[#3A1622] to-[#231918]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={i * 72}
              y1="0"
              x2={i * 72}
              y2="160"
              stroke="#E8D8D2"
              strokeOpacity="0.07"
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={i * 36}
              x2="1200"
              y2={i * 36}
              stroke="#E8D8D2"
              strokeOpacity="0.06"
            />
          ))}
          <path
            d="M840 160 V78 A110 110 0 0 1 1060 78 V160 Z"
            fill="#E8C5C8"
            fillOpacity="0.1"
            stroke="#E8C5C8"
            strokeOpacity="0.24"
          />
          <circle cx="950" cy="64" r="34" fill="none" stroke={accentStroke} strokeOpacity="0.45" />
          <path
            d="M160 120 Q360 32 580 96 T980 62"
            fill="none"
            stroke={accentStroke}
            strokeWidth="1.4"
            strokeOpacity="0.4"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'routine') {
    // Morning sunlit arches + dusty blush & champagne sunrise arc
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-gradient-to-r from-[#241B19] via-[#342024] to-[#1E1A17]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <circle cx="920" cy="145" r="115" fill="#E8C5C8" fillOpacity="0.12" />
          <circle cx="920" cy="145" r="76" fill={accentStroke} fillOpacity="0.18" />
          <circle cx="920" cy="145" r="42" fill="#F2D7B4" fillOpacity="0.22" />
          <path
            d="M0 128 Q300 44 620 112 T1200 76"
            fill="none"
            stroke="#E8C5C8"
            strokeOpacity="0.28"
            strokeWidth="1.5"
          />
          <path
            d="M210 160 C235 110 270 86 310 74 C290 114 256 142 210 160 Z"
            fill="#6E9478"
            fillOpacity="0.34"
          />
          <path
            d="M262 160 C272 118 296 96 330 88 C316 120 292 146 262 160 Z"
            fill="#8AB896"
            fillOpacity="0.25"
          />
        </svg>
      </div>
    );
  }

  if (variant === 'weekly') {
    // 7 architectural linen columns + champagne horizon line
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-gradient-to-r from-[#181718] via-[#261D1C] to-[#1D1819]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i}>
              <rect
                x={140 + i * 136}
                y={22}
                width={106}
                height={138}
                rx={12}
                fill={i === 3 ? '#800020' : '#FAF6EE'}
                fillOpacity={i === 3 ? 0.28 : 0.05}
                stroke={i === 3 ? accentStroke : '#EAE3D9'}
                strokeOpacity={i === 3 ? 0.5 : 0.12}
              />
              <line
                x1={158 + i * 136}
                y1={46}
                x2={228 + i * 136}
                y2={46}
                stroke={accentStroke}
                strokeOpacity={i === 3 ? 0.8 : 0.25}
                strokeWidth="1.5"
              />
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'habits') {
    // Botanical conservatory greenhouse arches + sage fronds
    return (
      <div
        className="relative w-full h-full overflow-hidden bg-gradient-to-r from-[#18241D] via-[#223228] to-[#181C19]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          {[180, 420, 660, 900].map((cx, i) => (
            <path
              key={i}
              d={`M${cx - 80} 160 V76 A80 80 0 0 1 ${cx + 80} 76 V160`}
              fill="none"
              stroke="#C8D9CB"
              strokeOpacity="0.16"
              strokeWidth="1.5"
            />
          ))}
          <path
            d="M860 160 C875 94 920 56 985 44 C956 96 914 134 860 160 Z"
            fill="#8AB896"
            fillOpacity="0.28"
          />
          <path
            d="M930 160 C950 108 994 74 1054 64 C1028 110 982 142 930 160 Z"
            fill="#6E9478"
            fillOpacity="0.32"
          />
          <circle cx="998" cy="54" r="7" fill="#E8C5C8" fillOpacity="0.65" />
          <circle cx="964" cy="40" r="5" fill={accentStroke} fillOpacity="0.65" />
        </svg>
      </div>
    );
  }

  // notes: Pressed linen sheets + dusty blush stationery ribbon + wax seal accent
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gradient-to-r from-[#241A1C] via-[#321B22] to-[#231D18]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 160" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        <rect
          x="740"
          y="22"
          width="320"
          height="160"
          rx="14"
          transform="rotate(-4 740 22)"
          fill="#FAF6EE"
          fillOpacity="0.07"
          stroke="#E8C5C8"
          strokeOpacity="0.2"
        />
        <rect
          x="785"
          y="34"
          width="320"
          height="160"
          rx="14"
          fill="#FAF6EE"
          fillOpacity="0.06"
          stroke={accentStroke}
          strokeOpacity="0.24"
        />
        <circle cx="945" cy="84" r="14" fill="#800020" stroke={accentStroke} strokeWidth="1.2" />
        <path
          d="M120 112 H560"
          stroke="#E8C5C8"
          strokeOpacity="0.18"
          strokeDasharray="4 6"
        />
        <path
          d="M120 82 H440"
          stroke={accentStroke}
          strokeOpacity="0.22"
          strokeDasharray="3 5"
        />
      </svg>
    </div>
  );
}

export function FocusCategoryCover({ category }: { category: TaskCategory }) {
  if (category === 'Study') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#B88954]">
        <svg
          viewBox="0 0 240 120"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="cheetahBg" cx="50%" cy="45%" r="70%">
              <stop offset="0%" stopColor="#D7A870" />
              <stop offset="70%" stopColor="#B8834B" />
              <stop offset="100%" stopColor="#8E5F30" />
            </radialGradient>
          </defs>
          <rect width="240" height="120" fill="url(#cheetahBg)" />
          {[
            { cx: 24, cy: 20, rx: 13, ry: 9, rot: 14 },
            { cx: 68, cy: 14, rx: 11, ry: 8, rot: -20 },
            { cx: 116, cy: 24, rx: 14, ry: 10, rot: 8 },
            { cx: 164, cy: 18, rx: 12, ry: 8, rot: -15 },
            { cx: 212, cy: 26, rx: 13, ry: 9, rot: 22 },
            { cx: 42, cy: 52, rx: 15, ry: 10, rot: -12 },
            { cx: 94, cy: 56, rx: 12, ry: 9, rot: 28 },
            { cx: 142, cy: 48, rx: 14, ry: 10, rot: -8 },
            { cx: 192, cy: 58, rx: 15, ry: 10, rot: 16 },
            { cx: 18, cy: 90, rx: 13, ry: 9, rot: -18 },
            { cx: 70, cy: 94, rx: 14, ry: 10, rot: 12 },
            { cx: 124, cy: 88, rx: 13, ry: 9, rot: -24 },
            { cx: 174, cy: 96, rx: 15, ry: 10, rot: 10 },
            { cx: 224, cy: 92, rx: 12, ry: 8, rot: -14 },
          ].map((s, idx) => (
            <g key={idx} transform={`translate(${s.cx} ${s.cy}) rotate(${s.rot})`}>
              <ellipse
                cx="0"
                cy="0"
                rx={s.rx}
                ry={s.ry}
                fill="#8C592C"
                stroke="#1F1610"
                strokeWidth="3.6"
                strokeDasharray="16 4 12 3"
              />
              <ellipse cx="1" cy="0" rx={s.rx * 0.45} ry={s.ry * 0.45} fill="#A36E3C" />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>
    );
  }

  if (category === 'Work') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#EAE4DA] flex flex-col justify-between p-2.5">
        <div className="space-y-1">
          <div className="h-3.5 bg-[#FFFDF9] border border-[#D4CBC0] px-2 flex items-center justify-between">
            <span className="font-display text-[8px] font-semibold tracking-[0.22em] text-[#1A1816] uppercase">
              ATELIER
            </span>
            <span className="font-mono text-[6px] text-[#7D7267]">DEEP WORK</span>
          </div>
          <div className="h-4 bg-[#F5F0E8] border border-[#D4CBC0] px-2 flex items-center justify-between translate-x-1">
            <span className="font-display italic text-[9px] font-semibold tracking-[0.1em] text-[#1A1816]">
              CRAFT &amp; FLOW
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />
          </div>
          <div className="h-5 bg-[#FFFDF9] border border-[#CFC5B8] px-2 flex items-center justify-between -translate-x-0.5 shadow-sm">
            <span className="font-display text-[11px] font-semibold tracking-[0.14em] text-[#141414]">
              PRIORITIES
            </span>
            <span className="font-mono text-[7px] text-[#800020]">FOCUS</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[7px] font-mono tracking-widest uppercase text-[#5C534D]">
          <span>DAYEASE</span>
          <span>EDITION</span>
        </div>
      </div>
    );
  }

  if (category === 'Creative') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#F1DFDF] via-[#E9CCD0] to-[#DCC0C5] flex items-center justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
          <path d="M72 120 V56 A48 48 0 0 1 168 56 V120 Z" fill="#FFFDF9" opacity="0.55" />
          <circle cx="120" cy="54" r="24" fill="none" stroke="#800020" strokeWidth="1.4" opacity="0.7" />
          <path d="M102 68 Q120 34 138 68" fill="none" stroke="#B5853B" strokeWidth="1.6" />
          <circle cx="120" cy="48" r="4" fill="#800020" opacity="0.85" />
        </svg>
      </div>
    );
  }

  if (category === 'UX Design') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-[#EAE4DA] flex flex-col justify-between p-2.5">
        <div className="space-y-1">
          <div className="h-3.5 bg-[#FFFDF9] border border-[#D4CBC0] px-2 flex items-center justify-between">
            <span className="font-display text-[8px] font-semibold tracking-[0.22em] text-[#1A1816] uppercase">
              ATELIER
            </span>
            <span className="font-mono text-[6px] text-[#7D7267]">NO. 04</span>
          </div>
          <div className="h-4 bg-[#F5F0E8] border border-[#D4CBC0] px-2 flex items-center justify-between translate-x-1">
            <span className="font-display italic text-[9px] font-semibold tracking-[0.12em] text-[#1A1816]">
              STUDIO VOGUE
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#800020]" />
          </div>
          <div className="h-5 bg-[#FFFDF9] border border-[#CFC5B8] px-2 flex items-center justify-between -translate-x-0.5 shadow-sm">
            <span className="font-display text-[11px] font-semibold tracking-[0.16em] text-[#141414]">
              DESIGN CRAFT
            </span>
            <span className="font-mono text-[7px] text-[#800020]">SYSTEM</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-[7px] font-mono tracking-widest uppercase text-[#5C534D]">
          <span>GRID &amp; TYPE</span>
          <span>EDITION</span>
        </div>
      </div>
    );
  }

  if (category === 'Career') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#111317] to-[#231F1B]">
        <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
          <rect x="18" y="34" width="38" height="86" fill="#18181B" stroke="#2D2B29" />
          <rect x="64" y="18" width="52" height="102" fill="#141417" stroke="#2D2B29" />
          <rect x="124" y="28" width="44" height="92" fill="#1A191D" stroke="#2D2B29" />
          <rect x="176" y="14" width="48" height="106" fill="#121215" stroke="#2D2B29" />
          {[
            [74, 30], [88, 30], [102, 30], [74, 46], [102, 46], [88, 64],
            [186, 28], [202, 28], [186, 44], [202, 58], [134, 44], [148, 56],
            [28, 48], [40, 62],
          ].map(([x, y], i) => (
            <rect
              key={i}
              x={x}
              y={y}
              width="6"
              height="4"
              rx="0.5"
              fill="#D4A85E"
              opacity={i % 2 === 0 ? 0.85 : 0.45}
            />
          ))}
        </svg>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/45 to-transparent" />
      </div>
    );
  }

  if (category === 'Personal') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#3A1622] via-[#531E2E] to-[#2B1218] flex items-center justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
          <circle cx="120" cy="60" r="38" fill="#E8C5C8" opacity="0.16" />
          <circle cx="120" cy="60" r="24" fill="none" stroke="#E8C5C8" strokeWidth="1.2" opacity="0.6" />
          <path d="M120 34 C128 46 138 56 120 74 C102 56 112 46 120 34 Z" fill="#E8C5C8" opacity="0.72" />
          <path d="M98 60 C110 52 120 46 120 74 C108 72 98 68 98 60 Z" fill="#C89B54" opacity="0.55" />
          <path d="M142 60 C130 52 120 46 120 74 C132 72 142 68 142 60 Z" fill="#C89B54" opacity="0.55" />
        </svg>
      </div>
    );
  }

  if (category === 'Home') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#ECE3D5] to-[#DDD0BE] flex items-center justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
          <path d="M78 120 V56 A42 42 0 0 1 162 56 V120 Z" fill="#FFFDF9" opacity="0.72" />
          <ellipse cx="120" cy="84" rx="18" ry="20" fill="#B58E76" />
          <rect x="112" y="58" width="16" height="10" rx="2" fill="#A07962" />
          <path d="M120 58 Q112 36 102 28" stroke="#4A6B53" strokeWidth="1.8" fill="none" />
          <path d="M120 58 Q128 34 140 30" stroke="#5A8165" strokeWidth="1.8" fill="none" />
          <ellipse cx="101" cy="28" rx="6" ry="3.5" transform="rotate(-25 101 28)" fill="#4A6B53" />
          <ellipse cx="141" cy="30" rx="6" ry="3.5" transform="rotate(20 141 30)" fill="#5A8165" />
        </svg>
      </div>
    );
  }

  if (category === 'Health') {
    return (
      <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#233229] via-[#2C3F33] to-[#1A241E] flex items-center justify-center">
        <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
          <circle cx="120" cy="60" r="42" fill="#8AB896" opacity="0.12" />
          <path d="M120 96 C120 62 120 34 120 22" stroke="#C8D9CB" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M120 74 C98 70 86 58 90 46 C104 48 116 58 120 74 Z" fill="#6E9478" />
          <path d="M120 62 C142 58 154 46 150 34 C136 36 124 46 120 62 Z" fill="#8AB896" />
          <circle cx="120" cy="24" r="5" fill="#D4A85E" opacity="0.9" />
        </svg>
      </div>
    );
  }

  // Deterministic Pinterest-inspired editorial cover for any custom user Focus Space
  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) >>> 0;
  }
  const themes = [
    { bg: 'from-[#F1DFDF] to-[#E2C2C6]', ink: '#6B1C2E', accent: '#FFFDF9' },
    { bg: 'from-[#2A1B1E] to-[#4A1C2A]', ink: '#E8C5C8', accent: '#D4A85E' },
    { bg: 'from-[#E5ECE6] to-[#CFDDD2]', ink: '#35523D', accent: '#FFFDF9' },
    { bg: 'from-[#F2E9DC] to-[#E3D4BE]', ink: '#5C4432', accent: '#800020' },
  ];
  const theme = themes[hash % themes.length];

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br ${theme.bg} flex items-center justify-center`}>
      <svg viewBox="0 0 240 120" className="w-full h-full" aria-hidden="true">
        <path
          d="M74 120 V58 A46 46 0 0 1 166 58 V120 Z"
          fill={theme.accent}
          opacity="0.45"
        />
        <circle cx="120" cy="56" r="22" fill="none" stroke={theme.ink} strokeWidth="1.4" opacity="0.65" />
        <path d="M120 38 V74 M102 56 H138" stroke={theme.ink} strokeWidth="1.2" opacity="0.45" />
      </svg>
    </div>
  );
}

interface PageCoverHeaderProps {
  mood: BannerMood;
  variant?: Exclude<PageBannerVariant, 'dashboard'>;
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  actions?: ReactNode;
}

export function PageCoverHeader({
  mood,
  variant = 'todos',
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: PageCoverHeaderProps) {
  return (
    <header className="rounded-3xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#2E2C29] overflow-hidden shadow-[0_2px_12px_rgba(41,37,34,0.04)] dark:shadow-none transition-colors">
      <div className="h-24 sm:h-28 overflow-hidden relative">
        <EditorialSubpageBanner variant={variant} mood={mood} />
      </div>

      <div className="px-5 sm:px-7 pb-6">
        <div className="relative -mt-7 mb-3 flex items-end justify-between gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFFDF9] dark:bg-[#1E1E1E] border border-[#E6DFD5] dark:border-[#34312D] shadow-md flex items-center justify-center text-[#800020] dark:text-[#D4A85E] shrink-0">
            {icon}
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-[#800020] dark:text-[#D4A85E] pb-1">
            {eyebrow}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-[#292522] dark:text-[#F3EFEA]">
              {title}
            </h1>
            <p className="mt-1.5 text-sm text-[#6E6359] dark:text-[#A69E94] max-w-2xl">
              {subtitle}
            </p>
          </div>

          {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    </header>
  );
}
