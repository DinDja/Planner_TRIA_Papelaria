'use client'

import Image from 'next/image'

type InfiniteBookProps = {
  ready?: boolean
}

export function InfiniteBook({ ready = true }: InfiniteBookProps) {
  return (
    <div
      role="img"
      aria-label="Mockup do planner"
      className="h-full w-full"
      style={{
        opacity: ready ? 1 : 0,
        filter: ready ? 'blur(0px)' : 'blur(18px)',
        transform: ready ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.92)',
        transition:
          'opacity 1.1s cubic-bezier(0.16,1,0.3,1) 180ms, filter 1.1s cubic-bezier(0.16,1,0.3,1) 180ms, transform 1.1s cubic-bezier(0.16,1,0.3,1) 180ms',
      }}
    >
      <Image
        src="/Mockup.png"
        alt="Mockup do planner"
        fill
        priority
        sizes="(max-width: 640px) 92vw, (max-width: 1024px) 70vw, 54vw"
        className="object-contain"
      />
    </div>
  )
}
