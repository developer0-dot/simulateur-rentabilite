'use client';

import { useState } from 'react';

export default function Calculator() {
  const [netTarget, setNetTarget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [billableDays, setBillableDays] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  
  const [results, setResults] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTJM = () => {
    const monthlyNet = parseFloat(netTarget);
    const monthlyExp = parseFloat(expenses) || 0;
    const days = parseFloat(billableDays);
    const currentTJM = parseFloat(currentRate) || 0;

    if (!monthlyNet || !days || monthlyNet <= 0 || days <= 0) {
      return alert('Veuillez entrer des montants supérieurs à 0.');
    }

    const annualNet = monthlyNet * 12;
    const annualExp = monthlyExp * 12;
    const annualDays = days * 12;

    const requiredAnnualGross = (annualNet + annualExp) / (1 - 0.212);
    const requiredTJM = requiredAnnualGross / annualDays;
    const urssafTax = requiredAnnualGross * 0.212;
    
    const dailyGap = currentTJM > 0 ? requiredTJM - currentTJM : 0;
    const annualLoss = dailyGap > 0 ? dailyGap * annualDays : 0;

    setResults({
      tjm: requiredTJM,
      gross: requiredAnnualGross,
      tax: urssafTax,
      gap: dailyGap,
      loss: annualLoss
    });
  };

  const handleEmailSubmit = async (e: any) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);

    try {
      await fetch('https://formspree.io/f/xreajabj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          tjm_cible: results.tjm.toFixed(0),
          manque_a_gagner: results.loss.toFixed(0)
        })
      });
      setEmailSubmitted(true);
    } catch (error) {
      alert("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setEmailSubmitted(false);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      
      {/* 🚨 THE PREMIUM COVER BANNER */}
      <div className="w-full h-48 relative overflow-hidden bg-blue-900">
        <img 
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Espace de travail premium" 
          className="w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </div>

      <div className="flex-grow flex items-start justify-center px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full relative -mt-16 z-10 mb-12">
          
          <h1 className="text-2xl font-bold text-center mb-2">Calculez votre TJM de rentabilité</h1>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Transformez votre objectif de revenu en TJM concret.
          </p>

          {!results && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Revenu net mensuel visé (€) *</label>
                <input type="number" required min="1" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="ex: 2500" value={netTarget} onChange={(e) => setNetTarget(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Frais pro mensuels (€) *</label>
                <input type="number" required min="0" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="ex: 300" value={expenses} onChange={(e) => setExpenses(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Jours facturables par mois *</label>
                <p className="text-xs text-gray-400 mb-1">Excluez l&apos;admin, la prospection et les congés.</p>
                <input type="number" required min="1" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="ex: 15" value={billableDays} onChange={(e) => setBillableDays(e.target.value)} />
              </div>

              <div className="pt-2 border-t">
                <label className="block text-sm font-semibold mb-1 text-gray-600">Votre TJM actuel (Optionnel)</label>
                <input type="number" min="0" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="ex: 150" value={currentRate} onChange={(e) => setCurrentRate(e.target.value)} />
              </div>

              <button onClick={calculateTJM} className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition mt-4 shadow-md">
                Calculer la réalité
              </button>
            </div>
          )}

          {results && !emailSubmitted && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-red-50 p-6 rounded-lg border border-red-100 text-center">
                <h2 className="text-red-600 font-bold uppercase tracking-wide text-sm mb-1">Votre TJM de Rentabilité</h2>
                <p className="text-5xl font-extrabold text-red-700">{results.tjm.toFixed(0)} € <span className="text-lg text-red-500 font-normal">/ jour</span></p>
                
                {results.gap > 0 && (
                  <div className="mt-4 p-3 bg-red-100 rounded text-red-900 text-sm font-semibold">
                    ⚠️ Écart estimé : {results.gap.toFixed(0)} € par jour. <br/>
                    <span className="font-black text-base">Soit un manque à gagner potentiel de {results.loss.toFixed(0)} € par an.</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleEmailSubmit} className="bg-gray-50 p-6 rounded-lg border">
                <h3 className="font-bold mb-2">Recevez votre bilan détaillé (Gratuit)</h3>
                <p className="text-sm text-gray-600 mb-4">Entrez votre email pour recevoir le détail de vos cotisations URSSAF (<strong>{results.tax.toFixed(0)} €/an</strong>) et 3 leviers concrets pour les optimiser.</p>
                <input 
                  type="email" 
                  required 
                  className="w-full border p-3 rounded-lg mb-3" 
                  placeholder="votre@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 shadow-md"
                >
                  {isSubmitting ? 'Envoi en cours...' : "M'envoyer le bilan détaillé"}
                </button>
              </form>
              
              <button onClick={handleReset} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 underline mt-2">
                Refaire le calcul
              </button>
            </div>
          )}

          {emailSubmitted && (
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-green-600 mb-2">Bilan envoyé ! 📬</h2>
              <p className="text-gray-600 mb-6">Consultez votre boîte mail d&apos;ici quelques minutes.</p>
              <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg shadow-sm">
                <h3 className="font-bold text-lg mb-2">Vous devez augmenter vos prix ?</h3>
                <p className="text-sm text-gray-700 mb-2">Je finalise actuellement un Kit contenant mes templates d&apos;emails exacts pour annoncer une hausse de tarif sans perdre vos clients.</p>
                <p className="text-xs text-gray-500 mb-4 italic">(Lancement officiel lundi. Inscrivez-vous pour être prévenu et obtenir 10€ de réduction.)</p>
                
                <a 
                  href="https://tally.so/r/2E44Q9?src=app_success" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block w-full text-center bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
                >
                  Rejoindre la liste d&apos;attente (+10€ offerts)
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 pb-8 max-w-lg mx-auto px-4">
        * Simulation à but indicatif basée sur le régime micro-entreprise (Prestations de services à 21,2%). Hors CFE et versement libératoire.
      </p>
    </div>
  );
}
