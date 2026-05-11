'use client'
import Link from 'next/link'

const features = [
  { icon: '🏦', title: 'Open Finance integrado', desc: 'Conecte todos os seus bancos e cartões de forma segura. Lançamentos aparecem automaticamente.' },
  { icon: '🤖', title: 'Assistente com IA', desc: 'Converse com sua IA financeira pelo WhatsApp. Pergunte quanto gastou, peça insights em linguagem natural.' },
  { icon: '🎯', title: 'Metas financeiras', desc: 'Defina objetivos e acompanhe o progresso com visualizações claras e motivadoras.' },
  { icon: '📊', title: 'Dashboard inteligente', desc: 'Visão completa: entradas, saídas, categorias, tendências e comparativos mês a mês.' },
  { icon: '💸', title: 'Controle de investimentos', desc: 'Acompanhe sua carteira de renda fixa, fundos e ações com rentabilidade e diversificação.' },
  { icon: '🔔', title: 'Alertas inteligentes', desc: 'Seja avisado sobre gastos acima do padrão, contas chegando ao limite ou oportunidades de economia.' },
]

const plans = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    desc: 'Para começar a organizar sua vida financeira',
    features: ['1 banco conectado', 'Dashboard básico', 'Histórico de 3 meses', 'Categorização automática', '5 perguntas/dia no WhatsApp'],
    cta: 'Criar conta grátis',
    featured: false,
  },
  {
    name: 'Pro',
    price: 'R$ 9,90',
    desc: 'Para quem quer controle total e insights avançados',
    features: ['Bancos ilimitados', 'Dashboard completo + IA', 'Histórico ilimitado', 'WhatsApp ilimitado', 'Controle de investimentos', 'Metas e orçamentos', 'Relatórios exportáveis'],
    cta: 'Começar período grátis',
    featured: true,
  },
  {
    name: 'Família',
    price: 'R$ 19,90',
    desc: 'Até 4 pessoas com finanças unificadas ou separadas',
    features: ['Tudo do plano Pro', 'Até 4 usuários', 'Visão consolidada da família', 'Despesas compartilhadas', 'Prioridade no suporte'],
    cta: 'Assinar família',
    featured: false,
  },
]

const steps = [
  { n: '1', title: 'Crie sua conta', desc: 'Cadastro em menos de 2 minutos. Sem burocracia.' },
  { n: '2', title: 'Conecte seus bancos', desc: 'Open Finance certificado pelo Banco Central.' },
  { n: '3', title: 'Deixa a IA trabalhar', desc: 'Categorização automática e insights em tempo real.' },
  { n: '4', title: 'Converse no WhatsApp', desc: 'Pergunte sobre suas finanças a qualquer hora.' },
]

export default function Home() {
  return (
    <div style={{ background: 'var(--white)' }}>
      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1.1rem 5%', background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)',
      }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: '1.35rem', color: 'var(--green)' }}>
          Fin<span style={{ color: 'var(--ink)' }}>Zen</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="#features" style={{ color: 'var(--ink-soft)', textDecoration: 'none', fontSize: '0.9rem' }}>Funcionalidades</a>
          <a href="#como" style={{ color: 'var(--ink-soft)', textDecoration: 'none', fontSize: '0.9rem' }}>Como funciona</a>
          <a href="#precos" style={{ color: 'var(--ink-soft)', textDecoration: 'none', fontSize: '0.9rem' }}>Preços</a>
          <Link href="/login" style={{
            background: 'var(--green)', color: '#fff', padding: '0.55rem 1.3rem',
            borderRadius: '100px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500,
          }}>Entrar</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '8rem 5% 4rem', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: 'var(--green-pale)', color: 'var(--green)', fontSize: '0.82rem',
          fontWeight: 500, padding: '0.4rem 1rem', borderRadius: '100px', marginBottom: '2rem',
          border: '1px solid rgba(29,158,117,0.2)',
        }}>
          ✦ Open Finance + IA + WhatsApp
        </div>
        <h1 className="font-display" style={{
          fontSize: 'clamp(2.8rem,6vw,5rem)', fontWeight: 800, lineHeight: 1.05,
          letterSpacing: '-2px', marginBottom: '1.5rem', maxWidth: '820px',
        }}>
          Seu dinheiro,{' '}
          <em style={{ fontStyle: 'normal', color: 'var(--green-light)' }}>no automático.</em>
        </h1>
        <p style={{
          fontSize: 'clamp(1rem,2vw,1.2rem)', color: 'var(--ink-soft)', maxWidth: '540px',
          lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300,
        }}>
          Controle gastos, investimentos e metas financeiras com inteligência artificial —
          direto pelo WhatsApp ou na web, sem planilhas.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/login" style={{
            background: 'var(--green)', color: '#fff', padding: '0.85rem 2rem',
            borderRadius: '100px', textDecoration: 'none', fontWeight: 500, fontSize: '1rem',
          }}>
            Criar conta gratuita →
          </Link>
          <a href="#como" style={{
            background: 'transparent', color: 'var(--ink)', padding: '0.85rem 2rem',
            borderRadius: '100px', textDecoration: 'none', fontWeight: 400, fontSize: '1rem',
            border: '1.5px solid var(--border)',
          }}>
            Ver como funciona
          </a>
        </div>
        <p style={{ marginTop: '1.2rem', fontSize: '0.82rem', color: 'var(--ink-soft)' }}>
          Grátis por 14 dias · Sem cartão de crédito · Cancele quando quiser
        </p>
      </section>

      {/* SOCIAL PROOF */}
      <div style={{
        padding: '2rem 5%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '3rem', flexWrap: 'wrap', borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        {[
          { n: '1.500+', l: 'usuários ativos' },
          { n: 'R$ 4,2M', l: 'em gastos monitorados' },
          { n: '98%', l: 'satisfação' },
          { n: 'Open Finance', l: 'certificado pelo BCB' },
        ].map((item) => (
          <div key={item.l} style={{ textAlign: 'center' }}>
            <strong className="font-display" style={{ display: 'block', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-1px' }}>{item.n}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{item.l}</span>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section id="features" style={{ padding: '6rem 5%' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.8rem' }}>
          Funcionalidades
        </p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, letterSpacing: '-1px', marginBottom: '1rem' }}>
          Tudo que você precisa, num só lugar
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '1.05rem', maxWidth: '500px', fontWeight: 300, lineHeight: 1.7, marginBottom: '3.5rem' }}>
          Automatize o trabalho chato e foque no que importa.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: 'var(--surface)', borderRadius: '20px', padding: '2rem',
              border: '1px solid var(--border)', transition: 'all .3s',
            }}>
              <div style={{
                width: 48, height: 48, background: 'var(--green-pale)', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', marginBottom: '1.2rem',
              }}>{f.icon}</div>
              <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.6rem' }}>{f.title}</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.9rem', lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como" style={{ padding: '6rem 5%', background: 'var(--surface)' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>Como funciona</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, letterSpacing: '-1px', textAlign: 'center', margin: '0.8rem auto 3.5rem' }}>
          Três passos para o controle total
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '2rem' }}>
          {steps.map((s) => (
            <div key={s.n} style={{ textAlign: 'center' }}>
              <div className="font-display" style={{
                width: 56, height: 56, background: 'var(--green)', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 700, margin: '0 auto 1.2rem',
              }}>{s.n}</div>
              <h4 className="font-display" style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{s.title}</h4>
              <p style={{ fontSize: '0.87rem', color: 'var(--ink-soft)', fontWeight: 300, lineHeight: 1.6 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="precos" style={{ padding: '6rem 5%', textAlign: 'center', background: 'var(--surface)' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '2px' }}>Planos</p>
        <h2 className="font-display" style={{ fontSize: 'clamp(1.8rem,4vw,3rem)', fontWeight: 700, letterSpacing: '-1px', margin: '0.8rem 0 0.5rem' }}>
          Simples, sem surpresas
        </h2>
        <p style={{ color: 'var(--ink-soft)', fontSize: '1rem', fontWeight: 300, maxWidth: '480px', margin: '0 auto 3.5rem' }}>
          Comece grátis. Faça upgrade quando precisar de mais.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>
          {plans.map((p) => (
            <div key={p.name} style={{
              background: 'var(--white)', borderRadius: '24px', padding: '2.2rem',
              border: p.featured ? '2px solid var(--green)' : '1px solid var(--border)',
              textAlign: 'left', position: 'relative',
            }}>
              {p.featured && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'var(--green)', color: '#fff', fontSize: '0.75rem',
                  fontWeight: 500, padding: '0.3rem 1rem', borderRadius: '100px', whiteSpace: 'nowrap',
                }}>Mais popular</div>
              )}
              <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.8rem' }}>
                {p.name}
              </p>
              <div className="font-display" style={{ fontSize: '2.6rem', fontWeight: 800, letterSpacing: '-2px', marginBottom: '0.3rem' }}>
                {p.price}<sub style={{ fontSize: '1rem', fontWeight: 400, letterSpacing: 0, color: 'var(--ink-soft)' }}>/mês</sub>
              </div>
              <p style={{ color: 'var(--ink-soft)', fontSize: '0.87rem', marginBottom: '1.5rem', fontWeight: 300 }}>{p.desc}</p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '2rem' }}>
                {p.features.map((feat) => (
                  <li key={feat} style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--green-light)', fontWeight: 700 }}>✓</span> {feat}
                  </li>
                ))}
              </ul>
              <Link href="/login" style={{
                display: 'block', textAlign: 'center', padding: '0.85rem', borderRadius: '100px',
                textDecoration: 'none', fontWeight: 500, fontSize: '0.95rem',
                background: p.featured ? 'var(--green)' : 'transparent',
                color: p.featured ? '#fff' : 'var(--ink)',
                border: p.featured ? 'none' : '1.5px solid var(--border)',
              }}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '3rem 5%', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
      }}>
        <div className="font-display" style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--green)' }}>FinZen</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)' }}>© 2025 FinZen · Todos os direitos reservados</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacidade', 'Termos', 'Contato'].map((l) => (
            <a key={l} href="#" style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', textDecoration: 'none' }}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
