'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { MenuSection as MenuSectionType } from '@/data/menu';
import { ProductCard } from './product-card';
import { CourtDivider } from './court-divider';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

interface MenuSectionProps {
  section: MenuSectionType;
  index: number;
}

export function MenuSection({ section, index }: MenuSectionProps) {
  return (
    <section id={section.id} style={{ scrollMarginTop: '96px' }}>
      {index > 0 && <CourtDivider />}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '28px' }} role="img" aria-hidden>
          {section.emoji}
        </span>
        <div>
          <h2
            style={{
              fontFamily: 'var(--font-anton), sans-serif',
              fontSize: '24px',
              textTransform: 'uppercase',
              color: '#F5F1E6',
              lineHeight: 1,
            }}
          >
            {section.title}
          </h2>
          {section.subtitle && (
            <p
              style={{
                marginTop: '4px',
                fontSize: '11px',
                color: '#93A19E',
                letterSpacing: '0.02em',
              }}
            >
              {section.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Grid de produtos */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={{
          show: { transition: { staggerChildren: 0.07 } },
        }}
        style={{
          marginTop: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
        }}
      >
        {section.items.map((item) => (
          <motion.div key={item.id} variants={fadeUp}>
            <ProductCard item={item} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
