import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | WBT Gourmet',
  description: 'Política de privacidade e proteção de dados (LGPD) do WBT Gourmet.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-dvh bg-court-night text-ink px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-ball hover:underline mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar ao Cardápio
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="h-8 w-8 text-ball" />
          <h1 className="font-display text-3xl sm:text-4xl uppercase tracking-wider text-ink">
            Política de Privacidade (LGPD)
          </h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-ink-muted border-t border-sand/10 pt-6">
          <p>
            No <strong className="text-ink">WBT Gourmet</strong> (WBT Arena - Mossoró/RN), levamos a privacidade e a segurança dos seus dados pessoais extremamente a sério, em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
          </p>

          <h2 className="font-display text-xl uppercase text-ink pt-2">
            1. Dados Coletados e Finalidade
          </h2>
          <p>
            Coletamos apenas os dados estritamente necessários para a execução e entrega do seu pedido de comida:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-ink">Número de WhatsApp / Telefone:</strong> para confirmar seu pedido, comunicar o status de envio e tirar dúvidas operacionais.</li>
            <li><strong className="text-ink">Itens do Carrinho:</strong> armazenados localmente no seu dispositivo (localStorage) para permitir a montagem do pedido sem perdas.</li>
          </ul>

          <h2 className="font-display text-xl uppercase text-ink pt-2">
            2. Compartilhamento de Dados
          </h2>
          <p>
            Seus dados nunca são vendidos ou repassados a terceiros para fins de marketing. O número de telefone e itens do pedido são processados de forma segura e criptografada via integradores de pagamento e mensagem (Stripe / WhatsApp).
          </p>

          <h2 className="font-display text-xl uppercase text-ink pt-2">
            3. Armazenamento e Exclusão
          </h2>
          <p>
            Seus dados são mantidos apenas pelo tempo necessário para completar a entrega e cumprir obrigações legais ou fiscais. Você pode solicitar a confirmação ou exclusão de seus dados a qualquer momento entrando em contato pelo nosso atendimento.
          </p>

          <h2 className="font-display text-xl uppercase text-ink pt-2">
            4. Contato do Encarregado de Dados
          </h2>
          <p>
            Dúvidas sobre a nossa política de privacidade podem ser encaminhadas diretamente para nossa equipe na WBT Arena, Mossoró-RN.
          </p>
        </div>
      </div>
    </main>
  );
}
