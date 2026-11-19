import { AnimatePresence, motion } from 'motion/react';
import type { HabitKey } from '../types';

interface HabitGardenPlantProps {
  habitKey: HabitKey;
  progressPct: number;
  waterTick?: number;
}

const SPECIES_META: Record<
  HabitKey,
  { species: string; bloomColor: string; accentColor: string }
> = {
  water: {
    species: 'River Fern',
    bloomColor: '#3E6B5C',
    accentColor: '#78A692',
  },
  exercise: {
    species: 'Sun Olive',
    bloomColor: '#A85243',
    accentColor: '#D68C7C',
  },
  studying: {
    species: 'Burgundy Camellia',
    bloomColor: '#800020',
    accentColor: '#C46C7E',
  },
  reading: {
    species: 'Blush Peony',
    bloomColor: '#A14D63',
    accentColor: '#DF9EAA',
  },
  english: {
    species: 'Garden Lavender',
    bloomColor: '#7A5476',
    accentColor: '#B592B1',
  },
};

export function getPlantSpecies(habitKey: HabitKey): string {
  return SPECIES_META[habitKey].species;
}

export function getGrowthStageLabel(progressPct: number): string {
  if (progressPct >= 100) return 'In full bloom';
  if (progressPct >= 50) return 'Budding stem';
  if (progressPct > 0) return 'Young sprout';
  return 'Cozy seed';
}

export function HabitGardenPlant({
  habitKey,
  progressPct,
  waterTick = 0,
}: HabitGardenPlantProps) {
  const { bloomColor, accentColor } = SPECIES_META[habitKey];
  const stage =
    progressPct >= 100 ? 3 : progressPct >= 50 ? 2 : progressPct > 0 ? 1 : 0;

  return (
    <div className="relative flex items-center justify-center h-28 w-full select-none overflow-visible">
      <svg
        viewBox="0 0 120 112"
        className="w-28 h-28 overflow-visible"
        aria-hidden="true"
      >
        {/* Soft blush halo behind blooming plant */}
        {stage === 3 && (
          <motion.circle
            cx="60"
            cy="42"
            r="34"
            fill="#F4E3E6"
            opacity="0.55"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.55 }}
            transition={{ duration: 0.45 }}
          />
        )}

        {/* Ground shadow */}
        <ellipse cx="60" cy="103" rx="28" ry="4" fill="#E6DDD0" />

        {/* Cozy Clay Pot with Happy Bounce on Watering */}
        <motion.g
          key={`pot-${waterTick}`}
          initial={waterTick > 0 ? { scale: 0.94, y: 2 } : false}
          animate={{ scale: 1, y: 0 }}
          style={{ transformOrigin: '60px 92px' }}
          transition={{ type: 'spring', stiffness: 320, damping: 18 }}
        >
          <path
            d="M40 78 H80 L74 101 C73.5 102.5 72 103 70 103 H50 C48 103 46.5 102.5 46 101 Z"
            fill="#CEA993"
          />
          <rect x="37" y="73" width="46" height="7" rx="3.5" fill="#BA9078" />
          {/* Soil */}
          <ellipse cx="60" cy="74" rx="18" ry="3.5" fill="#5C4A3E" />

          {/* Cute Cozy Pot Face */}
          <ellipse cx="50" cy="91" rx="2.6" ry="1.5" fill="#D98A8C" opacity="0.55" />
          <ellipse cx="70" cy="91" rx="2.6" ry="1.5" fill="#D98A8C" opacity="0.55" />

          {stage === 0 ? (
            /* Peaceful sleepy eyes when resting as a seed */
            <g stroke="#5C4236" strokeWidth="1.3" strokeLinecap="round" fill="none">
              <path d="M51 89 Q53 91 55 89" />
              <path d="M65 89 Q67 91 69 89" />
              <path d="M58 92 Q60 93.5 62 92" />
            </g>
          ) : stage === 3 ? (
            /* Joyful crescent eyes + big smile in full bloom */
            <g stroke="#5C4236" strokeWidth="1.4" strokeLinecap="round" fill="none">
              <path d="M51 89 Q53 86.8 55 89" />
              <path d="M65 89 Q67 86.8 69 89" />
              <path d="M56.5 92 Q60 95.5 63.5 92" />
            </g>
          ) : (
            /* Cozy bright eyes + gentle smile while growing */
            <g>
              <circle cx="53" cy="88.5" r="1.4" fill="#5C4236" />
              <circle cx="67" cy="88.5" r="1.4" fill="#5C4236" />
              <path
                d="M57.5 92 Q60 94.5 62.5 92"
                stroke="#5C4236"
                strokeWidth="1.3"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          )}
        </motion.g>

        {/* Stage 0: Cozy Seed nestled in soil */}
        {stage === 0 && (
          <motion.g
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
          >
            <ellipse cx="60" cy="72" rx="4.5" ry="3" fill="#8C6D56" />
            <path
              d="M60 69 C60 66 62 64 64 64"
              stroke="#6B8E6E"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
        )}

        {/* Swaying Plant Stem & Leaves (Stages 1-3) */}
        {stage >= 1 && (
          <motion.g
            animate={
              stage >= 2
                ? { rotate: [-1.4, 1.4, -1.4] }
                : { rotate: [-0.8, 0.8, -0.8] }
            }
            transition={{
              repeat: Infinity,
              duration: 4.6,
              ease: 'easeInOut',
            }}
            style={{ transformOrigin: '60px 74px' }}
          >
            {/* Stage 1: Tender Young Sprout */}
            <motion.g
              initial={{ scaleY: 0.35, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              style={{ transformOrigin: '60px 74px' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <path
                d={
                  stage === 1
                    ? 'M60 74 Q60 61 60 54'
                    : stage === 2
                      ? 'M60 74 Q58 54 60 36'
                      : 'M60 74 Q57 50 60 28'
                }
                stroke="#4A6B53"
                strokeWidth="2.4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M60 62 C52 61 46 56 47 50 C53 50 58 55 60 62 Z"
                fill="#63846B"
              />
              <path
                d="M60 60 C68 59 74 54 73 48 C67 48 62 53 60 60 Z"
                fill="#52735B"
              />
            </motion.g>

            {/* Stage 2+: Upper leaves & budding stem */}
            {stage >= 2 && (
              <motion.g
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ transformOrigin: '60px 50px' }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <path
                  d="M59 48 C50 45 43 38 45 32 C52 33 58 39 59 48 Z"
                  fill="#557A5E"
                />
                <path
                  d="M60 44 C69 41 75 34 73 28 C66 29 61 36 60 44 Z"
                  fill="#6B9074"
                />
                {stage === 2 && (
                  <ellipse cx="60" cy="33" rx="5.5" ry="7.5" fill={accentColor} />
                )}
              </motion.g>
            )}

            {/* Stage 3: Full Botanical Bloom */}
            {stage === 3 && (
              <motion.g
                initial={{ scale: 0.45, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ transformOrigin: '60px 25px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                {habitKey === 'english' ? (
                  <g>
                    <ellipse cx="60" cy="18" rx="4.5" ry="7" fill={bloomColor} />
                    <ellipse cx="54" cy="24" rx="4" ry="5.5" fill={accentColor} />
                    <ellipse cx="66" cy="24" rx="4" ry="5.5" fill={accentColor} />
                    <ellipse cx="56" cy="30" rx="3.5" ry="4.5" fill={bloomColor} />
                    <ellipse cx="64" cy="30" rx="3.5" ry="4.5" fill={bloomColor} />
                  </g>
                ) : habitKey === 'water' ? (
                  <g>
                    <path
                      d="M60 28 C52 17 44 13 40 16 C45 23 52 27 60 28 Z"
                      fill={bloomColor}
                    />
                    <path
                      d="M60 28 C68 17 76 13 80 16 C75 23 68 27 60 28 Z"
                      fill={accentColor}
                    />
                    <path
                      d="M60 28 C55 13 60 7 60 7 C60 7 65 13 60 28 Z"
                      fill={bloomColor}
                    />
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

                <path
                  d="M36 18 L37.2 21 L40 22.2 L37.2 23.4 L36 26.4 L34.8 23.4 L32 22.2 L34.8 21 Z"
                  fill={accentColor}
                  opacity="0.75"
                />
                <path
                  d="M84 14 L85 16.5 L87.5 17.5 L85 18.5 L84 21 L83 18.5 L80.5 17.5 L83 16.5 Z"
                  fill={bloomColor}
                  opacity="0.7"
                />
              </motion.g>
            )}
          </motion.g>
        )}

        {/* Cute Water Droplets Splash on Tap */}
        <AnimatePresence>
          {waterTick > 0 && (
            <motion.g
              key={`drops-${waterTick}`}
              initial={{ opacity: 0.95, y: -12 }}
              animate={{ opacity: 0, y: 18 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            >
              <path
                d="M46 42 C46 42 43 46.5 43 48.2 C43 49.8 44.3 51 46 51 C47.7 51 49 49.8 49 48.2 C49 46.5 46 42 46 42 Z"
                fill="#7AA6B8"
              />
              <path
                d="M60 35 C60 35 57.5 39 57.5 40.5 C57.5 41.9 58.6 43 60 43 C61.4 43 62.5 41.9 62.5 40.5 C62.5 39 60 35 60 35 Z"
                fill="#7AA6B8"
              />
              <path
                d="M74 44 C74 44 71.5 48 71.5 49.5 C71.5 50.9 72.6 52 74 52 C75.4 52 76.5 50.9 76.5 49.5 C76.5 48 74 44 74 44 Z"
                fill="#7AA6B8"
              />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
    </div>
  );
}
