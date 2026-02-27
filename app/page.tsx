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
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800 flex flex-col justify-between">
      <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full">
        
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
              <p className="text-xs text-gray-400 mb-1">Excluez l'admin, la prospection et les congés.</p>
              <input type="number" required min="1" className="w-full border p-3 rounded-lg bg-gray-50" placeholder="ex: 15" value={billableDays} onChange={(e) => setBillableDays(e.target.value)} />
            </div>

            <div className="pt-2 border-t">
              <label className="block text
