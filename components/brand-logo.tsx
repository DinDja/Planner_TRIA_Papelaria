import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  imageClassName?: string
  alt?: string
}

/** Logo TRIA enquadrada visualmente para compensar o respiro transparente do PNG. */
export function BrandLogo({
  className,
  imageClassName,
  alt = 'TRIA Projeto',
}: BrandLogoProps) {
  return (
    <span className={cn('relative block shrink-0 overflow-hidden', className)}>
      <img
        src="/triaprojeto.png"
        alt={alt}
        className={cn(
          'absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-[55%] w-[280px]',
          imageClassName,
        )}
      />
    </span>
  )
}
