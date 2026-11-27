import { motion } from 'motion/react';
import type { HabitKey, PlantStyle } from '../types';

interface HabitGardenPlantProps {
  habitKey: HabitKey;
  plantStyle?: PlantStyle;
  progressPct: number;
}

const STYLE_META: Record<
  PlantStyle,
  { species: string; bloomColor: string; accentColor: string }
> = {
  fern: {
    species: 'River Fern',
    bloomColor: '#3E6B5C',
    accentColor: '#6D9886',
  },
  olive: {
    species: 'Sun Olive',
    bloomColor: '#9C4A3B',
    accentColor: '#C87D6B',
  },
  camellia: {
    species: 'Burgundy Camellia',
    bloomColor: '#9B1D3B',
    accentColor: '#D67B8E',
  },
  peony: {
    species: 'Dusty Blush Peony',
    bloomColor: '#B55B72',
    accentColor: '#E3A4B1',
  },
  lavender: {
    species: 'Garden Lavender',
    bloomColor: '#8B6387',
    accentColor: '#BD9AB9',
  },
};

export function resolvePlantStyle(habitKey: HabitKey, plantStyle?: PlantStyle): PlantStyle {
  if (plantStyle && STYLE_META[plantStyle]) return plantStyle;
  if (habitKey === 'water') return 'fern';
  if (habitKey === 'exercise') return 'olive';
  if (habitKey === 'studying') return 'camellia';
  if (habitKey === 'reading') return 'peony';
  if (habitKey === 'english') return 'lavender';
  const styles: PlantStyle[] = ['camellia', 'fern', 'peony', 'olive', 'lavender'];
  let hash = 0;
  for (let i = 0; i < habitKey.length; i += 1) {
    hash = (hash * 31 + habitKey.charCodeAt(i)) >>> 0;
  }
  return styles[hash % styles.length];
}

export function getPlantSpecies(habitKey: HabitKey, plantStyle?: PlantStyle): string {
  return STYLE_META[resolvePlantStyle(habitKey, plantStyle)].species;
}

export function getGrowthStageLabel(progressPct: number): string {
  if (progressPct >= 100) return 'In full bloom';
  if (progressPct >= 50) return 'Budding stem';
  if (progressPct > 0) return 'Young sprout';
  return 'Planted seed';
}

export function HabitGardenPlant({
  habitKey,
  plantStyle,
  progressPct,
}: HabitGardenPlantProps) {
  const resolved = resolvePlantStyle(habitKey, plantStyle);
  const { bloomColor, accentColor } = STYLE_META[resolved];
  const stage =
    progressPct >= 100 ? 3 : progressPct >= 50 ? 2 : progressPct > 0 ? 1 : 0;

  return (
    <div className="relative flex items-center justify-center h-24 w-full select-none">
      <svg
        viewBox="0 0 120 112"
        className="w-24 h-24 overflow-visible"
        aria-hidden="true"
      >
        <ellipse
          cx="60"
          cy="103"
          rx="28"
          ry="4"
          className="fill-[#E6DDD0] dark:fill-[#111111]"
        />

        {/* Terracotta / Clay Pot */}
        <path
          d="M40 78 H80 L74 101 C73.5 102.5 72 103 70 103 H50 C48 103 46.5 102.5 46 101 Z"
          fill="#C9A892"
        />
        <rect x="37" y="73" width="46" height="7" rx="3" fill="#B58E76" />
        <ellipse cx="60" cy="74" rx="18" ry="3.5" fill="#5C4A3E" />

        {stage === 0 && (
          <motion.g
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ellipse cx="60" cy="72" rx="4.5" ry="3" fill="#8C6D56" />
            <path
              d="M60 69 C60 66 62 64 64 64"
              stroke="#779F7A"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
        )}

        {stage >= 1 && (
          <motion.g
            initial={{ scaleY: 0.4, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            style={{ transformOrigin: '60px 74px' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <path
              d={
                stage === 1
                  ? 'M60 74 Q60 61 60 54'
                  : stage === 2
                    ? 'M60 74 Q58 54 60 36'
                    : 'M60 74 Q57 50 60 28'
              }
              stroke="#5A8165"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M60 62 C52 61 46 56 47 50 C53 50 58 55 60 62 Z" fill="#6E9478" />
            <path d="M60 60 C68 59 74 54 73 48 C67 48 62 53 60 60 Z" fill="#5B8064" />
          </motion.g>
        )}

        {stage >= 2 && (
          <motion.g
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ transformOrigin: '60px 50px' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <path d="M59 48 C50 45 43 38 45 32 C52 33 58 39 59 48 Z" fill="#5F8869" />
            <path d="M60 44 C69 41 75 34 73 28 C66 29 61 36 60 44 Z" fill="#779F81" />
            {stage === 2 && (
              <ellipse cx="60" cy="33" rx="5.5" ry="7.5" fill={accentColor} />
            )}
          </motion.g>
        )}

        {stage === 3 && (
          <motion.g
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ transformOrigin: '60px 25px' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {resolved === 'lavender' ? (
              <g>
                <ellipse cx="60" cy="18" rx="4.5" ry="7" fill={bloomColor} />
                <ellipse cx="54" cy="24" rx="4" ry="5.5" fill={accentColor} />
                <ellipse cx="66" cy="24" rx="4" ry="5.5" fill={accentColor} />
                <ellipse cx="56" cy="30" rx="3.5" ry="4.5" fill={bloomColor} />
                <ellipse cx="64" cy="30" rx="3.5" ry="4.5" fill={bloomColor} />
              </g>
            ) : resolved === 'fern' ? (
              <g>
                <path d="M60 28 C52 17 44 13 40 16 C45 23 52 27 60 28 Z" fill={bloomColor} />
                <path d="M60 28 C68 17 76 13 80 16 C75 23 68 27 60 28 Z" fill={accentColor} />
                <path d="M60 28 C55 13 60 7 60 7 C60 7 65 13 60 28 Z" fill={bloomColor} />
                <circle cx="60" cy="14" r="2.2" fill="#FFFDF9" />
              </g>
            ) : (
              <g>
                <circle cx="53" cy="23" r="7.5" fill={accentColor} />
                <circle cx="67" cy="23" r="7.5" fill={accentColor} />
                <circle cx="60" cy="17" r="7.5" fill={bloomColor} />
                <circle cx="56" cy="27" r="6.5" fill={bloomColor} />
                <circle cx="64" cy="27" r="6.5" fill={bloomColor} />
                <circle cx="60" cy="23" r="5" fill="#F2D0A9" />
                <circle cx="60" cy="23" r="2.2" fill="#800020" />
              </g>
            )}
          </motion.g>
        )}
      </svg>
    </div>
  );
}
