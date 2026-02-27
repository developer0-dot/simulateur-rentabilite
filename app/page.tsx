'use client';

import { useState } from 'react';

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

  const fillExample = () => {
    setNetTarget('3000');
    setExpenses('400');
    setBillableDays('14');
    setCurrentRate('180');
    setErrors({});
  };

  const calculateTJM = () => {
    const monthlyNet = parseFloat(netTarget);
    const monthlyExp = parseFloat(expenses) || 0;
    const days = parseFloat(billableDays);
    const currentTJM = parseFloat(currentRate) || 0;

    const nextErrors: any = {};
    if (!monthlyNet || monthlyNet <= 0) nextErrors.net = "Veuillez entrer un revenu net valide.";
    if (!days || days <= 0) nextErrors.days = "Veuillez entrer un nombre de jours valide.";

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
      const res = await fetch('https://formspree.io/f/xreajabj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email, 
          tjm_cible: results.tjm.toFixed(0),
          manque_a_gagner: results.loss > 0 ? results.loss.toFixed(0) : "0"
        })
      });
      
      if (!res.ok) throw new Error("Erreur réseau");
      
      setEmailSubmitted(true);
    } catch (error) {
      alert("Une erreur s'est produite lors de l'envoi. Veuillez réessayer.");
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
  const inputBaseClass = "w-full border p-3 rounded-lg bg-gray-50 pr-8 focus:outline-none focus:ring-2 transition-all";

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800 flex flex-col">
      
      <div className="w-full h-24 bg-slate-900 border-b border-slate-800
