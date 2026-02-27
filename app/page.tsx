'use client';

import { useState } from 'react';

// French number formatter
const eur = (n: number) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n);

export default function Calculator() {
  const [netTarget, setNetTarget] = useState('');
  const [expenses, setExpenses] = useState('');
  const [billableDays, setBillableDays] = useState('');
  const [currentRate, setCurrentRate] = useState('');
  
  const [errors, setErrors] = useState<any>({});
  const [results, setResults] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTJM = () => {
    const monthlyNet = parseFloat(netTarget);
    const monthlyExp = parseFloat(expenses) || 0;
    const days = parseFloat(billableDays);
    const currentTJM = parseFloat(currentRate) || 0;

    const nextErrors: any = {};
    if (!monthlyNet || monthlyNet <= 0) nextErrors.net = "Revenu net invalide.";
    if (!days || days <= 0) nextErrors.days = "Jours facturables invalides.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

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
          manque_a_gagner: results.loss > 0 ? results.loss.toFixed(0) : "N/A"
        })
      });
      setEmailSubmitted(true);
    } catch (error) {
      alert("Une erreur s'est produite. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecalculate = () => {
    setResults(null);
    setEmailSubmitted(false);
    setEmail('');
  };

  const hasCurrent = Number(currentRate) > 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      
      {/* 🚨 Clean, minimal header replacing the stock image */}
      <div className="w-full h-24 bg-slate-900 border-b border-slate-800"></div>

      <div className="flex-grow flex items-start justify-center px-4">
        <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100 w-full relative -mt-12 z-10 mb-12">
          
          <h1 className="text-2xl font-extrabold text-center mb-2 text-gray-900 leading-tight">La plupart des freelances sous-facturent de 20 à 40%.</h1>
          <p className="text-center text-gray-500 mb-1 text-sm">
            Calculez votre TJM minimum pour ne pas travailler à perte.
          </p>
          
          {/* 🚨 The Scope Badge */}
          <p className="text-center text-xs text-gray-400 mb-8 font-medium bg-gray-50 inline-block w-full py-2 rounded-md border border-gray-100">
            Micro-entreprise · Prestations de services · Estimation 2026
          </p>

          {!results && (
            <div className="space-y-6">
              
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b pb-2">🧾 Vos objectifs</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Revenu net mensuel visé *</label>
                    <div className="relative">
                      <input type="number" min="1" className
