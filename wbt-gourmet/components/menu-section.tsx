'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { MenuSection as MenuSectionType } from '@/data/menu';
import { ProductCard } from './product-card';
import { CourtDivider } from './court-divider';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

interface MenuSectionProps {
  section: MenuSectionType;
  index: number;
}

export function MenuSection({ section, index }: MenuSectionProps) {
  return (
    <section id={section.id} className="scroll-mt-28 mb-12">
      {index > 0 && <CourtDivider />}

      {/* Cabeçalho de Seção com Assinatura Visual */}
      <div className="flex items-center gap-3 border-l-4 border-ball pl-4 py-1">
        <span className="text-3xl" role="img" aria-hidden="true">
          {section.emoji}
        </span>
        <div>
          <h2 className="font-display text-2xl sm:text-3xl uppercase tracking-wider text-ink">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-0.5 text-xs text-ink-muted tracking-wide">
              {section.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Grid de Produtos Responsivo */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-60px' }}
        variants={{
          show: { transition: { staggerChildren: 0.05 } },
        }}
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
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
