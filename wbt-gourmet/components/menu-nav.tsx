'use client';

import { useMemo } from 'react';
import { menu } from '@/data/menu';
import type { MenuSection } from '@/data/menu';

interface MenuNavProps {
  sections: MenuSection[];
}

export function MenuNav({ sections }: MenuNavProps) {
  const availableSections = useMemo(() => {
    return sections.filter((s) =>
      s.items.some(
        (item) =>
          !item.availability ||
          item.availability.days.includes(new Date().getDay())
      )
    );
  }, [sections]);

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'rgba(18, 22, 27, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(239,230,208,0.06)',
        padding: '8px 16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="no-scrollbar"
      >
        {availableSections.map((section) => (
          <button
            key={section.id}
            id={`nav-${section.id}`}
            onClick={() => scrollTo(section.id)}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'rgba(239,230,208,0.06)',
              border: '1px solid rgba(239,230,208,0.08)',
              color: '#93A19E',
              fontFamily: 'var(--font-anton), sans-serif',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#D4F13A';
              e.currentTarget.style.color = '#12161B';
              e.currentTarget.style.border = 'none';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,230,208,0.06)';
              e.currentTarget.style.color = '#93A19E';
              e.currentTarget.style.border = '1px solid rgba(239,230,208,0.08)';
            }}
          >
            {section.emoji} {section.title.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
