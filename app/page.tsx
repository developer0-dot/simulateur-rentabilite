'use client';

import { useMemo, useState } from 'react';

// French number formatter (no decimals)
const eur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(
    Number.isFinite(n) ? n : 0
  );

const URSSAF_RATE = 0.212;

// ✅ Replace this with your real Stripe Payment Link / Gumroad URL
const KIT_URL = 'https://tally.so/r/2E44Q9';

type Errors = {
  net?: string;
  days?: string;
  email?: string;
};

type Results = {
  tjm: number;
  gross: number;
  tax: number;
  gap: number; // daily gap (if current rate provided)
  loss: number; // annual loss (if current rate provided)
};

export default function Calculator() {
  const [netTarget, setNetTarget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [billableDays, setBillableDays] = useState('');
  const [currentRate, setCurrentRate] = useState('');

  const [errors, setErrors] = useState<Errors>({});
  const [results, setResults] = useState<Results | null>(null);

  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const monthlyNet = useMemo(() => Number(netTarget), [netTarget]);
  const monthlyExp = useMemo(() => (expenses === '' ? 0 : Number(expenses)), [expenses]);
  const daysPerMonth = useMemo(() => Number(billableDays), [billableDays]);
  const currentTJM = useMemo(() => (currentRate === '' ? 0 : Number(currentRate)), [currentRate]);

  const hasCurrent = currentTJM > 0;

  const annualNet = useMemo(() => (Number.isFinite(monthlyNet) ? monthlyNet * 12 : 0), [monthlyNet]);
  const annualExp = useMemo(() => (Number.isFinite(monthlyExp) ? monthlyExp * 12 : 0), [monthlyExp]);
  const annualDays = useMemo(() => (Number.isFinite(daysPerMonth) ? daysPerMonth * 12 : 0), [daysPerMonth]);

  const inputClass = (hasErr: boolean, withSuffixPadding = false) =>
    [
      'w-full border rounded-lg bg-gray-50 p-3',
      withSuffixPadding ? 'pr-10' : '',
      'focus:outline-none focus:ring-2',
      hasErr ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-200',
    ].join(' ');

  const validate = () => {
    const next: Errors = {};
    if (!Number.isFinite(monthlyNet) || monthlyNet <= 0) next.net = 'Revenu net invalide.';
    if (!Number.isFinite(daysPerMonth) || daysPerMonth <= 0) next.days = 'Jours facturables invalides.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const calculateTJM = () => {
    if (!validate()) return;

    const requiredAnnualGross = (annualNet + annualExp) / (1 - URSSAF_RATE);
    const requiredTJM = requiredAnnualGross / annualDays;
    const urssafTax = requiredAnnualGross * URSSAF_RATE;

    const dailyGap = hasCurrent ? requiredTJM - currentTJM : 0;
    const annualLoss = dailyGap > 0 ? dailyGap * annualDays : 0;

    setResults({
      tjm: requiredTJM,
      gross: requiredAnnualGross,
      tax: urssafTax,
      gap: dailyGap,
      loss: annualLoss,
    });
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const next: Errors = {};
    const normalized = email.trim();

    if (!normalized) next.email = 'Email requis.';
    if (normalized && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) next.email = 'Email invalide.';
    setErrors((prev) => ({ ...prev, ...next }));
    if (Object.keys(next).length) return;

    if (!results) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('https://formspree.io/f/xreajabj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalized,
          regime: 'micro_prestations_services',
          urssaf_rate: URSSAF_RATE,
          tjm_cible: eur(results.tjm),
          ca_annuel_requis: eur(results.gross),
          urssaf_estime: eur(results.tax),
          frais_annuels: eur(annualExp),
          net_annuel_cible: eur(annualNet),
          tjm_actuel: hasCurrent ? eur(currentTJM) : 'N/A',
          manque_annuel: results.loss > 0 ? eur(results.loss) : 'N/A',
        }),
      });

      if (!res.ok) throw new Error('Formspree error');

      setEmailSubmitted(true);
    } catch {
      alert("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecalculate = () => {
    setResults(null);
    setEmailSubmitted(false);
    setEmail('');
    setErrors({});
  };

  const fillExample = () => {
    setNetTarget('2500');
    setExpenses('300');
    setBillableDays('15');
    setCurrentRate('150');
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      {/* Clean header */}
      <div className="w-full h-24 bg-slate-900 border-b border-slate-800" />

      <div className="flex-grow flex items-start justify-center px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full relative -mt-12 z-10 mb-12">
          <h1 className="text-2xl font-extrabold text-center mb-2 text-gray-900 leading-tight">
            La plupart des freelances sous-facturent de 20 à 40%.
          </h1>

          <p className="text-center text-gray-500 mb-1 text-sm">
            Calculez votre TJM minimum pour ne pas travailler à perte.
          </p>

          <p className="text-center text-xs text-gray-400 mb-4 font-medium bg-gray-50 inline-block w-full py-2 rounded-md border border-gray-100">
            Micro-entreprise · Prestations de services · Estimation 2026
          </p>

          {!results && (
            <div className="flex items-center justify-center mb-6">
              <button type="button" onClick={fillExample} className="text-xs text-blue-600 hover:underline">
                Remplir un exemple
              </button>
            </div>
          )}

          {/* INPUTS */}
          {!results && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                calculateTJM();
              }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
                  Vos objectifs
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Revenu net mensuel visé <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        className={inputClass(!!errors.net, true)}
                        placeholder="2500"
                        value={netTarget}
                        onChange={(e) => setNetTarget(e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-gray-400 font-semibold">€</span>
                    </div>
                    {errors.net && <p className="text-xs text-red-600 mt-1">{errors.net}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1">Dépenses mensuelles (frais pro)</label>
                    <p className="text-xs text-gray-400 mb-2">Laissez vide si 0€.</p>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputClass(false, true)}
                        placeholder="300"
                        value={expenses}
                        onChange={(e) => setExpenses(e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-gray-400 font-semibold">€</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b pb-2">
                  Votre réalité
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Jours facturables par mois <span className="text-red-600">*</span>
                    </label>
                    <p className="text-xs text-gray-400 mb-2">
                      Excluez l&apos;admin, la prospection et les congés.
                    </p>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      className={inputClass(!!errors.days)}
                      placeholder="15"
                      value={billableDays}
                      onChange={(e) => setBillableDays(e.target.value)}
                    />
                    {errors.days && <p className="text-xs text-red-600 mt-1">{errors.days}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1 text-gray-700">
                      Votre TJM actuel (optionnel)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className={inputClass(false, true)}
                        placeholder="150"
                        value={currentRate}
                        onChange={(e) => setCurrentRate(e.target.value)}
                      />
                      <span className="absolute right-3 top-3 text-gray-400 font-semibold">€</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Ajoutez-le pour voir l’écart et le manque à gagner.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition shadow-md text-lg"
              >
                Voir mon vrai TJM
              </button>

              <p className="text-[11px] text-gray-400 leading-snug pt-2">
                Outil indicatif. Estimation basée sur le taux URSSAF 2026 pour micro-entreprise en prestations de
                services. Hors TVA, CFE, versement libératoire et autres cas particuliers.
              </p>
            </form>
          )}

          {/* RESULTS */}
          {results && !emailSubmitted && (
            <div className="space-y-6">
              <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
                <h2 className="text-red-600 font-bold uppercase tracking-wide text-sm mb-1">
                  Votre TJM minimum de rentabilité
                </h2>

                <p className="text-5xl font-extrabold text-red-700">
                  {eur(results.tjm)} € <span className="text-lg text-red-500 font-normal">/ jour</span>
                </p>

                <div className="mt-4 text-left">
                  {hasCurrent ? (
                    results.gap > 0 ? (
                      <div className="p-4 bg-red-100 rounded-lg text-red-900 text-sm font-medium">
                        Si vous facturez <strong>{eur(currentTJM)}€/jour</strong>, il vous manque environ{' '}
                        <strong>{eur(results.gap)}€ par jour</strong>.
                        <div className="mt-2 font-black">
                          Soit environ <span className="underline">{eur(results.loss)}€</span> par an.
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-100 rounded-lg text-emerald-900 text-sm font-medium">
                        Bonne nouvelle : à <strong>{eur(currentTJM)}€/jour</strong>, vous êtes{' '}
                        <strong>au-dessus</strong> de votre minimum de rentabilité (selon cette estimation).
                      </div>
                    )
                  ) : (
                    <div className="p-4 bg-gray-100 rounded-lg text-gray-800 text-sm font-medium">
                      Ajoutez votre <strong>TJM actuel</strong> pour voir l’écart et le manque à gagner.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">CA annuel requis</span>
                  <strong className="text-gray-900">{eur(results.gross)} €</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">URSSAF estimé ({eur(URSSAF_RATE * 100)}%)</span>
                  <strong className="text-gray-900">- {eur(results.tax)} €</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Frais pro (annuel)</span>
                  <strong className="text-gray-900">- {eur(annualExp)} €</strong>
                </div>
                <div className="flex justify-between py-1 border-t mt-2 pt-2">
                  <span className="text-gray-700">Net cible (annuel)</span>
                  <strong className="text-gray-900">{eur(annualNet)} €</strong>
                </div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">Recevoir ce bilan par email</label>
                  <p className="text-xs text-gray-500 mb-2">
                    + 1 astuce concrète pour augmenter votre TJM sans perdre vos clients.
                  </p>

                  <input
                    type="email"
                    className={inputClass(!!errors.email)}
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  <p className="text-[11px] text-gray-400 mt-2">Pas de spam. 1 email utile.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full font-bold py-3 rounded-lg transition ${
                    isSubmitting
                      ? 'bg-gray-300 cursor-not-allowed text-gray-700'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isSubmitting ? 'Envoi...' : 'Recevoir mon bilan'}
                </button>

                <button
                  type="button"
                  onClick={handleRecalculate}
                  className="w-full text-sm font-semibold py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Recalculer
                </button>
              </form>
            </div>
          )}

          {/* THANK YOU + ✅ SOFT KIT INVITATION */}
          {results && emailSubmitted && (
            <div className="space-y-5">
              <div className="bg-emerald-50 p-6 rounded-lg border border-emerald-100 text-center">
                <h2 className="text-emerald-700 font-extrabold text-xl">C’est envoyé.</h2>
                <p className="text-emerald-900 mt-2 text-sm">
                  Vous recevrez votre bilan à <strong>{email.trim()}</strong>.
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg border border-gray-200 text-sm">
                <div className="font-semibold text-gray-900 mb-1">Un tip immédiat (à utiliser aujourd’hui)</div>
                <p className="text-gray-600 leading-relaxed">
                  Quand un client résiste à un tarif, évitez de “justifier” votre prix. Cadrez plutôt en termes de{' '}
                  <strong>capacité</strong> : “À ce tarif-là, je ne peux pas garantir la qualité / la disponibilité.”
                  Puis proposez une alternative (moins de fréquence, moins de périmètre) au lieu de baisser le prix.
                </p>
              </div>

              {/* ✅ Soft kit block (no hype, no urgency) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                <div className="font-semibold text-gray-900">
                  Besoin d’augmenter votre TJM sans perdre vos clients ?
                </div>
                <p className="text-gray-600 mt-1">
                  Pack prêt à l’emploi : scripts d’augmentation + modèle de devis + structure de présentation — <strong>29€</strong>.
                </p>

                <a
                  href={KIT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-800 transition"
                >
                  Voir le Kit (29€)
                </a>

                <p className="text-[11px] text-gray-400 mt-2">
                  Optionnel. Pas de pression — juste un raccourci si vous devez agir vite.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRecalculate}
                className="w-full text-sm font-semibold py-3 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Refaire un calcul
              </button>

              <p className="text-[11px] text-gray-400 leading-snug">
                Outil indicatif. Estimation basée sur le taux URSSAF 2026 pour micro-entreprise en prestations de
                services. Hors TVA, CFE, versement libératoire et autres cas particuliers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
