'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import type { MenuSection as MenuSectionType } from '@/data/menu';
import { ProductCard } from './product-card';
import { CourtDivider } from './court-divider';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

interface MenuSectionProps {
  section: MenuSectionType;
  index: number;
}

export function MenuSection({ section, index }: MenuSectionProps) {
  return (
    <section id={section.id} className="scroll-mt-24 mb-14">
      {index > 0 && <CourtDivider />}

      {/* Cabeçalho elegante da seção */}
      <div className="flex items-start gap-4 mb-8">
        {/* Emoji em destaque */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-g-green/10 border border-g-green/20">
          <span className="text-2xl" role="img" aria-hidden="true">
            {section.emoji}
          </span>
        </div>

        <div className="flex-1 pt-1">
          <h2 className="font-display text-2xl sm:text-3xl text-g-cream leading-tight">
            {section.title}
          </h2>
          {section.subtitle && (
            <p className="mt-1 text-sm text-g-muted font-body tracking-wide">
              {section.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Grid de Produtos */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-50px' }}
        variants={{
          show: { transition: { staggerChildren: 0.06 } },
        }}
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
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
