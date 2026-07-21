'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

const FLOATING_ITEMS = [
  { emoji: '🌸', x: '12%', y: '18%', size: 32, delay: 0, rotate: -12 },
  { emoji: '✨', x: '78%', y: '12%', size: 26, delay: 0.5, rotate: 15 },
  { emoji: '🌷', x: '85%', y: '55%', size: 30, delay: 1.0, rotate: -8 },
  { emoji: '📒', x: '8%', y: '65%', size: 28, delay: 1.5, rotate: 10 },
  { emoji: '🦋', x: '70%', y: '80%', size: 24, delay: 0.8, rotate: -20 },
  { emoji: '💛', x: '22%', y: '85%', size: 22, delay: 1.2, rotate: 5 },
  { emoji: '🌿', x: '55%', y: '20%', size: 26, delay: 0.3, rotate: -15 },
  { emoji: '📌', x: '40%', y: '75%', size: 22, delay: 1.8, rotate: 25 },
]

const DOODLE_PATHS = [
  // Spiral
  'M20 50 Q30 30 50 30 Q70 30 70 50 Q70 70 50 70 Q35 70 30 58',
  // Wavy line
  'M10 50 Q25 30 40 50 Q55 70 70 50 Q85 30 100 50',
  // Zigzag
  'M10 60 L25 30 L40 60 L55 30 L70 60 L85 30',
]

export function AuthDecorativePanel() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-accent/40 via-background to-primary/5">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid-bg opacity-40" />

      {/* Paper grain texture */}
      <div className="absolute inset-0 paper-grain opacity-[0.03]" />

      {/* Soft radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--primary)_0%,_transparent_65%)] opacity-[0.06]" />

      {/* Floating decorative items */}
      {FLOATING_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          className="absolute select-none pointer-events-none"
          style={{ left: item.x, top: item.y, fontSize: item.size }}
          initial={{ opacity: 0, scale: 0.5, rotate: item.rotate - 20 }}
          animate={{
            opacity: [0, 0.8, 0.8, 0],
            scale: [0.5, 1, 1, 0.5],
            y: [0, -12, -12, 0],
            rotate: [item.rotate - 10, item.rotate, item.rotate, item.rotate - 10],
          }}
          transition={{
            duration: 6,
            delay: item.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Hand-drawn doodle SVGs */}
      <svg
        className="absolute left-[15%] top-[30%] opacity-[0.12]"
        width="120"
        height="100"
        viewBox="0 0 120 100"
      >
        <motion.path
          d={DOODLE_PATHS[0]}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, delay: 0.5, ease: 'easeInOut' }}
        />
      </svg>

      <svg
        className="absolute right-[10%] top-[60%] opacity-[0.1]"
        width="140"
        height="60"
        viewBox="0 0 140 60"
      >
        <motion.path
          d={DOODLE_PATHS[1]}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, delay: 1.0, ease: 'easeInOut' }}
        />
      </svg>

      <svg
        className="absolute left-[60%] top-[15%] opacity-[0.08]"
        width="120"
        height="80"
        viewBox="0 0 120 80"
      >
        <motion.path
          d={DOODLE_PATHS[2]}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1.5, ease: 'easeInOut' }}
        />
      </svg>

      {/* Decorative circles */}
      <div className="absolute right-[20%] top-[25%] size-20 rounded-full border-2 border-dashed border-primary/10" />
      <div className="absolute bottom-[20%] left-[18%] size-14 rounded-full border-2 border-primary/8" />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-8 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Image
            src="/logo.svg"
            alt="PlannerHub"
            width={200}
            height={115}
            className="opacity-90"
            priority
          />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="space-y-2"
        >
          <p className="font-hand text-2xl text-foreground/70 leading-relaxed">
            Organize sua vida com{' '}
            <span className="text-primary font-semibold">beleza</span>
          </p>
          <p className="text-sm text-muted-foreground/60 max-w-[280px]">
            Seu planner digital favorito. Escrita à mão, stickers e templates premium.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-2 mt-2"
        >
          {['Canvas infinito', 'Stickers fofos', 'Templates prontos'].map(
            (feature) => (
              <span
                key={feature}
                className="inline-flex items-center gap-1 rounded-full bg-primary/8 border border-primary/10 px-3 py-1 text-xs font-medium text-primary/80"
              >
                {feature}
              </span>
            ),
          )}
        </motion.div>
      </div>
    </div>
  )
}
