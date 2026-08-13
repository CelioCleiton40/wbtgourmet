'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuSection } from '@/data/menu';

interface MenuNavProps {
  sections: MenuSection[];
}

function isSectionAvailable(section: MenuSection): boolean {
  const today = new Date().getDay();
  return section.items.some(
    (item) => !item.availability || item.availability.days.includes(today)
  );
}

export function MenuNav({ sections }: MenuNavProps) {
  const [activeSection, setActiveSection] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const availableSections = sections.filter(isSectionAvailable);

  /* Intersection Observer para destacar categoria ativa */
  useEffect(() => {
    if (!availableSections.length) return;

    const elements = availableSections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [availableSections]);

  /* Auto-scroll do chip ativo para o centro */
  useEffect(() => {
    if (!activeSection || !scrollRef.current) return;
    const chip = scrollRef.current.querySelector<HTMLElement>(
      `[data-section="${activeSection}"]`
    );
    if (chip) {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  return (
    <nav
      aria-label="Categorias do cardápio"
      className="sticky top-0 z-30 border-b border-g-line bg-g-dark/90 backdrop-blur-lg supports-[backdrop-filter]:bg-g-dark/75"
    >
      {/* Linha verde superior — assinatura de marca */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-g-green to-transparent opacity-40" />

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2.5"
      >
        {availableSections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              data-section={section.id}
              aria-current={isActive ? 'true' : undefined}
              onClick={() => scrollToSection(section.id)}
              className={[
                'relative shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5',
                'font-body text-[11px] font-semibold tracking-wide uppercase',
                'transition-all duration-200',
                'focus-visible:outline-2 focus-visible:outline-g-green focus-visible:outline-offset-2',
                'active:scale-[0.97]',
                isActive
                  ? 'border-g-green bg-g-green text-g-dark shadow-[0_2px_12px_rgba(75,166,70,0.4)]'
                  : 'border-g-line bg-g-surface text-g-muted hover:border-g-green/50 hover:text-g-cream',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-sm">{section.emoji}</span>
              <span>{section.title.split(' ')[0]}</span>

              {/* Indicador animado da categoria ativa */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-[13px] left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-g-green"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}