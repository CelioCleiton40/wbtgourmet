'use client';

import { useEffect, useState } from 'react';
import type { MenuSection } from '@/data/menu';

interface MenuNavProps {
  sections: MenuSection[];
}

function isSectionAvailable(section: MenuSection): boolean {
  const today = new Date().getDay();

  return section.items.some(
    (item) =>
      !item.availability ||
      item.availability.days.includes(today),
  );
}

export function MenuNav({ sections }: MenuNavProps) {
  const [activeSection, setActiveSection] = useState<string>('');

  const availableSections = sections.filter(isSectionAvailable);

  useEffect(() => {
    if (!availableSections.length) return;

    const elements = availableSections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top -
              b.boundingClientRect.top,
          );

        if (visible[0]?.target.id) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        rootMargin: '-120px 0px -60% 0px',
        threshold: 0,
      },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [availableSections]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    setActiveSection(id);
  };

  return (
    <nav
      aria-label="Categorias do cardápio"
      className="
        sticky top-0 z-30
        border-b border-sand/[0.06]
        bg-court-night/92
        px-4 py-2
        backdrop-blur-md
        supports-[backdrop-filter]:bg-court-night/75
      "
    >
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
        {availableSections.map((section) => {
          const isActive = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => scrollToSection(section.id)}
              className={`
                shrink-0
                whitespace-nowrap
                rounded-full
                border
                px-3.5 py-1.5
                font-display
                text-[11px]
                uppercase
                tracking-[0.06em]
                transition-all
                duration-150
                focus-visible:outline-2
                focus-visible:outline-ball
                focus-visible:outline-offset-2
                active:scale-[0.98]
                ${
                  isActive
                    ? 'border-ball bg-ball text-court-night'
                    : 'border-sand/[0.08] bg-sand/[0.06] text-ink-muted hover:border-ball hover:bg-ball hover:text-court-night'
                }
              `}
            >
              <span aria-hidden="true">
                {section.emoji}
              </span>{' '}
              {section.title.split(' ')[0]}
            </button>
          );
        })}
      </div>
    </nav>
  );
}