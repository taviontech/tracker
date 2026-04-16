'use client';
import { useRef, MouseEvent, ReactNode, CSSProperties } from 'react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  intensity?: number;
}

export default function TiltCard({ children, className = '', style, intensity = 7 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;

    el.style.transform = `perspective(900px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) translateZ(10px)`;
    el.style.boxShadow = `${-x * 20}px ${y * 16}px 50px rgba(59,130,246,0.12), 0 20px 60px rgba(0,0,0,0.3)`;

    if (glowRef.current) {
      glowRef.current.style.opacity = '1';
      glowRef.current.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(59,130,246,0.14) 0%, transparent 60%)`;
    }
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
    el.style.boxShadow = '';
    if (glowRef.current) glowRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none z-10 rounded-[inherit] transition-opacity duration-300"
        style={{ opacity: 0 }}
      />
      {children}
    </div>
  );
}
