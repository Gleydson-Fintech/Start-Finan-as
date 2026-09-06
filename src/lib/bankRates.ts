export interface BankRateInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  logoBg: string;
  averageMonthlyInterest: number; // ex: 3.75 (% ao mês)
  description: string;
}

export const BANK_RATES: BankRateInfo[] = [
  { id: 'nubank', name: 'Nubank', code: 'NUB', color: '#820AD1', logoBg: 'bg-purple-600', averageMonthlyInterest: 3.75, description: 'Taxa média de parcelamento Nubank (~3,75% a.m.)' },
  { id: 'picpay', name: 'PicPay', code: 'PIC', color: '#11C76F', logoBg: 'bg-emerald-600 text-white', averageMonthlyInterest: 3.99, description: 'Taxa média de parcelado PicPay (~3,99% a.m.)' },
  { id: 'itau', name: 'Itaú Unibanco', code: 'ITAU', color: '#EC7000', logoBg: 'bg-orange-600', averageMonthlyInterest: 4.15, description: 'Taxa média de parcelado Itaú (~4,15% a.m.)' },
  { id: 'bradesco', name: 'Bradesco', code: 'BRAD', color: '#CC092F', logoBg: 'bg-red-600', averageMonthlyInterest: 4.10, description: 'Taxa média de parcelamento Bradesco (~4,10% a.m.)' },
  { id: 'santander', name: 'Santander', code: 'SANT', color: '#EC0000', logoBg: 'bg-red-700', averageMonthlyInterest: 4.35, description: 'Taxa média de parcelado Santander (~4,35% a.m.)' },
  { id: 'bb', name: 'Banco do Brasil', code: 'BB', color: '#0038A8', logoBg: 'bg-yellow-500 text-black font-extrabold', averageMonthlyInterest: 3.65, description: 'Taxa média BB parcelado (~3,65% a.m.)' },
  { id: 'caixa', name: 'Caixa Econômica', code: 'CEF', color: '#0066B3', logoBg: 'bg-blue-600', averageMonthlyInterest: 3.25, description: 'Taxa média Caixa parcelado (~3,25% a.m.)' },
  { id: 'inter', name: 'Banco Inter', code: 'INT', color: '#FF7A00', logoBg: 'bg-orange-500', averageMonthlyInterest: 3.10, description: 'Taxa média Inter parcelado (~3,10% a.m.)' },
  { id: 'c6', name: 'C6 Bank', code: 'C6', color: '#242424', logoBg: 'bg-zinc-800', averageMonthlyInterest: 3.80, description: 'Taxa média C6 Bank (~3,80% a.m.)' },
  { id: 'btg', name: 'BTG Pactual', code: 'BTG', color: '#001E62', logoBg: 'bg-blue-900', averageMonthlyInterest: 3.35, description: 'Taxa média BTG Pactual (~3,35% a.m.)' },
  { id: 'mercadopago', name: 'Mercado Pago', code: 'MP', color: '#009EE3', logoBg: 'bg-sky-500', averageMonthlyInterest: 4.60, description: 'Taxa média Mercado Crédito (~4,60% a.m.)' },
  { id: 'pagbank', name: 'PagBank', code: 'PAG', color: '#00C286', logoBg: 'bg-emerald-500', averageMonthlyInterest: 4.20, description: 'Taxa média PagBank (~4,20% a.m.)' },
  { id: 'recargapay', name: 'RecargaPay', code: 'RP', color: '#005CE6', logoBg: 'bg-blue-500', averageMonthlyInterest: 4.49, description: 'Taxa média RecargaPay (~4,49% a.m.)' },
  { id: 'neon', name: 'Banco Neon', code: 'NEO', color: '#00E5FF', logoBg: 'bg-cyan-500 text-black font-extrabold', averageMonthlyInterest: 3.90, description: 'Taxa média Neon (~3,90% a.m.)' },
  { id: 'next', name: 'Banco Next', code: 'NXT', color: '#00FF66', logoBg: 'bg-emerald-500 text-black font-extrabold', averageMonthlyInterest: 3.85, description: 'Taxa média Banco Next (~3,85% a.m.)' },
  { id: 'digio', name: 'Banco Digio', code: 'DIG', color: '#002663', logoBg: 'bg-blue-900', averageMonthlyInterest: 3.95, description: 'Taxa média Cartão Digio (~3,95% a.m.)' },
  { id: 'will', name: 'Will Bank', code: 'WILL', color: '#FFD700', logoBg: 'bg-yellow-400 text-black font-extrabold', averageMonthlyInterest: 4.15, description: 'Taxa média Will Bank (~4,15% a.m.)' },
  { id: 'sicoob', name: 'Sicoob', code: 'SIC', color: '#003641', logoBg: 'bg-teal-700', averageMonthlyInterest: 2.95, description: 'Taxa média Sicoob Cooperativa (~2,95% a.m.)' },
  { id: 'sicredi', name: 'Sicredi', code: 'SCR', color: '#33A832', logoBg: 'bg-green-700', averageMonthlyInterest: 2.90, description: 'Taxa média Sicredi Cooperativa (~2,90% a.m.)' },
  { id: 'pan', name: 'Banco PAN', code: 'PAN', color: '#0084FF', logoBg: 'bg-blue-600', averageMonthlyInterest: 4.25, description: 'Taxa média Banco PAN (~4,25% a.m.)' },
  { id: 'bmg', name: 'Banco BMG', code: 'BMG', color: '#FF6600', logoBg: 'bg-orange-600', averageMonthlyInterest: 3.85, description: 'Taxa média Banco BMG (~3,85% a.m.)' },
  { id: 'xp', name: 'XP Investimentos', code: 'XP', color: '#000000', logoBg: 'bg-zinc-900 border border-zinc-700', averageMonthlyInterest: 3.20, description: 'Taxa média XP Cartão (~3,20% a.m.)' },
  { id: 'porto', name: 'Porto Seguro Bank', code: 'POR', color: '#004A99', logoBg: 'bg-blue-800', averageMonthlyInterest: 3.95, description: 'Taxa média Porto Seguro (~3,95% a.m.)' },
  { id: 'safra', name: 'Banco Safra', code: 'SAF', color: '#B3995D', logoBg: 'bg-amber-600 text-black font-extrabold', averageMonthlyInterest: 3.50, description: 'Taxa média Banco Safra (~3,50% a.m.)' },
  { id: 'banrisul', name: 'Banrisul', code: 'BAN', color: '#005CA9', logoBg: 'bg-blue-700', averageMonthlyInterest: 3.70, description: 'Taxa média Banrisul (~3,70% a.m.)' },
  { id: 'nomad', name: 'Nomad', code: 'NOM', color: '#FFC800', logoBg: 'bg-yellow-500 text-black font-extrabold', averageMonthlyInterest: 3.60, description: 'Taxa média Nomad (~3,60% a.m.)' },
  { id: 'wise', name: 'Wise', code: 'WSE', color: '#9FE870', logoBg: 'bg-lime-500 text-black font-extrabold', averageMonthlyInterest: 3.10, description: 'Taxa média Wise (~3,10% a.m.)' },
  { id: 'sem_juros', name: 'Sem Juros (0% a.m.)', code: '0%', color: '#10B981', logoBg: 'bg-emerald-600', averageMonthlyInterest: 0.00, description: 'Parcelamento sem juros da loja' }
];

export interface InstallmentCalculationResult {
  originalAmount: number;
  installmentsCount: number;
  monthlyRatePercent: number;
  monthlyPayment: number;
  totalWithInterest: number;
  totalInterest: number;
}

export function calculateInstallments(
  amount: number,
  installmentsCount: number,
  monthlyRatePercent: number
): InstallmentCalculationResult {
  if (amount <= 0 || installmentsCount <= 1) {
    return {
      originalAmount: amount,
      installmentsCount: Math.max(1, installmentsCount),
      monthlyRatePercent: 0,
      monthlyPayment: amount,
      totalWithInterest: amount,
      totalInterest: 0
    };
  }

  if (monthlyRatePercent <= 0) {
    const monthly = amount / installmentsCount;
    return {
      originalAmount: amount,
      installmentsCount,
      monthlyRatePercent: 0,
      monthlyPayment: monthly,
      totalWithInterest: amount,
      totalInterest: 0
    };
  }

  const i = monthlyRatePercent / 100;
  const n = installmentsCount;
  const factor = Math.pow(1 + i, n);
  const monthlyPayment = amount * ((i * factor) / (factor - 1));
  const totalWithInterest = monthlyPayment * n;
  const totalInterest = totalWithInterest - amount;

  return {
    originalAmount: amount,
    installmentsCount,
    monthlyRatePercent,
    monthlyPayment,
    totalWithInterest,
    totalInterest
  };
}
