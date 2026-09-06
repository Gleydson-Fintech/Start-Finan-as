import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  History, 
  Database, 
  PieChart as PieChartIcon,
  X,
  Trash2,
  Sun,
  Moon,
  Eye,
  EyeOff,
  HelpCircle,
  Home,
  Activity,
  FileText,
  Search,
  Download,
  Send,
  Star,
  Paperclip,
  Image as ImageIcon,
  Film,
  Fingerprint,
  LogOut,
  TrendingUp,
  LineChart as LineChartIcon,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  TrendingDown,
  Bell,
  RefreshCw,
  Settings,
  Smartphone,
  MessageSquare,
  FileUp,
  Clock,
  Calendar,
  CreditCard,
  Calculator,
  Receipt,
  CheckSquare,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Target,
  Award,
  Flame,
  User,
  Grid,
  BarChart3,
  Shield,
  Scan,
  PiggyBank,
  Percent,
  Compass,
  LifeBuoy,
  Info,
  Lock,
  Share2,
  SlidersHorizontal,
  Layers,
  Menu,
  ArrowRight,
  Check,
  BarChart2,
  MessageCircle,
  HeartPulse,
  Pin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BANK_RATES, calculateInstallments } from './lib/bankRates';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Transaction, CategoryStat, Reminder, FinancialAlert, NotificationSettings, FixedExpense } from './types';
import { cn, formatCurrency, fetchWithRetry } from './lib/utils';
import AdminDashboard from './AdminDashboard';
import annyAvatar from './assets/images/anny_avatar_1785977491572.jpg';

const ANNY_AVATAR = annyAvatar;


const CATEGORIES = [
  'Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Moradia', 'Outros'
];

const EMOJI_MAP: Record<string, string> = {
  'alimentação': '🍽️',
  'comida': '🍕',
  'restaurante': '🍕',
  'lanche': '🍔',
  'bebida': '🍷',
  'bebidas': '🍷',
  'taça': '🍷',
  'vinho': '🍷',
  'cerveja': '🍺',
  'transporte': '🚗',
  'carro': '🚗',
  'uber': '🚗',
  'gasolina': '⛽',
  'lazer': '🎮',
  'cinema': '🍿',
  'show': '🎸',
  'festa': '🎉',
  'saúde': '🏥',
  'farmácia': '💊',
  'médico': '👨‍⚕️',
  'hospital': '🏥',
  'educação': '📚',
  'curso': '🎓',
  'livro': '📖',
  'escola': '🏫',
  'moradia': '🏠',
  'aluguel': '🔑',
  'luz': '💡',
  'água': '🚰',
  'vestuário': '👕',
  'roupa': '👗',
  'blusa': '👕',
  'calça': '👖',
  'sapato': '👟',
  'mercado': '🛒',
  'compras': '🛍️',
  'feira': '🍎',
  'presente': '🎁',
  'viagem': '✈️',
  'avião': '✈️',
  'hotel': '🏨',
  'pet': '🐾',
  'cachorro': '🐶',
  'gato': '🐱',
  'beleza': '💄',
  'salão': '💇‍♀️',
  'eletrônicos': '💻',
  'celular': '📱',
  'computador': '💻',
  'serviços': '🛠️',
  'assinatura': '📺',
  'netflix': '🎬',
  'academia': '💪',
  'esporte': '⚽',
  'internet': '🌐',
  'trabalho': '💼',
  'salário': '💰',
  'investimento': '📈',
  'outros': '📦'
};

const getCategoryIcon = (cat: string, description?: string) => {
  const descLower = (description || '').toLowerCase().trim();
  const catLower = (cat || '').toLowerCase().trim();
  const textToSearch = `${descLower} ${catLower}`;

  // Smart Keyword Matching for Descriptions
  if (textToSearch.includes('academia') || textToSearch.includes('gym') || textToSearch.includes('crossfit') || textToSearch.includes('musculação') || textToSearch.includes('fit')) return '🏋️‍♂️';
  if (textToSearch.includes('internet') || textToSearch.includes('wifi') || textToSearch.includes('fibra') || textToSearch.includes('banda larga') || textToSearch.includes('net') || textToSearch.includes('claro fibra')) return '🌐';
  if (textToSearch.includes('luz') || textToSearch.includes('energia') || textToSearch.includes('eletricidade') || textToSearch.includes('cpfl') || textToSearch.includes('enel') || textToSearch.includes('light')) return '⚡';
  if (textToSearch.includes('água') || textToSearch.includes('agua') || textToSearch.includes('saneamento') || textToSearch.includes('sabesp')) return '💧';
  if (textToSearch.includes('condomínio') || textToSearch.includes('condominio')) return '🏢';
  if (textToSearch.includes('aluguel') || textToSearch.includes('locação')) return '🔑';
  if (textToSearch.includes('netflix') || textToSearch.includes('prime') || textToSearch.includes('hbo') || textToSearch.includes('disney') || textToSearch.includes('streaming') || textToSearch.includes('cinema')) return '🎬';
  if (textToSearch.includes('spotify') || textToSearch.includes('music') || textToSearch.includes('deezer') || textToSearch.includes('música') || textToSearch.includes('musica')) return '🎵';
  if (textToSearch.includes('celular') || textToSearch.includes('telefone') || textToSearch.includes('vivo') || textToSearch.includes('claro') || textToSearch.includes('tim') || textToSearch.includes('oi')) return '📱';
  if (textToSearch.includes('faculdade') || textToSearch.includes('escola') || textToSearch.includes('curso') || textToSearch.includes('mensalidade') || textToSearch.includes('estudo') || textToSearch.includes('aula') || textToSearch.includes('colégio')) return '🎓';
  if (textToSearch.includes('cartão') || textToSearch.includes('cartao') || textToSearch.includes('fatura') || textToSearch.includes('nubank') || textToSearch.includes('bradesco') || textToSearch.includes('itau') || textToSearch.includes('santander') || textToSearch.includes('inter')) return '💳';
  if (textToSearch.includes('supermercado') || textToSearch.includes('mercado') || textToSearch.includes('feira') || textToSearch.includes('compras') || textToSearch.includes('carrefour') || textToSearch.includes('atacado') || textToSearch.includes('assai')) return '🛒';
  if (textToSearch.includes('carro') || textToSearch.includes('ipva') || textToSearch.includes('mecanico') || textToSearch.includes('mecânico') || textToSearch.includes('oficina') || textToSearch.includes('veículo')) return '🚗';
  if (textToSearch.includes('gasolina') || textToSearch.includes('combustível') || textToSearch.includes('posto') || textToSearch.includes('etanol') || textToSearch.includes('diesel')) return '⛽';
  if (textToSearch.includes('pet') || textToSearch.includes('veterinário') || textToSearch.includes('veterinario') || textToSearch.includes('ração') || textToSearch.includes('racao') || textToSearch.includes('gato') || textToSearch.includes('cachorro') || textToSearch.includes('animal')) return '🐶';
  if (textToSearch.includes('médico') || textToSearch.includes('medico') || textToSearch.includes('plano de saúde') || textToSearch.includes('unimed') || textToSearch.includes('consulta') || textToSearch.includes('dentista') || textToSearch.includes('exame')) return '🩺';
  if (textToSearch.includes('farmácia') || textToSearch.includes('farmacia') || textToSearch.includes('drogaria') || textToSearch.includes('remédio') || textToSearch.includes('remedio') || textToSearch.includes('medicamento')) return '💊';
  if (textToSearch.includes('uber') || textToSearch.includes('99') || textToSearch.includes('táxi') || textToSearch.includes('taxi')) return '🚗';
  if (textToSearch.includes('padaria') || textToSearch.includes('pão') || textToSearch.includes('pao') || textToSearch.includes('café') || textToSearch.includes('cafe')) return '☕';
  if (textToSearch.includes('restaurante') || textToSearch.includes('almoço') || textToSearch.includes('almoco') || textToSearch.includes('jantar') || textToSearch.includes('ifood') || textToSearch.includes('pizza') || textToSearch.includes('hambúrguer') || textToSearch.includes('burger')) return '🍕';
  if (textToSearch.includes('juros') || textToSearch.includes('banco') || textToSearch.includes('multa') || textToSearch.includes('taxa')) return '🏦';
  if (textToSearch.includes('salário') || textToSearch.includes('salario') || textToSearch.includes('pagamento') || textToSearch.includes('prolabore')) return '💰';
  if (textToSearch.includes('investimento') || textToSearch.includes('ações') || textToSearch.includes('rendimento') || textToSearch.includes('poupança')) return '📈';

  // Check individual words against EMOJI_MAP
  const words = textToSearch.replace(/[^\w\s]/gi, '').split(/\s+/);
  for (const w of words) {
    if (w && EMOJI_MAP[w]) {
      return EMOJI_MAP[w];
    }
  }

  const normalized = cat.toLowerCase().trim().split(' ')[0];
  return EMOJI_MAP[normalized] || '💰';
};

const COLORS = [
  '#FF6B6B', // Alimentação
  '#4D96FF', // Transporte
  '#FFD93D', // Lazer
  '#6BCB77', // Saúde
  '#9966FF', // Educação
  '#FF9F40', // Moradia
  '#94A3B8'  // Outros
];

const getCategoryColor = (cat: string) => {
  const index = CATEGORIES.indexOf(cat);
  return index !== -1 ? COLORS[index] : '#cbd5e1';
};

const MOTIVATIONAL_QUOTES = [
  "Cada pequeno passo aproxima você dos seus objetivos.",
  "Seu futuro financeiro começa hoje.",
  "Guardar é um hábito. Investir é um próximo passo.",
  "Tempo é dinheiro. E de dinheiro, o Start Finanças entende.",
  "Pequenas economias criam grandes conquistas.",
  "Organizar hoje é conquistar amanhã.",
  "O segredo da liberdade financeira é gastar menos do que se ganha.",
  "Quem economiza no presente garante a paz no futuro.",
  "Invista na sua mente para encher seu bolso.",
  "Constância vence a ansiedade financeira.",
  "Controle o seu dinheiro antes que ele controle você.",
  "A disciplina financeira é a ponte entre seus objetivos e suas realizações.",
  "Riqueza não é ter muitas coisas, mas ter poucas necessidades.",
  "Pense duas vezes antes de comprar o que não precisa.",
  "Qualidade de vida é viver dentro das suas possibilidades com paz.",
  "Crie o hábito de registrar antes que o dia termine.",
  "Sua reserva de emergência é seu melhor seguro de tranquilidade.",
  "Valorize o dinheiro que você trabalhou para conquistar.",
  "A clareza financeira traz paz para toda a sua vida.",
  "O orçamento não restringe sua liberdade; ele cria a sua liberdade.",
  "Grandes patrimônios começam com os primeiros dez reais guardados.",
  "O melhor investimento que você pode fazer é na sua independência.",
  "Evite compras por impulso; espere 24 horas antes de decidir.",
  "A sabedoria financeira se cultiva dia após dia.",
  "Comemore cada meta alcançada, por menor que seja.",
  "Planejar é antecipar conquistas com inteligência.",
  "A simplicidade nos hábitos traz grande riqueza no bolso.",
  "Priorize o que realmente traz valor sustentável para a sua vida.",
  "O primeiro passo para a prosperidade é ter visibilidade dos seus números.",
  "Não economize o que sobra depois de gastar; gaste o que sobra depois de economizar.",
  "Toda grande árvore começou com uma pequena semente.",
  "Seu dinheiro deve trabalhar para você, e não o contrário.",
  "Metas claras se transformam em resultados reais.",
  "Cuidar das suas finanças é um ato de amor-próprio e responsabilidade.",
  "Elimine desperdícios silenciosos que corroem seu orçamento.",
  "A prosperidade é o resultado da atenção aos pequenos detalhes.",
  "A tranquilidade financeira não tem preço.",
  "Transforme intenções financeiras em ações concretas.",
  "Aprender a dizer não para o supérfluo é dizer sim para os seus sonhos.",
  "Mantenha seus custos fixos sob controle para ter flexibilidade.",
  "Sua evolução financeira é um processo contínuo de aprendizado.",
  "Tenha paciência: os juros compostos recompensam os perseverantes.",
  "A inteligência financeira transforma esforço em patrimônio.",
  "Construa hoje o amanhã que você sempre desejou.",
  "A chave da abundância é a boa gestão do que já se tem."
];

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "☀️ Bom dia";
  if (hour >= 12 && hour < 18) return "🌤 Boa tarde";
  return "🌙 Boa noite";
};

const getDailyQuote = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
};

const generateAnnyInsights = (transactions: Transaction[], goalsList: any[], fixedExpenses: any[]) => {
  const insights: { text: string; type: 'info' | 'success' | 'warning' | 'tip'; tag: string; icon?: string }[] = [];

  if (transactions.length === 0) {
    insights.push({
      text: "Vamos começar? Registre sua primeira movimentação para que eu possa gerar análises e orientações personalizadas.",
      type: 'info',
      tag: '💡 Boas-vindas',
      icon: '✨'
    });
    insights.push({
      text: "O hábito de guardar regularmente costuma ser mais importante do que guardar grandes valores de uma só vez.",
      type: 'tip',
      tag: '🎓 Dica da Anny',
      icon: '🌱'
    });
    return insights;
  }

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = income - expense;

  // 1. Weekly Spending Comparison ("Você gastou menos que semana passada" or comparison)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
    .reduce((acc, t) => acc + t.amount, 0);

  const lastWeekExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
    .reduce((acc, t) => acc + t.amount, 0);

  if (lastWeekExpenses > 0 && thisWeekExpenses < lastWeekExpenses) {
    const savedAmount = lastWeekExpenses - thisWeekExpenses;
    insights.push({
      text: `Você gastou R$ ${savedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a menos que a semana passada! Excelente controle dos gastos.`,
      type: 'success',
      tag: '⚡ Comparativo Semanal',
      icon: '👏'
    });
  } else if (lastWeekExpenses > 0 && thisWeekExpenses > lastWeekExpenses) {
    const extraAmount = thisWeekExpenses - lastWeekExpenses;
    insights.push({
      text: `Seus gastos nos últimos 7 dias subiram R$ ${extraAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em relação à semana passada. Vale a pena revisar suas compras recentes.`,
      type: 'warning',
      tag: '⚡ Comparativo Semanal',
      icon: '📊'
    });
  }

  // 2. Category Percentage Breakdown ("Alimentação representa 38% dos gastos")
  const categoryTotals: Record<string, number> = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

  let topCategory = '';
  let topCategoryAmount = 0;
  Object.entries(categoryTotals).forEach(([cat, amt]) => {
    if (amt > topCategoryAmount) {
      topCategoryAmount = amt;
      topCategory = cat;
    }
  });

  if (expense > 0 && topCategoryAmount > 0) {
    const pct = Math.round((topCategoryAmount / expense) * 100);
    insights.push({
      text: `${topCategory} representa ${pct}% dos seus gastos totais (R$ ${topCategoryAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`,
      type: pct > 35 ? 'warning' : 'info',
      tag: '📊 Categoria em Destaque',
      icon: '🏷️'
    });
  }

  // 3. Balance Growth ("Seu saldo está crescendo")
  if (income > 0 && netBalance > 0) {
    insights.push({
      text: `Seu saldo está crescendo! Você acumula um superávit de R$ ${netBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até o momento.`,
      type: 'success',
      tag: '📈 Saldo em Alta',
      icon: '🚀'
    });
  } else if (expense > income && income > 0) {
    insights.push({
      text: "Percebi que suas despesas superaram suas receitas neste período. Posso te ajudar a reequilibrar seu planejamento!",
      type: 'warning',
      tag: '⚠️ Alerta de Orçamento',
      icon: '⚖️'
    });
  }

  // 4. Monthly Savings Estimate ("Você pode economizar aproximadamente R$ xxx neste mês")
  if (expense > 0) {
    const estimatedSavings = Math.round(expense * 0.15);
    if (estimatedSavings >= 20) {
      insights.push({
        text: `Você pode economizar aproximadamente R$ ${estimatedSavings.toLocaleString('pt-BR')} neste mês renegociando ou ajustando pequenos gastos do dia a dia.`,
        type: 'tip',
        tag: '💡 Oportunidade de Economia',
        icon: '💰'
      });
    }
  }

  // 5. Best Month Milestone ("Este foi seu melhor mês do ano")
  const monthSavingsMap: Record<string, number> = {};
  transactions.forEach(t => {
    const mKey = t.date ? t.date.substring(0, 7) : currentMonthKey;
    if (!monthSavingsMap[mKey]) monthSavingsMap[mKey] = 0;
    if (t.type === 'income') monthSavingsMap[mKey] += t.amount;
    else monthSavingsMap[mKey] -= t.amount;
  });

  const allMonths = Object.keys(monthSavingsMap);
  if (allMonths.length >= 2) {
    const currentMonthNet = monthSavingsMap[currentMonthKey] || 0;
    const previousBestNet = Math.max(...allMonths.filter(m => m !== currentMonthKey).map(m => monthSavingsMap[m]));

    if (currentMonthNet > 0 && currentMonthNet >= previousBestNet) {
      insights.push({
        text: `Incrível! Este está sendo seu melhor mês do ano com R$ ${currentMonthNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} economizados!`,
        type: 'success',
        tag: '🏆 Melhor Mês do Ano',
        icon: '🥇'
      });
    }
  }

  // 6. Goals Progress Milestones
  const nearGoal = goalsList.find(g => (g.currentAmount / g.targetAmount) >= 0.75 && (g.currentAmount / g.targetAmount) < 1);
  if (nearGoal) {
    const pct = Math.round((nearGoal.currentAmount / nearGoal.targetAmount) * 100);
    insights.push({
      text: `Você está a ${pct}% da sua meta "${nearGoal.name}". Falta muito pouco para conquistar esse objetivo!`,
      type: 'success',
      tag: '🎯 Quase Lá',
      icon: '🏁'
    });
  }

  const reachedGoal = goalsList.find(g => g.currentAmount >= g.targetAmount);
  if (reachedGoal) {
    insights.push({
      text: `Parabéns! Você alcançou a sua meta "${reachedGoal.name}". Toda conquista é resultado da sua disciplina!`,
      type: 'success',
      tag: '🏆 Meta Atingida',
      icon: '🎉'
    });
  }

  return insights;
};

const calculateFinancialHealth = (transactions: Transaction[], goalsList: any[], fixedExpenses: any[]) => {
  if (transactions.length === 0) {
    return { score: 50, label: 'Regular', color: 'text-amber-500', regularity: 10, savings: 20, goals: 10, organization: 10 };
  }

  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  // Regularity (max 25 pts)
  const regularity = Math.min(25, transactions.length * 2.5);

  // Savings (max 35 pts)
  let savings = 10;
  if (income > 0) {
    const ratio = (income - expense) / income;
    if (ratio >= 0.3) savings = 35;
    else if (ratio >= 0.15) savings = 28;
    else if (ratio >= 0) savings = 20;
    else savings = 5;
  }

  // Goals (max 20 pts)
  const goals = Math.min(20, (goalsList.length * 5) + (goalsList.filter(g => g.currentAmount > 0).length * 5));

  // Organization (max 20 pts)
  const organization = fixedExpenses.length > 0 ? 20 : 10;

  const score = Math.min(100, Math.max(0, Math.round(regularity + savings + goals + organization)));

  let label = 'Regular';
  let color = 'text-amber-500';
  if (score >= 80) { label = 'Excelente'; color = 'text-emerald-500'; }
  else if (score >= 60) { label = 'Boa'; color = 'text-blue-500'; }
  else if (score >= 40) { label = 'Atenção'; color = 'text-amber-500'; }
  else { label = 'Crítica'; color = 'text-rose-500'; }

  return { score, label, color, regularity, savings, goals, organization };
};

const getWeeklySummary = (transactions: Transaction[]) => {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekTrans = transactions.filter(t => new Date(t.date) >= sevenDaysAgo);
  
  const income = weekTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = weekTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const savings = income - expense;

  const catMap: Record<string, number> = {};
  weekTrans.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });
  const topCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nenhuma';

  let suggestion = "Mantenha o hábito de registrar saídas diariamente para manter sua saúde financeira alta.";
  if (savings > 0) suggestion = "Ótima semana! Que tal destinar uma porcentagem dessa economia para seus Objetivos?";
  else if (expense > income && income > 0) suggestion = "Atenção ao orçamento semanal. Tente priorizar apenas despesas essenciais nos próximos dias.";

  return { income, expense, savings, topCat, count: weekTrans.length, suggestion };
};

const getMonthlySummary = (transactions: Transaction[], goalsList: any[], fixedExpenses: any[]) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthTrans = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);

  const income = monthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const expense = monthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const savings = income - expense;

  const catMap: Record<string, number> = {};
  let biggestExpenseItem = { description: 'Nenhum', amount: 0 };
  
  monthTrans.filter(t => t.type === 'expense').forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    if (t.amount > biggestExpenseItem.amount) {
      biggestExpenseItem = { description: t.description, amount: t.amount };
    }
  });

  const topCat = Object.entries(catMap).sort((a,b) => b[1] - a[1])[0]?.[0] || 'Nenhuma';
  const health = calculateFinancialHealth(transactions, goalsList, fixedExpenses);

  let recommendation = "Defina um teto de gastos para a sua categoria principal no próximo mês para acelerar seus resultados.";
  if (savings > 0) recommendation = "Você teve um mês positivo! Que tal separar uma parcela para reforçar sua reserva de emergência?";
  else if (expense > income && income > 0) recommendation = "Revise suas assinaturas e contas fixas para reduzir o custo recorrente do próximo mês.";

  return { income, expense, savings, topCat, biggestExpense: biggestExpenseItem, health, recommendation };
};

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<CategoryStat[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'anny' | 'more' | 'dashboard' | 'reports' | 'planning' | 'forecast' | 'fixed' | 'investments' | 'profile'>('home');
  const [isDark, setIsDark] = useState(false);

  // Anny Insights & Periodic Summaries
  const [currentInsightIdx, setCurrentInsightIdx] = useState(0);
  const [showAnnySummaryModal, setShowAnnySummaryModal] = useState(false);
  const [summaryTab, setSummaryTab] = useState<'semanal' | 'mensal' | 'saude'>('semanal');

  // Speed Dial & Quick Actions
  const [showSpeedDial, setShowSpeedDial] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferCategory, setTransferCategory] = useState('Outros');

  // Security & Rating
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [appRating, setAppRating] = useState<number>(5);

  // Scroll Auto-Hide Bottom Navigation
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Gamification & Goals State
  const [goalsList, setGoalsList] = useState<{ id: string; name: string; targetAmount: number; currentAmount: number; category: string; icon: string }[]>(() => {
    const saved = localStorage.getItem('anny_goals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing goals:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('anny_goals', JSON.stringify(goalsList));
  }, [goalsList]);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Reminder Modal State
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderDesc, setReminderDesc] = useState('');
  const [reminderDate, setReminderDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reminderCat, setReminderCat] = useState('Geral');

  // Goal Modal State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTargetAmount, setGoalTargetAmount] = useState('');
  const [goalCurrentAmount, setGoalCurrentAmount] = useState('');
  const [goalCategory, setGoalCategory] = useState('Sonhos');
  const [goalIcon, setGoalIcon] = useState('🎯');

  // Goal Deposit/Withdraw Action Modal State
  const [selectedGoalForAction, setSelectedGoalForAction] = useState<{ goal: any; actionType: 'deposit' | 'withdraw' } | null>(null);
  const [goalActionAmount, setGoalActionAmount] = useState('');

  // Password Change State
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');

  // Backup Import Input Ref
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  const [showHelpChat, setShowHelpChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [annyCentralInput, setAnnyCentralInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [chatRoom] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom) return urlRoom;
    
    const savedRoom = localStorage.getItem('anny_chat_room');
    if (savedRoom) {
      return savedRoom;
    }
    
    const newRoom = `room_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('anny_chat_room', newRoom);
    return newRoom;
  });
  const [isAdmin, setIsAdmin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === 'true';
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isWaitingForAttendant, setIsWaitingForAttendant] = useState(false);
  const [hasNotifiedAdmin, setHasNotifiedAdmin] = useState(false);
  const [showMenu, setShowMenu] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'preferences' | 'notifications' | 'security'>('profile');
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('anny_app_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      currency: 'BRL',
      cycleStartDay: '1',
      hideValuesDefault: false,
      budgetAlerts: true,
      dueBillNotifications: true,
      weeklyReport: true,
      soundEffects: true,
      biometricsLock: false
    };
  });

  const [editProfileForm, setEditProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    age: '',
    country: '',
    state: '',
    city: ''
  });

  const handleOpenProfileModal = () => {
    setEditProfileForm({
      firstName: user?.firstName || 'Gleydson',
      lastName: user?.lastName || 'Financeiro',
      email: user?.email || 'gleydsonr723@gmail.com',
      age: user?.age || '28',
      country: user?.country || 'Brasil',
      state: user?.state || 'PE',
      city: user?.city || 'Recife'
    });
    setSettingsTab('profile');
    setShowProfileModal(true);
  };

  const handleExportCSV = () => {
    const headers = "ID,Data,Descrição,Valor,Tipo,Categoria,Pago\n";
    const rows = transactions.map(t => 
      `"${t.id}","${t.date}","${t.description.replace(/"/g, '""')}",${t.amount},"${t.type}","${t.category}","${t.paid ? 'Sim' : 'Não'}"`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anny_transacoes_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportBackup = () => {
    const backupData = {
      user,
      settings: appSettings,
      transactions,
      goals: goalsList,
      fixedExpenses,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anny_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = {
      ...(user || {}),
      firstName: editProfileForm.firstName.trim() || 'Gleydson',
      lastName: editProfileForm.lastName.trim() || 'Financeiro',
      email: editProfileForm.email.trim() || 'gleydsonr723@gmail.com',
      age: editProfileForm.age || '28',
      country: editProfileForm.country || 'Brasil',
      state: editProfileForm.state || 'PE',
      city: editProfileForm.city || 'Recife'
    };
    setUser(updatedUser);
    localStorage.setItem('anny_user', JSON.stringify(updatedUser));
    localStorage.setItem('anny_app_settings', JSON.stringify(appSettings));
    showToast('✅ Alterações salvas com sucesso!');
    setShowProfileModal(false);
  };

  // Import Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          localStorage.setItem('anny_transactions', JSON.stringify(data.transactions));
        }
        if (data.goals && Array.isArray(data.goals)) {
          setGoalsList(data.goals);
          localStorage.setItem('anny_goals', JSON.stringify(data.goals));
        }
        if (data.fixedExpenses && Array.isArray(data.fixedExpenses)) {
          setFixedExpenses(data.fixedExpenses);
          localStorage.setItem('anny_fixed_expenses', JSON.stringify(data.fixedExpenses));
        }
        if (data.settings) {
          setAppSettings(data.settings);
          localStorage.setItem('anny_app_settings', JSON.stringify(data.settings));
        }
        if (data.user) {
          setUser(data.user);
          localStorage.setItem('anny_user', JSON.stringify(data.user));
        }
        showToast('🎉 Backup restaurado com sucesso!');
      } catch (err) {
        showToast('❌ Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Change Password Handler
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput) {
      showToast('⚠️ Digite a nova senha.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      showToast('⚠️ As senhas não coincidem.');
      return;
    }
    const updatedUser = { ...(user || {}), password: newPasswordInput };
    setUser(updatedUser);
    localStorage.setItem('anny_user', JSON.stringify(updatedUser));
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    showToast('🔒 Senha alterada com sucesso!');
  };

  // Goal Modal Handlers
  const handleOpenAddGoalModal = () => {
    setEditingGoalId(null);
    setGoalName('');
    setGoalTargetAmount('');
    setGoalCurrentAmount('0');
    setGoalCategory('Sonhos');
    setGoalIcon('🎯');
    setIsGoalModalOpen(true);
  };

  const handleOpenEditGoalModal = (goal: any) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name);
    setGoalTargetAmount(goal.targetAmount.toString());
    setGoalCurrentAmount(goal.currentAmount.toString());
    setGoalCategory(goal.category || 'Sonhos');
    setGoalIcon(goal.icon || '🎯');
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = goalName.trim() || 'Novo Objetivo';
    const targetVal = isNaN(parseFloat(goalTargetAmount)) ? 0 : parseFloat(goalTargetAmount);
    const currentVal = isNaN(parseFloat(goalCurrentAmount)) ? 0 : parseFloat(goalCurrentAmount);

    if (editingGoalId) {
      setGoalsList(prev => prev.map(g => g.id === editingGoalId ? {
        ...g,
        name: finalName,
        targetAmount: targetVal,
        currentAmount: currentVal,
        category: goalCategory,
        icon: goalIcon
      } : g));
      showToast('🎯 Objetivo atualizado!');
    } else {
      const newGoal = {
        id: Date.now().toString(),
        name: finalName,
        targetAmount: targetVal,
        currentAmount: currentVal,
        category: goalCategory,
        icon: goalIcon
      };
      setGoalsList(prev => [...prev, newGoal]);
      if (targetVal > 0 && currentVal >= targetVal) {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        showToast('🏆 Parabéns! Você atingiu sua meta!');
      } else {
        showToast('🎯 Novo objetivo cadastrado com sucesso!');
      }
    }
    setIsGoalModalOpen(false);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoalsList(prev => prev.filter(g => g.id !== goalId));
    setIsGoalModalOpen(false);
    showToast('🗑️ Objetivo excluído com sucesso.');
  };

  const handleConfirmGoalAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForAction) return;
    const amountVal = parseFloat(goalActionAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('⚠️ Digite um valor válido.');
      return;
    }

    const { goal, actionType } = selectedGoalForAction;
    setGoalsList(prev => prev.map(g => {
      if (g.id === goal.id) {
        const newAmount = actionType === 'deposit' 
          ? g.currentAmount + amountVal 
          : Math.max(0, g.currentAmount - amountVal);
        
        if (actionType === 'deposit' && newAmount >= g.targetAmount) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          showToast(`🏆 Incrível! Você alcançou o objetivo "${g.name}"!`);
        } else if (actionType === 'deposit') {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
          showToast(`💰 Guardado R$ ${amountVal.toFixed(2)} em ${g.name}!`);
        } else {
          showToast(`💸 Retirado R$ ${amountVal.toFixed(2)} de ${g.name}.`);
        }
        return { ...g, currentAmount: newAmount };
      }
      return g;
    }));

    setSelectedGoalForAction(null);
    setGoalActionAmount('');
  };

  const handleCreateReserveGoal = () => {
    const idealReserve = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0) * 6;
    const reserveTarget = idealReserve > 0 ? idealReserve : 6000;

    const existingReserve = goalsList.find(g => g.name.toLowerCase().includes('reserva'));
    if (existingReserve) {
      setGoalsList(prev => prev.map(g => g.id === existingReserve.id ? { ...g, targetAmount: reserveTarget } : g));
      showToast(`🛡️ Meta de Reserva de Emergência atualizada para R$ ${reserveTarget.toFixed(2)}!`);
    } else {
      setGoalsList(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          name: 'Reserva de Emergência',
          targetAmount: reserveTarget,
          currentAmount: 0,
          category: 'Segurança',
          icon: '🛡️'
        }
      ]);
      showToast(`🛡️ Reserva de Emergência criada com meta de R$ ${reserveTarget.toFixed(2)}!`);
    }
  };

  // Reminder Modal Handler
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderDesc.trim()) {
      showToast('⚠️ Digite a descrição do lembrete.');
      return;
    }
    const newRem = {
      id: Date.now().toString(),
      description: reminderDesc.trim(),
      date: reminderDate || new Date().toISOString().slice(0, 10),
      completed: false,
      category: reminderCat
    };
    const updated = [...reminders, newRem];
    setReminders(updated);
    localStorage.setItem('anny_reminders', JSON.stringify(updated));
    setReminderDesc('');
    setIsReminderModalOpen(false);
    showToast('⏰ Lembrete adicionado com sucesso!');
  };
  const [showRegistration, setShowRegistration] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  const [registrationForm, setRegistrationForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    age: '',
    country: '',
    state: '',
    city: ''
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);
  
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  const [categoryGoals, setCategoryGoals] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('anny_category_goals');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedCategoryForGoal, setSelectedCategoryForGoal] = useState<string | null>(null);
  const [editGoalValue, setEditGoalValue] = useState<string>('');

  const [isAnnyTyping, setIsAnnyTyping] = useState(false);

  
  // New State for Reminders, Alerts and Sync
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const saved = localStorage.getItem('anny_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [alerts, setAlerts] = useState<FinancialAlert[]>(() => {
    const saved = localStorage.getItem('anny_alerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('anny_notif_settings');
    return saved ? JSON.parse(saved) : {
      reminders: true,
      alerts: true,
      tips: true,
      lowBalanceThreshold: 500,
      budgetLimit: 2000
    };
  });
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMethod, setSyncMethod] = useState<'csv' | 'sms' | 'notif' | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<any[]>([]);
  
  console.log('App Render - User:', user ? user.email : 'null', 'Admin:', isAdmin);
  
  const isDashboardRoute = window.location.pathname === '/admin';

  const userName = user ? `${user.firstName} ${user.lastName}` : 'Gleydson';

  // Activity Filters
  const [actStart, setActStart] = useState('');
  const [actEnd, setActEnd] = useState('');
  const [actCat, setActCat] = useState('');
  const [actMin, setActMin] = useState('');
  const [actMax, setActMax] = useState('');
  const [showActFilters, setShowActFilters] = useState(false);

  // Dashboard Filters
  const [dashStart, setDashStart] = useState('');
  const [dashEnd, setDashEnd] = useState('');
  const [dashCat, setDashCat] = useState('');
  const [dashMin, setDashMin] = useState('');
  const [dashMax, setDashMax] = useState('');
  const [showDashFilters, setShowDashFilters] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

  // Reports Filters
  const [repStart, setRepStart] = useState('');
  const [repEnd, setRepEnd] = useState('');
  const [repCat, setRepCat] = useState('');
  const [repMin, setRepMin] = useState('');
  const [repMax, setRepMax] = useState('');
  const [showWebView, setShowWebView] = useState(false);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // Installment State (Parcelamento com Juros de Banco)
  const [isInstallment, setIsInstallment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'debito' | 'credito' | 'pix' | 'boleto'>('pix');
  const [installmentsCount, setInstallmentsCount] = useState<number>(5);
  const [selectedBankId, setSelectedBankId] = useState<string>('nubank');
  const [customInterestRate, setCustomInterestRate] = useState<string>('');
  const [scheduleAllInstallments, setScheduleAllInstallments] = useState<boolean>(true);

  // Despesas Fixas e Contas Recorrentes State
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>(() => {
    const saved = localStorage.getItem('anny_fixed_expenses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing fixed expenses:', e);
      }
    }
    return [];
  });

  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);
  const [fixedDesc, setFixedDesc] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [fixedCategory, setFixedCategory] = useState(CATEGORIES[0]);
  const [fixedDueDay, setFixedDueDay] = useState<number>(5);
  const [fixedNotes, setFixedNotes] = useState('');
  const [editingFixedId, setEditingFixedId] = useState<string | null>(null);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });

  const [isMonthPickerModalOpen, setIsMonthPickerModalOpen] = useState(false);
  const [monthPickerYear, setMonthPickerYear] = useState<number>(() => new Date().getFullYear());

  const getFormattedMonthLabel = (monthKey: string) => {
    const [yStr, mStr] = monthKey.split('-');
    const d = new Date(parseInt(yStr, 10), parseInt(mStr, 10) - 1, 1);
    const label = format(d, "MMMM 'de' yyyy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  };

  const getNextDueDate = (dueDay: number, monthKey: string) => {
    const [yStr, mStr] = monthKey.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10); // 1-12
    let nextM = m + 1;
    let nextY = y;
    if (nextM > 12) {
      nextM = 1;
      nextY += 1;
    }
    const day = Math.min(dueDay, 28);
    const dateObj = new Date(nextY, nextM - 1, day);
    return format(dateObj, 'dd/MM/yyyy');
  };

  const handlePrevMonth = () => {
    const [yStr, mStr] = selectedMonthKey.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonthKey(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [yStr, mStr] = selectedMonthKey.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonthKey(`${y}-${String(m).padStart(2, '0')}`);
  };

  useEffect(() => {
    localStorage.setItem('anny_fixed_expenses', JSON.stringify(fixedExpenses));
  }, [fixedExpenses]);

  const handleToggleFixedPaid = async (expense: FixedExpense, monthKey: string) => {
    const isAlreadyPaid = expense.paidMonths.includes(monthKey);
    let updatedPaidMonths: string[];

    const [yearStr, monthStr] = monthKey.split('-');
    const currentYear = parseInt(yearStr, 10);
    const currentMonthIdx = parseInt(monthStr, 10) - 1;
    const calcDate = new Date(currentYear, currentMonthIdx, Math.min(expense.dueDay, 28));
    const txDescription = `${expense.description} (Conta Fixa - ${monthStr}/${yearStr})`;

    if (isAlreadyPaid) {
      updatedPaidMonths = expense.paidMonths.filter(m => m !== monthKey);

      try {
        const existingTx = transactions.find(t => 
          t.description === txDescription || 
          (t.description.startsWith(expense.description) && t.category === expense.category && Math.abs(t.amount - expense.amount) < 0.01)
        );
        if (existingTx) {
          await fetchWithRetry(`/api/transactions/${existingTx.id}`, { method: 'DELETE' });
          fetchData();
        }
      } catch (err) {
        console.error('Error removing transaction for fixed expense:', err);
      }
    } else {
      updatedPaidMonths = [...expense.paidMonths, monthKey];

      try {
        await fetchWithRetry('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: txDescription,
            amount: expense.amount,
            type: 'expense',
            category: expense.category,
            date: calcDate.toISOString()
          })
        });
        fetchData();
      } catch (err) {
        console.error('Error auto-creating transaction for fixed expense:', err);
      }
    }

    setFixedExpenses(prev =>
      prev.map(item => item.id === expense.id ? { ...item, paidMonths: updatedPaidMonths } : item)
    );
  };

  const handleSaveFixedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixedDesc.trim() || !fixedAmount || parseFloat(fixedAmount) <= 0) return;

    if (editingFixedId) {
      setFixedExpenses(prev =>
        prev.map(item =>
          item.id === editingFixedId
            ? {
                ...item,
                description: fixedDesc.trim(),
                amount: parseFloat(fixedAmount),
                category: fixedCategory,
                dueDay: Math.min(31, Math.max(1, fixedDueDay)),
                notes: fixedNotes
              }
            : item
        )
      );
    } else {
      const newFixed: FixedExpense = {
        id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        description: fixedDesc.trim(),
        amount: parseFloat(fixedAmount),
        category: fixedCategory,
        dueDay: Math.min(31, Math.max(1, fixedDueDay)),
        paidMonths: [],
        notes: fixedNotes
      };
      setFixedExpenses(prev => [...prev, newFixed]);
    }

    setFixedDesc('');
    setFixedAmount('');
    setFixedDueDay(5);
    setFixedNotes('');
    setEditingFixedId(null);
    setIsFixedModalOpen(false);
  };

  const handleDeleteFixedExpense = (id: string) => {
    setFixedExpenses(prev => prev.filter(item => item.id !== id));
  };

  useEffect(() => {
    // Check for saved user
    try {
      const savedUser = localStorage.getItem('anny_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('anny_user');
    }
  }, []);

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    setAuthMode('login');
    setShowRegistration(false);
    setActiveTab('home');
    localStorage.removeItem('anny_user');
    setShowLogoutConfirm(false);
    // Se quiser limpar o parâmetro admin da URL
    if (window.location.search.includes('admin=true')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleLocalLogin = (email?: string, firstName?: string, lastName?: string) => {
    const userEmail = email || loginForm.email || 'usuario@startfinancas.com';
    const userFirstName = firstName || (userEmail.split('@')[0] || 'Gestor');
    const userLastName = lastName || 'Financeiro';
    const localUser = {
      id: 'local_' + Date.now(),
      email: userEmail,
      firstName: userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1),
      lastName: userLastName,
      age: '30',
      country: 'Brasil',
      state: 'PE',
      city: 'Recife',
      password: loginForm.password || '123456'
    };
    setUser(localUser);
    localStorage.setItem('anny_user', JSON.stringify(localUser));
    setLoginErrorMsg(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email.trim()) {
      setLoginErrorMsg("Por favor, preencha o campo de e-mail.");
      return;
    }

    setIsLoggingIn(true);
    setLoginErrorMsg(null);

    setTimeout(() => {
      const emailLower = loginForm.email.trim().toLowerCase();
      let firstName = 'Gestor';
      let lastName = 'Financeiro';

      if (emailLower.includes('admin')) {
        firstName = 'Admin';
        lastName = 'Start';
      } else {
        const parts = emailLower.split('@')[0].split('.');
        firstName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Gestor';
        if (parts[1]) {
          lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
        }
      }

      const localUser = {
        id: 'user_' + Date.now(),
        email: loginForm.email.trim(),
        firstName,
        lastName,
        age: '30',
        country: 'Brasil',
        state: 'PE',
        city: 'Recife',
        password: loginForm.password || '123456'
      };

      setUser(localUser);
      localStorage.setItem('anny_user', JSON.stringify(localUser));
      setIsLoggingIn(false);
    }, 300);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.email.trim()) {
      alert("Por favor, informe um e-mail válido.");
      return;
    }
    if (registrationForm.password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setIsLoggingIn(true);
    setLoginErrorMsg(null);

    setTimeout(() => {
      const localUser = {
        id: 'user_' + Date.now(),
        email: registrationForm.email.trim(),
        firstName: registrationForm.firstName.trim() || 'Usuário',
        lastName: registrationForm.lastName.trim() || 'Start',
        age: registrationForm.age || '30',
        country: registrationForm.country || 'Brasil',
        state: registrationForm.state || 'PE',
        city: registrationForm.city || 'Recife',
        password: registrationForm.password
      };

      setUser(localUser);
      localStorage.setItem('anny_user', JSON.stringify(localUser));
      setIsLoggingIn(false);
      setShowRegistration(false);
    }, 300);
  };

  // Automatic Sync Logic
  useEffect(() => {
    if (!user) return;
    
    const autoSync = () => {
      setIsSyncing(true);
      // Simulate sync delay
      setTimeout(() => {
        setIsSyncing(false);
        console.log('Automatic sync completed');
      }, 3000);
    };

    // Initial sync
    autoSync();

    // Periodic sync every 5 minutes
    const interval = setInterval(autoSync, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  // Intelligence Logic: Alerts and Tips
  useEffect(() => {
    if (!user || !notifSettings.alerts) return;

    const checkAlerts = () => {
      setAlerts(prevAlerts => {
        const balance = transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
        
        const newAlerts: FinancialAlert[] = [];

        // 1. Transaction-based Real Bank Notifications (Sem repetir a mesma transação)
        const sortedTransactionsByDate = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        sortedTransactionsByDate.forEach(t => {
          const alertId = `tx_${t.id}`;
          const existsInPrev = prevAlerts.some(a => a.id === alertId);
          const existsInNew = newAlerts.some(a => a.id === alertId);
          
          if (!existsInPrev && !existsInNew) {
            const banks = ['Nubank', 'Itaú', 'Inter', 'Bradesco', 'C6 Bank', 'Santander'];
            const bank = banks[t.id % banks.length];
            const formattedAmount = formatCurrency(t.amount);
            
            let message = '';
            if (t.type === 'expense') {
              const formats = [
                `[Bank]: Compra aprovada de [Amount] no estabelecimento "[Description]".`,
                `[Bank]: Transação de [Amount] confirmada em "[Description]" com sucesso.`,
                `Lançamento s/ Cartão [Bank]: [Amount] em "[Description]".`,
                `[Bank]: Compra parcelada ou à vista de [Amount] aprovada para "[Description]".`
              ];
              message = formats[t.id % formats.length]
                .replace('[Bank]', bank)
                .replace('[Amount]', formattedAmount)
                .replace('[Description]', t.description);
            } else {
              const formats = [
                `[Bank]: Pix recebido no valor de [Amount] enviado por "[Description]".`,
                `[Bank]: Depósito de [Amount] efetuado e liberado por "[Description]".`,
                `Crédito recebido [Bank]: Transferência Pix de [Amount] originada de "[Description]".`,
                `[Bank]: Sua conta recebeu um Pix de [Amount] enviado de "[Description]".`
              ];
              message = formats[t.id % formats.length]
                .replace('[Bank]', bank)
                .replace('[Amount]', formattedAmount)
                .replace('[Description]', t.description);
            }

            newAlerts.push({
              id: alertId,
              type: t.type === 'expense' ? 'high_spending' : 'budget_limit',
              message,
              timestamp: t.date || new Date().toISOString(),
              read: false
            });
          }
        });

        // 2. Low Balance Alert
        if (balance < notifSettings.lowBalanceThreshold) {
          const lowBalanceId = `alert_low_balance_${new Date().toDateString().replace(/\s+/g, '_')}`;
          const existsInPrev = prevAlerts.some(a => a.id === lowBalanceId);
          const existsInNew = newAlerts.some(a => a.id === lowBalanceId);
          if (!existsInPrev && !existsInNew) {
            newAlerts.push({
              id: lowBalanceId,
              type: 'low_balance',
              message: `Atenção! Seu saldo consolidado está abaixo do ideal de ${formatCurrency(notifSettings.lowBalanceThreshold)}.`,
              timestamp: new Date().toISOString(),
              read: false
            });
          }
        }

        // 3. Budget Near Alert
        if (totalExpense > notifSettings.budgetLimit * 0.9) {
          const budgetNearId = `alert_budget_near_${new Date().toDateString().replace(/\s+/g, '_')}`;
          const existsInPrev = prevAlerts.some(a => a.id === budgetNearId);
          const existsInNew = newAlerts.some(a => a.id === budgetNearId);
          if (!existsInPrev && !existsInNew) {
            newAlerts.push({
              id: budgetNearId,
              type: 'budget_near',
              message: `Alerta financeiro: Você atingiu 90% do seu limite de orçamento mensal (${formatCurrency(notifSettings.budgetLimit)}).`,
              timestamp: new Date().toISOString(),
              read: false
            });
          }
        }

        // 4. Automatic Anny Intelligent Insights (Gerados e Notificados sem repetição)
        const currentAnnyInsights = generateAnnyInsights(transactions, goalsList, fixedExpenses);
        const seenInsightTextsStr = localStorage.getItem('anny_seen_insight_texts');
        const seenInsightTexts: string[] = seenInsightTextsStr ? JSON.parse(seenInsightTextsStr) : [];

        currentAnnyInsights.forEach(insight => {
          if (!seenInsightTexts.includes(insight.text)) {
            const insightMsg = `✨ Insight da Anny (${insight.tag}): ${insight.text}`;
            const existsInPrev = prevAlerts.some(a => a.message === insightMsg);
            const existsInNew = newAlerts.some(a => a.message === insightMsg);

            if (!existsInPrev && !existsInNew) {
              newAlerts.push({
                id: `anny_insight_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                type: 'budget_near' as any,
                message: insightMsg,
                timestamp: new Date().toISOString(),
                read: false
              });
              seenInsightTexts.push(insight.text);
            }
          }
        });
        localStorage.setItem('anny_seen_insight_texts', JSON.stringify(seenInsightTexts));

        if (newAlerts.length > 0) {
          // Sort new alerts by timestamp desc so newest appear first
          const sortedNewAlerts = [...newAlerts].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const updatedAlerts = [...sortedNewAlerts, ...prevAlerts].slice(0, 50);
          localStorage.setItem('anny_alerts', JSON.stringify(updatedAlerts));
          return updatedAlerts;
        }

        return prevAlerts;
      });
    };

    checkAlerts();
  }, [transactions, notifSettings, user]);

  // Save settings and reminders to localStorage
  useEffect(() => {
    localStorage.setItem('anny_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('anny_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

  useEffect(() => {
    localStorage.setItem('anny_category_goals', JSON.stringify(categoryGoals));
  }, [categoryGoals]);

  const fetchData = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetchWithRetry('/api/transactions'),
        fetchWithRetry('/api/stats')
      ]);
      if (tRes.ok && sRes.ok) {
        const tData = await tRes.json();
        const sData = await sRes.json();
        setTransactions(tData);
        setStats(sData);
      } else {
        console.warn('Silent local fetch notice: Server is initializing database records. Standard for empty lists.');
      }
    } catch (error: any) {
      console.warn('Local database is currently busy or reloading. Notice:', error.message || error);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Fetch chat history
    const fetchChat = () => {
      fetchWithRetry(`/api/chat/${chatRoom}`)
        .then(res => res.json())
        .then(data => {
          setChatMessages(prev => {
            if (JSON.stringify(prev) !== JSON.stringify(data)) {
              return data;
            }
            return prev;
          });
        })
        .catch(err => console.log('Error fetching chat history fallback:', err.message));
    };

    fetchChat();

    // Fallback polling for chat messages when Socket is disconnected
    const pollingInterval = setInterval(() => {
      if (!newSocket || !newSocket.connected) {
        fetchChat();
      }
    }, 3000);

    const newSocket = io(window.location.origin, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    setSocket(newSocket);
    
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      newSocket.emit('join_room', chatRoom);
    });

    newSocket.on('connect_error', (err) => {
      // Quiet expected error log since HTTP fallback is active
      console.log('Socket not connected, using HTTP REST fallback:', err.message);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('receive_message', (data) => {
      setChatMessages(prev => {
        if (prev.some(m => m.timestamp === data.timestamp && m.text === data.text)) {
          return prev;
        }
        return [...prev, data];
      });
    });

    newSocket.on('anny_typing', ({ isTyping }) => {
      setIsAnnyTyping(isTyping);
    });

    newSocket.on('admin_notification', (data) => {
      if (isAdmin) {
        // Show a system message or notification to the admin
        const notificationMsg = {
          room: data.room,
          sender: 'Sistema',
          text: `🔔 NOVO CHAMADO: O usuário ${data.userName} está solicitando atendimento.`,
          timestamp: new Date().toISOString(),
          isSystem: true
        };
        setChatMessages(prev => [...prev, notificationMsg]);
        
        // If the admin is not in the room, they might need a way to see this.
        // For now, since it's a single-admin setup, we'll just add it to the chat if they are in the app.
      }
    });

    newSocket.on('service_ended', () => {
      if (!isAdmin) {
        setShowRating(true);
        setShowMenu(true); // Reset menu for next interaction
      }
    });

    if (isAdmin) {
      setShowHelpChat(true);
    }

    return () => {
      newSocket.close();
      clearInterval(pollingInterval);
    };
  }, [chatRoom, isAdmin]);

  const handleSendMessage = (text: string, sender: string = 'user', file?: { data: string, type: string }) => {
    if (!text.trim() && !file) return;

    const currentHealth = calculateFinancialHealth(transactions, goalsList, fixedExpenses);
    const financialContext = {
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      healthScore: currentHealth.score,
      healthLabel: currentHealth.label,
      goals: goalsList.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        category: g.category || 'Sonhos'
      })),
      fixedExpenses: fixedExpenses.map(f => ({
        id: f.id,
        description: f.description,
        amount: f.amount,
        dueDay: f.dueDay,
        category: f.category
      }))
    };

    const messageData = {
      room: chatRoom,
      sender,
      text,
      timestamp: new Date().toISOString(),
      isSystem: false,
      userName: sender === 'user' ? userName : undefined,
      financialContext: sender === 'user' ? financialContext : undefined,
      fileData: file?.data,
      fileType: file?.type
    };

    if (socket && socket.connected) {
      socket.emit('send_message', messageData);
    } else {
      // HTTP Rest fallback
      fetchWithRetry(`/api/chat/${chatRoom}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData)
      })
      .then(res => res.json())
      .then(sentMsg => {
        setChatMessages(prev => {
          if (prev.some(m => m.timestamp === sentMsg.timestamp && m.text === sentMsg.text)) {
            return prev;
          }
          return [...prev, sentMsg];
        });
      })
      .catch(err => console.log('Error sending message via fallback URL:', err.message));
    }

    setChatInput('');
    setShowMenu(false);

    // Attendant flow
    if (text.toLowerCase().includes('atendente')) {
      setIsAnnyTyping(true);
      setTimeout(() => {
        setIsAnnyTyping(false);
        const waitMsg = {
          id: Date.now() + 1,
          text: "Estou conectando você a um de nossos especialistas. Por favor, aguarde um momento...",
          sender: 'anny',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, waitMsg]);
        
        setTimeout(() => {
          const connectedMsg = {
            id: Date.now() + 2,
            text: "Olá! Sou o consultor financeiro da Start. Como posso ajudar você hoje?",
            sender: 'admin',
            timestamp: new Date().toISOString()
          };
          setChatMessages(prev => [...prev, connectedMsg]);
        }, 3000);
      }, 1500);
      return;
    }

    const lowerText = text.toLowerCase();

    // Check for attendant trigger
    const isAttendantRequest = (
      lowerText.includes('falar com um atendente') || 
      lowerText.includes('falar com o atendente') ||
      lowerText.includes('falar com atendente')
    );

    if (isAttendantRequest && sender === 'user' && !hasNotifiedAdmin) {
      setIsWaitingForAttendant(true);
      setHasNotifiedAdmin(true);
      
      const systemMsg = {
        room: chatRoom,
        sender: 'Anny',
        text: 'Entendido! Estou notificando um atendente agora. Por favor, aguarde um momento enquanto ele se conecta ao chat.',
        timestamp: new Date().toISOString(),
        isSystem: true
      };

      if (socket && socket.connected) {
        socket.emit('send_message', systemMsg);
        socket.emit('request_attendant', {
          room: chatRoom,
          userName: userName,
          text: text
        });
      } else {
        // HTTP REST fallback for system message and request
        fetchWithRetry(`/api/chat/${chatRoom}/message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(systemMsg)
        }).catch(e => console.log('Error sending system status message:', e.message));

        fetchWithRetry(`/api/chat/${chatRoom}/request_attendant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName, text })
        }).catch(e => console.log('Error requesting attendant HTTP:', e.message));
      }
    }
  };

  const handleEndService = () => {
    // Also send a system message
    const systemMsg = {
      room: chatRoom,
      sender: 'Sistema',
      text: `O atendimento foi finalizado pelo ${isAdmin ? 'atendente' : 'usuário'}.`,
      timestamp: new Date().toISOString(),
      isSystem: true
    };

    if (socket && socket.connected) {
      socket.emit('service_ended', chatRoom);
      socket.emit('send_message', systemMsg);
    } else {
      // HTTP Fallbacks
      fetchWithRetry(`/api/chat/${chatRoom}/service_ended`, {
        method: 'POST'
      }).catch(e => console.log('Error ending service via HTTP:', e.message));

      fetchWithRetry(`/api/chat/${chatRoom}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemMsg)
      }).catch(e => console.log('Error sending end of service system message:', e.message));
    }

    // If user ends it, show rating immediately
    if (!isAdmin) {
      setShowRating(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleSendMessage('', 'user', { data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return;
    
    try {
      await fetchWithRetry('/api/chat/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: chatRoom,
          rating,
          comment: ratingComment,
          timestamp: new Date().toISOString()
        })
      });
      setRatingSubmitted(true);
      setTimeout(() => {
        setShowRating(false);
        setShowHelpChat(false);
        // Reset rating state for next time
        setRating(0);
        setRatingComment('');
        setRatingSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const finalCategory = isCustomCategory ? customCategoryName : category;
    if (!finalCategory) return;

    const pmLabel = paymentMethod === 'debito' ? 'Débito' 
      : paymentMethod === 'credito' ? 'Crédito' 
      : paymentMethod === 'boleto' ? 'Boleto' : 'PIX';

    try {
      if (type === 'expense' && isInstallment && parseFloat(amount) > 0 && installmentsCount > 1) {
        const numInstallments = Math.max(1, installmentsCount);
        const selectedBank = BANK_RATES.find(b => b.id === selectedBankId) || BANK_RATES[0];
        const rateToUse = customInterestRate !== '' && !isNaN(parseFloat(customInterestRate))
          ? Math.max(0, parseFloat(customInterestRate))
          : selectedBank.averageMonthlyInterest;

        const calc = calculateInstallments(parseFloat(amount), numInstallments, rateToUse);
        const monthlyVal = parseFloat(calc.monthlyPayment.toFixed(2));

        // 1st installment added as immediate transaction
        const firstInstDesc = `${description} (1/${numInstallments}x - ${selectedBank.name}) • ${pmLabel}`;
        await fetchWithRetry('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: firstInstDesc,
            amount: monthlyVal,
            type: 'expense',
            category: finalCategory,
            date: new Date().toISOString()
          })
        });

        // Remaining installments (2..N) added to Contas Fixas
        const newFixedItems: FixedExpense[] = [];
        const today = new Date();
        const dueDay = Math.min(28, Math.max(1, today.getDate()));

        for (let k = 2; k <= numInstallments; k++) {
          const item: FixedExpense = {
            id: `fix_inst_${Date.now()}_${k}_${Math.random().toString(36).substr(2, 4)}`,
            description: `${description} (${k}/${numInstallments}x - ${selectedBank.name})`,
            amount: monthlyVal,
            category: finalCategory,
            dueDay: dueDay,
            paidMonths: [],
            notes: `Fatura ${k}/${numInstallments} parcelada no cartão ${selectedBank.name} (${pmLabel})`
          };
          newFixedItems.push(item);
        }

        setFixedExpenses(prev => [...prev, ...newFixedItems]);
        showToast(`💳 1ª parcela registrada! As demais ${numInstallments - 1} faturas foram enviadas para Contas Fixas.`);
      } else {
        const fullDesc = `${description} • ${pmLabel}`;
        await fetchWithRetry('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: fullDesc,
            amount: parseFloat(amount),
            type,
            category: finalCategory,
            date: new Date().toISOString()
          })
        });
        showToast('✅ Transação registrada com sucesso!');
      }
      
      setDescription('');
      setAmount('');
      setCategory(CATEGORIES[0]);
      setIsCustomCategory(false);
      setCustomCategoryName('');
      setIsInstallment(false);
      setInstallmentsCount(5);
      setSelectedBankId('nubank');
      setCustomInterestRate('');
      setScheduleAllInstallments(true);
      setPaymentMethod('pix');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
      showToast('❌ Erro ao registrar transação.');
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    try {
      await fetchWithRetry(`/api/transactions/${id}`, { method: 'DELETE' });
      setTransactionToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionToEdit) return;
    if (!editDescription || !editAmount || isNaN(parseFloat(editAmount))) {
      alert("Por favor, preencha todos os campos com valores válidos.");
      return;
    }

    try {
      await fetchWithRetry(`/api/transactions/${transactionToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editDescription,
          amount: parseFloat(editAmount),
          type: editType,
          category: editCategory
        })
      });
      
      setTransactionToEdit(null);
      fetchData();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const applyFilters = (list: Transaction[], f: { start: string, end: string, cat: string, min: string, max: string }) => {
    return list.filter(t => {
      const date = new Date(t.date);
      const start = f.start ? new Date(f.start) : null;
      const end = f.end ? new Date(f.end) : null;
      
      if (start && date < start) return false;
      if (end && date > end) return false;
      if (f.cat && t.category !== f.cat) return false;
      if (f.min && t.amount < parseFloat(f.min)) return false;
      if (f.max && t.amount > parseFloat(f.max)) return false;
      
      return true;
    });
  };

  const filteredActivity = applyFilters(transactions, { start: actStart, end: actEnd, cat: actCat, min: actMin, max: actMax });
  const filteredDash = applyFilters(transactions, { start: dashStart, end: dashEnd, cat: dashCat, min: dashMin, max: dashMax });
  const filteredReports = applyFilters(transactions, { start: repStart, end: repEnd, cat: repCat, min: repMin, max: repMax });

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableData = filteredReports.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.description,
      t.category,
      t.type === 'income' ? 'Receita' : 'Despesa',
      formatCurrency(t.amount)
    ]);

    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald-500
    });

    doc.save(`relatorio-financas-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
    setShowReportMenu(false);
  };

  const exportToExcel = () => {
    const data = filteredReports.map(t => ({
      Data: format(new Date(t.date), 'dd/MM/yyyy'),
      Descrição: t.description,
      Categoria: t.category,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Valor: t.amount
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-financas-${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
    setShowReportMenu(false);
  };

  const balance = totalIncome - totalExpense;
  const incomeVsExpenseRatio = totalIncome > 0 ? Math.max(0, ((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  // Forecast and Investment States
  const [forecastStart, setForecastStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [forecastEnd, setForecastEnd] = useState(format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [forecastCat, setForecastCat] = useState('');
  const [forecastMin, setForecastMin] = useState('');
  const [forecastMax, setForecastMax] = useState('');

  const INVESTMENT_OPTIONS = [
    { 
      name: 'Poupança', 
      risk: 'Baixo', 
      liquidity: 'Imediata', 
      usage: 'Reserva de emergência', 
      explanation: 'A opção mais tradicional e simples. O dinheiro pode ser retirado a qualquer momento.',
      yield: '0,5% ao mês + TR'
    },
    { 
      name: 'CDB Liquidez Diária', 
      risk: 'Baixo', 
      liquidity: 'Diária', 
      usage: 'Reserva de emergência / Curto prazo', 
      explanation: 'Empréstimo para o banco que rende mais que a poupança e permite saque diário.',
      yield: '100% do CDI'
    },
    { 
      name: 'Tesouro Selic', 
      risk: 'Baixo', 
      liquidity: 'D+1 (1 dia útil)', 
      usage: 'Reserva de emergência / Médio prazo', 
      explanation: 'Empréstimo para o governo federal. É considerado o investimento mais seguro do país.',
      yield: 'Taxa Selic'
    },
    { 
      name: 'Contas Remuneradas', 
      risk: 'Baixo', 
      liquidity: 'Imediata', 
      usage: 'Dinheiro do dia a dia', 
      explanation: 'Dinheiro parado na conta que rende automaticamente uma porcentagem do CDI.',
      yield: '100% do CDI'
    },
  ];

  const ANNY_TIPS = [
    "Construa sua reserva de emergência antes de começar a investir em opções mais arriscadas.",
    "Evite investir dinheiro que você pode precisar no curto prazo em opções sem liquidez imediata.",
    "A diversificação é a chave para reduzir riscos: não coloque todos os seus ovos na mesma cesta.",
    "Segurança financeira básica começa com um bom controle de gastos mensais.",
    "Pequenas economias hoje se transformam em grandes conquistas amanhã. Comece com o que você tem!",
    "Antes de investir, livre-se de dívidas com juros altos, como cartão de crédito e cheque especial."
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % ANNY_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const getForecastData = () => {
    const now = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    
    // Filtro básico para histórico
    let filteredHistorical = transactions.filter(t => 
      new Date(t.date) >= fifteenDaysAgo && t.type === 'expense'
    );

    // Insights de Categorias
    const categoryTotals: Record<string, number> = {};
    filteredHistorical.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    const impactfulCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Geral';

    // Comparação Semanal
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const thisWeekExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
      .reduce((acc, t) => acc + t.amount, 0);
    
    const lastWeekExpense = transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= twoWeeksAgo && new Date(t.date) < oneWeekAgo)
      .reduce((acc, t) => acc + t.amount, 0);

    const weekDiff = lastWeekExpense > 0 ? ((thisWeekExpense - lastWeekExpense) / lastWeekExpense) * 100 : 0;

    // Filtros do usuário para a projeção
    let projectionHistorical = filteredHistorical;
    if (forecastCat) projectionHistorical = projectionHistorical.filter(t => t.category === forecastCat);
    if (forecastMin) projectionHistorical = projectionHistorical.filter(t => t.amount >= parseFloat(forecastMin));
    if (forecastMax) projectionHistorical = projectionHistorical.filter(t => t.amount <= parseFloat(forecastMax));
    
    const totalSpentInPeriod = projectionHistorical.reduce((acc, t) => acc + t.amount, 0);
    const dailyAverage = totalSpentInPeriod / 15;
    
    const forecast = [];
    let currentBalance = balance;
    
    const start = new Date(forecastStart);
    const end = new Date(forecastEnd);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= Math.min(days, 60); i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      forecast.push({
        date: format(date, 'dd/MM'),
        balance: currentBalance,
        spent: dailyAverage
      });
      currentBalance -= dailyAverage;
    }
    
    return {
      data: forecast,
      impactfulCategory,
      thisWeekExpense,
      lastWeekExpense,
      weekDiff,
      dailyAverage
    };
  };

  const forecastResult = getForecastData();
  const forecastData = forecastResult.data;
  const willBeNegative = forecastData.some(d => d.balance < 0);
  const negativeDate = forecastData.find(d => d.balance < 0)?.date;
  const impactfulCategory = forecastResult.impactfulCategory;
  const weekDiff = forecastResult.weekDiff;

  const filteredStats = CATEGORIES.map(cat => {
    const total = filteredDash
      .filter(t => t.category === cat && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { category: cat, total };
  }).filter(s => s.total > 0);

  const filteredDashTotalExpense = filteredDash
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const lastExpenses = transactions
    .filter(t => t.type === 'expense')
    .slice(0, 10);

  const formatValue = (val: number) => {
    if (!showValues) return 'R$ ***,**';
    return formatCurrency(val);
  };

  const FilterBar = ({ 
    show, 
    start, setStart, 
    end, setEnd, 
    cat, setCat, 
    min, setMin, 
    max, setMax 
  }: any) => (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: show ? 'auto' : 0, opacity: show ? 1 : 0 }}
      className="overflow-hidden"
    >
      <div className={cn("p-4 rounded-2xl border mb-6 space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Data de Início</label>
            <input 
              type="date" 
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className={cn("w-full border-none rounded-lg p-2 text-[10px]", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Data de Fim</label>
            <input 
              type="date" 
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className={cn("w-full border-none rounded-lg p-2 text-[10px]", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Categoria</label>
          <select 
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className={cn("w-full border-none rounded-lg p-2 text-[10px] appearance-none", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")}
          >
            <option value="">Todas</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Mín.</label>
            <input 
              type="number" 
              placeholder="R$ 0"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className={cn("w-full border-none rounded-lg p-2 text-[10px]", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
            />
          </div>
          <div className="space-y-1">
            <label className={cn("text-[9px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Máx.</label>
            <input 
              type="number" 
              placeholder="R$ 10k"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className={cn("w-full border-none rounded-lg p-2 text-[10px]", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
            />
          </div>
        </div>
        
        <button 
          onClick={() => {
            setStart('');
            setEnd('');
            setCat('');
            setMin('');
            setMax('');
          }}
          className="w-full py-2 text-[10px] font-bold text-zinc-400 uppercase hover:text-rose-500 transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </motion.div>
  );

  const handleForgotPassword = () => {
    // Usando um modal customizado ou apenas um feedback visual melhor
    const email = loginForm.email;
    if (!email) {
      alert("Por favor, preencha o campo de e-mail primeiro.");
      return;
    }
    alert(`Um link de redefinição de senha foi enviado para ${email}. Verifique sua caixa de entrada.`);
  };

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) {
      alert("Seu dispositivo não suporta autenticação biométrica no navegador.");
      return;
    }
    
    const savedUser = localStorage.getItem('anny_user');
    if (!savedUser) {
      alert("Por favor, faça login manualmente primeiro para habilitar a biometria.");
      return;
    }

    // Simulação de autenticação biométrica bem-sucedida
    setTimeout(() => {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      alert(`Bem-vindo de volta, ${userData.firstName}! Autenticação biométrica realizada com sucesso.`);
    }, 1000);
  };

  if (isDashboardRoute) {
    return <AdminDashboard />;
  }

  if (!user && !isAdmin) {
    return (
      <div className="h-screen w-full relative overflow-hidden bg-black flex items-center justify-center p-6">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ 
            backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
            filter: 'blur(4px) brightness(0.4)'
          }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 w-full max-w-md space-y-8"
        >
          {/* Logo & Slogan */}
          <div className="text-center space-y-2">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="inline-flex p-4 rounded-3xl bg-emerald-500/20 backdrop-blur-xl border border-emerald-500/30 mb-4"
            >
              <Wallet size={48} className="text-emerald-400" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
              Start <span className="text-emerald-500">Finanças</span>
            </h1>
            <p className="text-zinc-400 font-medium tracking-wide">
              Organize hoje. Conquiste amanhã.
            </p>
          </div>

          {/* Auth Card */}
          <div className="p-8 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-2xl bg-white/5">
            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                {loginErrorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold space-y-1 flex items-start gap-2.5"
                  >
                    <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-medium leading-relaxed">{loginErrorMsg}</p>
                  </motion.div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="seu@email.com"
                    className="w-full p-4 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white/5 text-white placeholder:text-zinc-600"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Senha</label>
                    <button 
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="w-full p-4 pr-12 rounded-2xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-white/5 text-white placeholder:text-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-emerald-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoggingIn}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isLoggingIn ? "Entrando..." : "Entrar na Conta"}
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleBiometricAuth}
                    className="p-4 rounded-2xl font-bold border border-white/10 bg-white/5 hover:bg-white/10 text-emerald-500 transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Fingerprint size={24} />
                  </motion.button>
                </div>
                
                <div className="pt-2 text-center space-y-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className="text-xs font-bold text-zinc-400 hover:text-emerald-300 uppercase tracking-widest underline underline-offset-4 cursor-pointer block w-full"
                  >
                    Não tem uma conta? Cadastre-se
                  </motion.button>
                  
                  <div 
                    onClick={() => handleLocalLogin('admin@admin.com', 'Admin', 'Start')}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer group"
                  >
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1 group-hover:text-emerald-300">⚡ Acesso Rápido de Teste (Clique aqui para entrar):</p>
                    <div className="flex justify-center gap-4 text-[11px] text-zinc-400">
                      <p>E-mail: <span className="text-white font-mono">admin@admin.com</span></p>
                      <p>Senha: <span className="text-white font-mono">admin123</span></p>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 text-left max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={registrationForm.email}
                    onChange={(e) => setRegistrationForm({...registrationForm, email: e.target.value})}
                    className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Senha</label>
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    value={registrationForm.password}
                    onChange={(e) => setRegistrationForm({...registrationForm, password: e.target.value})}
                    className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Nome</label>
                    <input 
                      type="text" 
                      required
                      value={registrationForm.firstName}
                      onChange={(e) => setRegistrationForm({...registrationForm, firstName: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Sobrenome</label>
                    <input 
                      type="text" 
                      required
                      value={registrationForm.lastName}
                      onChange={(e) => setRegistrationForm({...registrationForm, lastName: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Idade</label>
                    <input 
                      type="number" 
                      required
                      value={registrationForm.age}
                      onChange={(e) => setRegistrationForm({...registrationForm, age: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">País</label>
                    <input 
                      type="text" 
                      required
                      value={registrationForm.country}
                      onChange={(e) => setRegistrationForm({...registrationForm, country: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Estado</label>
                    <input 
                      type="text" 
                      required
                      value={registrationForm.state}
                      onChange={(e) => setRegistrationForm({...registrationForm, state: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest pl-1 text-zinc-400">Cidade</label>
                    <input 
                      type="text" 
                      required
                      value={registrationForm.city}
                      onChange={(e) => setRegistrationForm({...registrationForm, city: e.target.value})}
                      className="w-full p-3 rounded-xl border border-white/10 outline-none focus:ring-2 focus:ring-emerald-500 bg-white/5 text-white"
                    />
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                >
                  {isLoggingIn ? "Cadastrando..." : "Criar Minha Conta"}
                </motion.button>
                <div className="text-center">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest underline underline-offset-4"
                  >
                    Já tem uma conta? Login
                  </motion.button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col h-screen w-full relative overflow-hidden transition-colors duration-300",
      isDark ? "bg-zinc-950" : "bg-white"
    )}>
      {/* Header Section (Parte Superior) */}
      <header className={cn(
        "px-6 pt-4 pb-3 z-20 transition-colors duration-300 w-full shrink-0",
        isDark ? "bg-zinc-950" : "bg-white"
      )}>
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowLogoutConfirm(true)}
                className={cn(
                  "p-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 group",
                  isDark ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-white text-rose-600 border border-zinc-100 hover:bg-rose-50 shadow-2xs"
                )}
              >
                <LogOut size={18} />
              </button>
              <button 
                onClick={() => setShowNotifSettings(true)}
                className={cn(
                  "p-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 relative",
                  isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 hover:bg-zinc-50 shadow-2xs"
                )}
              >
                <Bell size={18} />
                {alerts.some(a => !a.read) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-zinc-950" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleOpenProfileModal}
                className={cn(
                  "p-2 rounded-xl flex items-center gap-2 transition-all active:scale-95",
                  isDark ? "bg-zinc-800 text-emerald-400 hover:bg-zinc-700" : "bg-white text-emerald-600 border border-zinc-100 hover:bg-emerald-50 shadow-2xs"
                )}
                title="Configurações e Perfil"
              >
                <User size={18} />
              </button>
              <button 
                onClick={() => setShowHelpChat(true)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95",
                  isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 hover:bg-zinc-50 shadow-2xs"
                )}
                title="Ajuda e Suporte"
              >
                <HelpCircle size={18} />
              </button>
              <button 
                onClick={() => setShowValues(!showValues)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95",
                  isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 hover:bg-zinc-50 shadow-2xs"
                )}
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
              >
                {showValues ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <button 
                onClick={() => setIsDark(!isDark)}
                className={cn(
                  "p-2 rounded-xl transition-all active:scale-95",
                  isDark ? "bg-zinc-800 text-yellow-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 hover:bg-zinc-50 shadow-2xs"
                )}
                title="Alternar Tema"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5 flex-wrap">
                <span>{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</span>
              </p>
              <h1 className={cn("text-2xl font-black tracking-tight", isDark ? "text-white" : "text-zinc-900")}>
                {getTimeGreeting()}, {user?.firstName || 'Gestor'}!
              </h1>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium italic mt-1.5 flex items-center gap-1.5">
                <Sparkles size={13} className="shrink-0 text-amber-500 animate-pulse" />
                <span>"{getDailyQuote()}"</span>
              </p>
            </div>
          </div>

          {/* Fixed Balance & Expenses Colored Cards (Home Header) */}
          {activeTab === 'home' && (
            <motion.div 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {/* 1. Quanto tenho? (Verde) & 2. Quanto gastei? (Vermelho) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Saldo Card (Verde com gradiente e gráfico sutil) */}
                <div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden transition-all border border-emerald-500/30"
                >
                  <TrendingUp className="absolute -right-3 -bottom-3 text-white/10 w-20 h-20 pointer-events-none" />
                  <div className="flex items-center justify-between mb-1 relative z-10">
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest flex items-center gap-1">
                      <Wallet size={12} /> Saldo
                    </p>
                    <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight truncate relative z-10">
                    {formatValue(balance)}
                  </h2>
                  <p className="text-[10px] text-emerald-200 font-medium mt-0.5 relative z-10 flex items-center gap-1">
                    <span>▲ Saldo Atual</span>
                  </p>
                </div>

                {/* Gastos Card (Vermelho com gradiente e gráfico sutil) */}
                <div 
                  className="p-4 rounded-2xl bg-gradient-to-br from-rose-600 via-rose-600 to-red-700 text-white shadow-lg shadow-rose-600/20 relative overflow-hidden transition-all border border-rose-500/30"
                >
                  <TrendingDown className="absolute -right-3 -bottom-3 text-white/10 w-20 h-20 pointer-events-none" />
                  <div className="flex items-center justify-between mb-1 relative z-10">
                    <p className="text-[10px] font-bold text-rose-100 uppercase tracking-widest flex items-center gap-1">
                      <ArrowDownCircle size={12} /> Gastos
                    </p>
                    <span className="w-2 h-2 rounded-full bg-rose-300" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black tracking-tight truncate relative z-10">
                    {formatValue(totalExpense)}
                  </h2>
                  <p className="text-[10px] text-rose-200 font-medium mt-0.5 relative z-10">
                    <span>▼ Neste Mês</span>
                  </p>
                </div>
              </div>

              {/* Indicadores Rápidos de Evolução Financeira */}
              <div className={cn(
                "p-2.5 rounded-xl border flex items-center justify-around gap-2 shadow-xs text-[10px] font-bold",
                isDark ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" : "bg-white/90 border-zinc-100 text-zinc-700 shadow-xs"
              )}>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <TrendingUp size={12} />
                  <span>▲ Economia: {incomeVsExpenseRatio > 0 ? `${incomeVsExpenseRatio.toFixed(0)}%` : 'Ok'}</span>
                </div>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                  <span>▲ Saldo: {balance >= 0 ? 'Positivo' : 'Alerta'}</span>
                </div>
                <div className="w-px h-3 bg-zinc-200 dark:bg-zinc-800" />
                <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
                  <Target size={12} />
                  <span>▲ Metas: {goalsList.length} ativas</span>
                </div>
              </div>


            </motion.div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main 
        className="flex-1 overflow-y-auto px-6 pb-24 no-scrollbar w-full"
        onTouchStart={(e) => {
          const touch = e.touches[0];
          (window as any).swipeStartX = touch.clientX;
          (window as any).swipeStartY = touch.clientY;
        }}
        onTouchEnd={(e) => {
          const touch = e.changedTouches[0];
          const swipeEndX = touch.clientX;
          const swipeEndY = touch.clientY;
          const swipeStartX = (window as any).swipeStartX;
          const swipeStartY = (window as any).swipeStartY;
          
          if (swipeStartX === undefined || swipeStartY === undefined) return;

          const diffX = swipeStartX - swipeEndX;
          const diffY = swipeStartY - swipeEndY;
          const threshold = 50;

          const tabs: ('home' | 'fixed' | 'activity' | 'dashboard' | 'investments' | 'forecast' | 'reports')[] = ['home', 'fixed', 'activity', 'dashboard', 'investments', 'forecast', 'reports'];
          const currentIndex = tabs.indexOf(activeTab as any);

          // Only trigger if horizontal movement is significantly greater than vertical
          if (Math.abs(diffX) > threshold && Math.abs(diffX) > Math.abs(diffY) * 2.0) {
            if (diffX > 0 && currentIndex < tabs.length - 1) {
              // Swipe Left -> Next Tab
              setActiveTab(tabs[currentIndex + 1]);
            } else if (diffX < 0 && currentIndex > 0) {
              // Swipe Right -> Previous Tab
              setActiveTab(tabs[currentIndex - 1]);
            }
          }
          
          // Reset
          (window as any).swipeStartX = undefined;
          (window as any).swipeStartY = undefined;
        }}
      >
        <div className="max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-8"
            >


              {/* Last 10 Expenses */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className={cn("font-bold", isDark ? "text-white" : "text-black")}>Últimos Gastos</h3>
                  <span className="text-xs text-zinc-400 font-medium">Top 10</span>
                </div>
                <div className="space-y-3">
                  {lastExpenses.map((t, index) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={t.id} 
                      onClick={() => {
                        setTransactionToEdit(t);
                        setEditDescription(t.description);
                        setEditAmount(t.amount.toString());
                        setEditCategory(t.category);
                        setEditType(t.type);
                      }}
                      className={cn(
                        "p-4 rounded-2xl flex items-center justify-between shadow-sm border cursor-pointer transition-all", 
                        isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                          <ArrowDownCircle size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }} />
                            <p className={cn("font-semibold text-sm", isDark ? "text-zinc-100" : "text-black")}>
                              <span className="mr-1.5">{getCategoryIcon(t.category)}</span>
                              {t.description}
                            </p>
                          </div>
                          <p className="text-zinc-400 text-xs">{t.category} • {format(new Date(t.date), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>
                      <p className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                        -{formatValue(t.amount)}
                      </p>
                    </motion.div>
                  ))}
                  {lastExpenses.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "text-center py-10 px-6 rounded-2xl border space-y-3 shadow-sm",
                        isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                      )}
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Sparkles size={22} />
                      </div>
                      <h3 className={cn("text-sm font-bold", isDark ? "text-white" : "text-zinc-900")}>
                        Nenhum gasto registrado.
                      </h3>
                      <p className={cn("text-xs max-w-xs mx-auto", isDark ? "text-zinc-400" : "text-zinc-500")}>
                        Adicione seu primeiro gasto para começar.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => {
                            setType('expense');
                            setIsModalOpen(true);
                          }}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
                        >
                          <Plus size={16} />
                          <span>Adicionar gasto</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Atividades</h3>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowActFilters(!showActFilters)}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    showActFilters ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Search size={18} />
                </motion.button>
              </div>

              <FilterBar 
                show={showActFilters}
                start={actStart} setStart={setActStart}
                end={actEnd} setEnd={setActEnd}
                cat={actCat} setCat={setActCat}
                min={actMin} setMin={setActMin}
                max={actMax} setMax={setActMax}
              />

              <div className="space-y-6">
                {filteredActivity.length > 0 ? (
                  // Grouping by date logic simplified for display
                  filteredActivity.map((t, index) => {
                    const showDate = index === 0 || 
                      format(new Date(t.date), 'dd/MM/yyyy') !== format(new Date(filteredActivity[index-1].date), 'dd/MM/yyyy');
                    
                    return (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          key={t.id} 
                          className="space-y-3"
                        >
                          {showDate && (
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                              {format(new Date(t.date), "dd 'de' MMMM", { locale: ptBR })}
                            </p>
                          )}
                          <motion.div 
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setTransactionToEdit(t);
                              setEditDescription(t.description);
                              setEditAmount(t.amount.toString());
                              setEditCategory(t.category);
                              setEditType(t.type);
                            }}
                            className={cn(
                              "p-4 rounded-2xl flex items-center justify-between shadow-sm border cursor-pointer transition-all", 
                              isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50"
                            )}
                          >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center",
                              t.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                            )}>
                              {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }} />
                                <p className={cn("font-semibold text-sm flex items-center gap-1.5", isDark ? "text-zinc-100" : "text-black")}>
                                  <span className="mr-0.5">{getCategoryIcon(t.category)}</span>
                                  {t.description}
                                </p>
                                {t.description.toLowerCase().includes('conta fixa') && (
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0 flex items-center gap-1">
                                    <Repeat size={10} /> Conta Fixa
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-400 text-xs">{t.category}</p>
                            </div>
                          </div>
                          <p className={cn(
                            "font-bold text-sm",
                            t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {t.type === 'income' ? '+' : '-'} {formatValue(t.amount)}
                          </p>
                        </motion.div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "text-center py-12 px-6 rounded-[32px] border space-y-4 shadow-sm",
                      isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                    )}
                  >
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                      <Activity size={36} />
                    </div>
                    <h3 className={cn("text-lg font-black", isDark ? "text-white" : "text-zinc-900")}>
                      Você ainda não registrou movimentações.
                    </h3>
                    <p className={cn("text-xs leading-relaxed max-w-md mx-auto", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Sua lista de atividades está pronta para acompanhar cada registro. Adicione sua primeira movimentação para ver o histórico em tempo real.
                    </p>
                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 transition-all inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Plus size={16} />
                        <span>Registrar movimentação</span>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'fixed' && (
            <motion.div
              key="fixed"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Top Banner & Modern Month Navigation Bar */}
              <div className={cn(
                "p-6 rounded-[28px] border flex flex-col gap-5 shadow-sm",
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
              )}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                        <Repeat size={20} />
                      </div>
                      <h2 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                        Despesas Fixas e Contas Recorrentes
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Cadastre suas contas mensais (Luz, Internet, Aluguel). Elas reaparecem todo mês no dia agendado.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setEditingFixedId(null);
                      setFixedDesc('');
                      setFixedAmount('');
                      setFixedDueDay(5);
                      setFixedNotes('');
                      setIsFixedModalOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer active:scale-95 transition-all shrink-0"
                  >
                    <Plus size={18} />
                    <span>Nova Conta Fixa</span>
                  </button>
                </div>

                {/* Ultra-Modern Month Controls Header */}
                <div className={cn(
                  "p-2 rounded-2xl border flex items-center justify-between gap-2 shadow-inner",
                  isDark ? "bg-zinc-950/60 border-zinc-800/80" : "bg-zinc-50 border-zinc-200/80"
                )}>
                  {/* Prev Month Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handlePrevMonth}
                    className={cn(
                      "p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center",
                      isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-200 text-zinc-700"
                    )}
                    title="Mês anterior"
                  >
                    <ChevronLeft size={20} />
                  </motion.button>

                  {/* Selected Month Badge Button (Opens Modal) */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const [yStr] = selectedMonthKey.split('-');
                      setMonthPickerYear(parseInt(yStr, 10));
                      setIsMonthPickerModalOpen(true);
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-sm border",
                      isDark 
                        ? "bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-750 hover:border-emerald-500/50" 
                        : "bg-white border-zinc-200 text-zinc-900 hover:border-emerald-500/50"
                    )}
                  >
                    <Calendar size={16} className="text-emerald-500" />
                    <span>{getFormattedMonthLabel(selectedMonthKey)}</span>
                    {(() => {
                      const today = new Date();
                      const mm = String(today.getMonth() + 1).padStart(2, '0');
                      const currentKey = `${today.getFullYear()}-${mm}`;
                      if (selectedMonthKey === currentKey) {
                        return (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 uppercase tracking-wider animate-pulse ml-1">
                            Atual
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </motion.button>

                  {/* Next Month Button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={handleNextMonth}
                    className={cn(
                      "p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center",
                      isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-200 text-zinc-700"
                    )}
                    title="Próximo mês"
                  >
                    <ChevronRight size={20} />
                  </motion.button>
                </div>

                {/* Horizontal Scroll Pill Bar for Quick Month Switching */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
                  {(() => {
                    const today = new Date();
                    const pills = [];
                    for (let i = -3; i <= 5; i++) {
                      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const key = `${d.getFullYear()}-${mm}`;
                      const isSelected = selectedMonthKey === key;
                      const isCurrent = i === 0;

                      const monthAbbr = format(d, 'MMM/yy', { locale: ptBR }).toUpperCase();

                      pills.push(
                        <motion.button
                          key={key}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedMonthKey(key)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                            isSelected
                              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                              : (isDark 
                                  ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800 hover:text-white" 
                                  : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 hover:text-zinc-900")
                          )}
                        >
                          {isCurrent && <span className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-emerald-500")} />}
                          <span>{monthAbbr}</span>
                        </motion.button>
                      );
                    }
                    return pills;
                  })()}
                </div>
              </div>

              {/* Summary Cards */}
              {(() => {
                const totalFixed = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
                const paidFixed = fixedExpenses
                  .filter(item => item.paidMonths.includes(selectedMonthKey))
                  .reduce((sum, item) => sum + item.amount, 0);
                const pendingFixed = totalFixed - paidFixed;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={cn("p-5 rounded-2xl border shadow-sm", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80")}>
                      <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1">Total Fixas no Mês</p>
                      <p className={cn("text-2xl font-black", isDark ? "text-white" : "text-zinc-900")}>
                        {formatValue(totalFixed)}
                      </p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{fixedExpenses.length} contas cadastradas</p>
                    </div>

                    <div className={cn("p-5 rounded-2xl border shadow-sm", isDark ? "bg-zinc-900 border-emerald-500/30" : "bg-emerald-50/60 border-emerald-200")}>
                      <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-1">Confirmadas / Pagas</p>
                      <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                        {formatValue(paidFixed)}
                      </p>
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-1 font-semibold">
                        {fixedExpenses.filter(i => i.paidMonths.includes(selectedMonthKey)).length} de {fixedExpenses.length} pagas
                      </p>
                    </div>

                    <div className={cn("p-5 rounded-2xl border shadow-sm", pendingFixed > 0 ? (isDark ? "bg-zinc-900 border-rose-500/30" : "bg-rose-50/60 border-rose-200") : (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80"))}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-rose-800 dark:text-rose-400">Pendente no Mês</p>
                      <p className={cn("text-2xl font-black", pendingFixed > 0 ? "text-rose-700 dark:text-rose-400" : (isDark ? "text-zinc-400" : "text-zinc-700"))}>
                        {formatValue(pendingFixed)}
                      </p>
                      <p className="text-[10px] text-zinc-600 dark:text-zinc-400 mt-1 font-medium">
                        {fixedExpenses.filter(i => !i.paidMonths.includes(selectedMonthKey)).length} pendentes
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* List of Fixed Expenses */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className={cn("font-bold text-sm uppercase tracking-wider", isDark ? "text-zinc-300" : "text-zinc-800")}>
                    Contas do Mês
                  </h3>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
                    {fixedExpenses.length} itens recorrentes
                  </span>
                </div>

                {fixedExpenses.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                    <Receipt size={40} className="mx-auto mb-2 text-zinc-400 opacity-60" />
                    <p className="text-zinc-700 dark:text-zinc-300 text-sm font-bold">Nenhuma despesa fixa cadastrada.</p>
                    <p className="text-zinc-500 text-xs mt-1">Clique em "Nova Conta Fixa" para adicionar sua energia, internet ou aluguel.</p>
                  </div>
                ) : (
                  fixedExpenses.map((expense) => {
                    const isPaid = expense.paidMonths.includes(selectedMonthKey);
                    
                    const today = new Date();
                    const [yStr, mStr] = selectedMonthKey.split('-');
                    const isCurrentMonth = today.getFullYear() === parseInt(yStr, 10) && (today.getMonth() + 1) === parseInt(mStr, 10);
                    const isDueToday = isCurrentMonth && today.getDate() === expense.dueDay;
                    const isOverdue = isCurrentMonth && today.getDate() > expense.dueDay && !isPaid;

                    return (
                      <motion.div
                        key={expense.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 sm:p-5 rounded-2xl border transition-all flex flex-col gap-3 shadow-sm",
                          isPaid
                            ? (isDark ? "bg-zinc-900 border-emerald-500/40" : "bg-white border-emerald-300 shadow-sm")
                            : (isOverdue 
                                ? (isDark ? "bg-zinc-900 border-rose-500/50" : "bg-white border-rose-300 shadow-sm")
                                : (isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80 shadow-sm"))
                        )}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-xl shadow-sm",
                              isPaid ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : (isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-100 text-zinc-800")
                            )}>
                              {getCategoryIcon(expense.category, expense.description)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className={cn("font-bold text-base truncate", isDark ? "text-white" : "text-zinc-900")}>
                                  {expense.description}
                                </h4>

                                {/* Status Tag */}
                                {isPaid ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 size={12} /> Pago
                                  </span>
                                ) : isDueToday ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 animate-pulse">
                                    <Clock size={12} /> Vence Hoje
                                  </span>
                                ) : isOverdue ? (
                                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle size={12} /> Atrasada
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                                    Pendente
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                                <span>🗓️ Vence todo dia <strong className="text-zinc-800 dark:text-zinc-200">{String(expense.dueDay).padStart(2, '0')}</strong></span>
                                <span>•</span>
                                <span>{expense.category}</span>
                                {isPaid && (
                                  <>
                                    <span>•</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                      <Calendar size={12} /> Próximo vencimento: {(() => {
                                        const [y, m] = selectedMonthKey.split('-').map(Number);
                                        const nextDate = new Date(y, m, expense.dueDay);
                                        return format(nextDate, 'dd/MM/yyyy');
                                      })()}
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Amount & Confirm Payment Button */}
                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800">
                            <div className="text-left sm:text-right">
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-bold tracking-wider">Valor Previsto</p>
                              <p className={cn("text-lg font-black", isPaid ? "text-emerald-700 dark:text-emerald-400" : (isDark ? "text-white" : "text-zinc-900"))}>
                                {formatValue(expense.amount)}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleFixedPaid(expense, selectedMonthKey)}
                                className={cn(
                                  "px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm",
                                  isPaid
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 dark:hover:bg-emerald-500/30"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
                                )}
                              >
                                <CheckSquare size={16} />
                                <span>{isPaid ? 'Pago ✅' : 'Marcar Pago'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  setEditingFixedId(expense.id);
                                  setFixedDesc(expense.description);
                                  setFixedAmount(expense.amount.toString());
                                  setFixedCategory(expense.category);
                                  setFixedDueDay(expense.dueDay);
                                  setFixedNotes(expense.notes || '');
                                  setIsFixedModalOpen(true);
                                }}
                                className={cn(
                                  "p-2.5 rounded-xl transition-all cursor-pointer",
                                  isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-600"
                                )}
                                title="Editar"
                              >
                                <Settings size={16} />
                              </button>

                              <button
                                onClick={() => handleDeleteFixedExpense(expense.id)}
                                className={cn(
                                  "p-2.5 rounded-xl transition-all cursor-pointer hover:bg-rose-500/10 text-rose-500"
                                )}
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Next Due Date Banner when Paid */}
                        {isPaid && (
                          <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-300 dark:border-emerald-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
                            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                              <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span>Conta confirmada para {getFormattedMonthLabel(selectedMonthKey)}</span>
                            </div>
                            <div className="flex items-center gap-2 font-extrabold text-[11px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 px-3 py-1.5 rounded-lg w-fit">
                              <Calendar size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>Próximo vencimento: {getNextDueDate(expense.dueDay, selectedMonthKey)}</span>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Explanatory Info Card */}
              <div className={cn("p-4.5 rounded-2xl border text-xs leading-relaxed space-y-1.5", isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200/80 text-zinc-800 shadow-xs")}>
                <p className="font-bold flex items-center gap-1.5 text-purple-700 dark:text-purple-400 text-sm">
                  <Sparkles size={16} /> Como funcionam as Despesas Fixas:
                </p>
                <p>
                  Suas despesas fixas (Luz, Internet, Aluguel, etc.) são recorrentes. <strong>Independente de você confirmar o pagamento neste mês</strong>, elas continuarão aparecendo nos meses futuros no dia agendado (ex: dia 05) para você ter a previsão financeira completa!
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Dashboard de Gastos</h3>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDashFilters(!showDashFilters)}
                  className={cn(
                    "p-2 rounded-xl transition-colors",
                    showDashFilters ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                  )}
                >
                  <Search size={18} />
                </motion.button>
              </div>

              <FilterBar 
                show={showDashFilters}
                start={dashStart} setStart={setDashStart}
                end={dashEnd} setEnd={setDashEnd}
                cat={dashCat} setCat={setDashCat}
                min={dashMin} setMin={setDashMin}
                max={dashMax} setMax={setDashMax}
              />
              
              <div className={cn("p-6 rounded-[32px] shadow-sm border h-64", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                {filteredStats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="category"
                      >
                        {filteredStats.map((entry) => (
                          <Cell key={`cell-${entry.category}`} fill={getCategoryColor(entry.category)} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          color: isDark ? '#ffffff' : '#000000'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2 shadow-inner">
                      <PieChartIcon size={24} />
                    </div>
                    <p className={cn("text-xs font-bold mb-1", isDark ? "text-zinc-200" : "text-zinc-800")}>
                      Os gráficos ganharão vida conforme você registra movimentações.
                    </p>
                    <p className="text-[11px] text-zinc-400 mb-3 max-w-xs leading-tight">
                      Cadastre suas despesas para visualizar a distribuição por categorias.
                    </p>
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Registrar movimentação</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Categorias</h4>
                {filteredStats.map((s) => {
                  const goal = categoryGoals[s.category] || 0;
                  const percentage = goal > 0 ? (s.total / goal) * 100 : 0;
                  
                  // Color rules based on budget consumption
                  let barColorClass = "bg-emerald-500"; // below 80% or default green
                  if (percentage >= 80 && percentage < 100) {
                    barColorClass = "bg-amber-500"; // 80% to 99%
                  } else if (percentage >= 100) {
                    barColorClass = "bg-rose-500 animate-pulse"; // 100%+
                  }

                  return (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      key={s.category}
                      onClick={() => {
                        setSelectedCategoryForGoal(s.category);
                        setEditGoalValue(goal.toString());
                      }}
                      className={cn(
                        "p-4 rounded-2xl border shadow-sm cursor-pointer transition-all space-y-3",
                        isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(s.category) }} />
                          <span className={cn("font-medium text-sm", isDark ? "text-zinc-300" : "text-black")}>
                            <span className="mr-1.5">{getCategoryIcon(s.category)}</span>
                            {s.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>{formatValue(s.total)}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">
                            {filteredDashTotalExpense > 0 ? ((s.total / filteredDashTotalExpense) * 100).toFixed(1) : 0}% do total
                          </p>
                        </div>
                      </div>

                      {/* Progress bar and Goal details */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-semibold">
                          <span className="text-zinc-500">Meta: {formatCurrency(goal)}</span>
                          <span className={cn(
                            percentage >= 100 ? "text-rose-500 font-bold" : percentage >= 80 ? "text-amber-500 font-bold" : "text-zinc-400"
                          )}>
                            {percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-300", barColorClass)} 
                            style={{ width: `${Math.min(percentage, 100)}%` }} 
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                {filteredStats.length === 0 && (
                  <p className="text-center text-zinc-400 text-sm italic py-4">Nenhum gasto para categorizar.</p>
                )}
              </div>

              {/* Lembretes Section */}
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Lembretes e Vencimentos</h4>
                  <button 
                    onClick={() => {
                      setReminderDesc('');
                      setReminderDate(new Date().toISOString().slice(0, 10));
                      setReminderCat('Geral');
                      setIsReminderModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                    title="Adicionar Lembrete"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                {reminders.length > 0 ? (
                  <div className="space-y-2">
                    {reminders.map(rem => (
                      <div 
                        key={rem.id}
                        className={cn(
                          "p-4 rounded-2xl border flex items-center justify-between group",
                          rem.completed ? "opacity-50 bg-zinc-50 dark:bg-zinc-800/30" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setReminders(reminders.map(r => r.id === rem.id ? {...r, completed: !r.completed} : r))}
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                              rem.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-700"
                            )}
                          >
                            {rem.completed && <CheckCircle2 size={12} />}
                          </button>
                          <div>
                            <p className={cn("text-sm font-bold", rem.completed && "line-through")}>{rem.description}</p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                              <Calendar size={10} />
                              <span>{format(new Date(rem.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setReminders(reminders.filter(r => r.id !== rem.id))}
                          className="p-2 text-zinc-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                    <Clock size={24} className="mx-auto mb-2 text-zinc-300" />
                    <p className="text-[10px] text-zinc-400 font-medium">Nenhum lembrete ativo.<br/>Toque no + para adicionar.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'investments' && (
            <motion.div
              key="investments"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-24"
            >
              {/* Header da Anny */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center overflow-hidden border-2 border-emerald-500/30 shadow-md">
                  <img 
                    src={ANNY_AVATAR} 
                    alt="Anny" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Invista</h3>
                  <p className="text-xs text-zinc-400">Com sua assistente Anny</p>
                </div>
              </div>

              {/* Dica Rotativa da Anny */}
              <motion.div 
                key={currentTipIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 flex items-start gap-3", isDark && "bg-emerald-900/10 border-emerald-900/20")}
              >
                <HelpCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                <p className={cn("text-xs leading-relaxed italic", isDark ? "text-emerald-200" : "text-emerald-800")}>
                  "{ANNY_TIPS[currentTipIndex]}"
                </p>
              </motion.div>

              {/* Seção: Onde guardar com segurança */}
              <div className="space-y-4">
                <h4 className={cn("font-bold text-sm px-1", isDark ? "text-zinc-300" : "text-zinc-700")}>Onde guardar com segurança</h4>
                <div className="space-y-3">
                  {INVESTMENT_OPTIONS.map((opt, idx) => (
                    <div 
                      key={idx}
                      className={cn("p-5 rounded-[24px] border transition-all", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className={cn("font-bold text-base", isDark ? "text-white" : "text-zinc-900")}>{opt.name}</h5>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">{opt.yield}</span>
                      </div>
                      <p className={cn("text-xs mb-4 leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>{opt.explanation}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                          <p className="text-[9px] text-zinc-400 uppercase font-bold mb-0.5">Risco</p>
                          <p className={cn("text-[10px] font-bold", opt.risk === 'Baixo' ? "text-emerald-500" : "text-amber-500")}>{opt.risk}</p>
                        </div>
                        <div className={cn("p-2 rounded-xl", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                          <p className="text-[9px] text-zinc-400 uppercase font-bold mb-0.5">Liquidez</p>
                          <p className={cn("text-[10px] font-bold", isDark ? "text-zinc-200" : "text-zinc-700")}>{opt.liquidity}</p>
                        </div>
                      </div>
                      <div className={cn("mt-3 p-2 rounded-xl border border-dashed", isDark ? "border-zinc-700" : "border-zinc-200")}>
                        <p className="text-[9px] text-zinc-400 uppercase font-bold mb-0.5">Indicação de uso</p>
                        <p className={cn("text-[10px] font-medium", isDark ? "text-zinc-300" : "text-zinc-600")}>{opt.usage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulação Simples */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-4", isDark ? "text-white" : "text-black")}>Simulação: O poder de guardar</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <Wallet size={16} />
                      </div>
                      <p className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>Guardar R$ 100/mês</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">R$ 1.200 + Juros em 1 ano</p>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <TrendingUp size={16} />
                      </div>
                      <p className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-zinc-700")}>Guardar R$ 500/mês</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600">R$ 6.000 + Juros em 1 ano</p>
                  </div>
                  <p className="text-[10px] text-center text-zinc-400 italic">
                    * Valores aproximados. O rendimento real depende da taxa de juros do período.
                  </p>
                </div>
              </div>

              {/* Risco x Retorno */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-2", isDark ? "text-white" : "text-black")}>Risco x Retorno</h4>
                <p className={cn("text-xs leading-relaxed mb-4", isDark ? "text-zinc-400" : "text-zinc-500")}>
                  No mundo das finanças, geralmente quanto maior o potencial de ganho, maior o risco que você corre. 
                  Para quem está começando, o foco deve ser a <strong>segurança</strong> e a <strong>liquidez</strong> (facilidade de sacar).
                </p>
                <div className="relative h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-1/3 bg-emerald-500" />
                  <div className="absolute inset-y-0 left-1/3 w-1/3 bg-amber-500" />
                  <div className="absolute inset-y-0 left-2/3 w-1/3 bg-rose-500" />
                </div>
                <div className="flex justify-between mt-2 text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>Mais Seguro</span>
                  <span>Mais Arriscado</span>
                </div>
              </div>

              {/* Perfis de Investidor */}
              <div className="space-y-4">
                <h4 className={cn("font-bold text-sm px-1", isDark ? "text-zinc-300" : "text-zinc-700")}>Qual é o seu perfil?</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className={cn("p-4 rounded-2xl border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <h5 className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Conservador</h5>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">Prioriza a segurança total. Prefere ganhar menos, mas ter a certeza de que o dinheiro estará lá quando precisar.</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <h5 className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Moderado</h5>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">Busca um equilíbrio. Aceita um pouco de risco para ter um rendimento melhor no médio prazo.</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <h5 className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Arremessado</h5>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed">Foca no longo prazo e em altos ganhos. Entende que o valor pode cair no curto prazo para subir muito depois.</p>
                  </div>
                </div>
              </div>

              {/* Opções Populares */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-3", isDark ? "text-white" : "text-black")}>Opções populares no mercado</h4>
                <div className="flex flex-wrap gap-2">
                  {['CDB', 'Tesouro Direto', 'LCI/LCA', 'Fundos DI', 'Contas Digitais'].map((tag, i) => (
                    <span key={i} className={cn("px-3 py-1.5 rounded-xl text-[10px] font-bold", isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-50 text-zinc-600")}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-400 mt-4 leading-relaxed">
                  Estas são alternativas comuns à poupança que você encontrará na maioria dos bancos e corretoras.
                </p>
              </div>

              {/* Aviso Rodapé */}
              <div className="pt-4 pb-8 text-center">
                <p className="text-[9px] text-zinc-400 leading-relaxed max-w-[250px] mx-auto">
                  Este conteúdo tem caráter puramente educativo e informativo. Não constitui recomendação direta ou personalizada de investimentos. 
                  Consulte sempre um profissional certificado antes de tomar decisões financeiras.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'forecast' && (
            <motion.div
              key="forecast"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-24"
            >
              {/* Header da Anny */}
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center overflow-hidden border-2 border-emerald-500/30 shadow-md">
                  <img 
                    src={ANNY_AVATAR} 
                    alt="Anny" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Previsão Financeira</h3>
                  <p className="text-xs text-zinc-400">Análise inteligente com Anny</p>
                </div>
              </div>

              {/* Dica da Anny (Contextual) */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-5 rounded-[32px] border relative overflow-hidden",
                  isDark ? "bg-emerald-900/10 border-emerald-900/20" : "bg-emerald-50 border-emerald-100"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-sm overflow-hidden border border-emerald-200">
                    <img 
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200" 
                      alt="Anny" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-emerald-400" : "text-emerald-700")}>Dica da Anny</h4>
                      <Sparkles size={12} className="text-emerald-500" />
                    </div>
                    <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-300" : "text-emerald-900/70")}>
                      {willBeNegative 
                        ? "Minha projeção indica que você pode precisar de um fôlego extra. Tente reduzir gastos não essenciais nos próximos dias."
                        : "Sua saúde financeira futura parece ótima! Continue mantendo esse equilíbrio entre ganhos e gastos."}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Alertas Inteligentes */}
              <div className="space-y-3">
                {willBeNegative ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3"
                  >
                    <AlertTriangle className="text-red-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-red-800">Se continuar nesse ritmo...</p>
                      <p className="text-[11px] text-red-600 leading-relaxed">
                        Seu saldo poderá ficar negativo por volta do dia <strong>{negativeDate}</strong>. 
                        Que tal revisarmos os gastos em <strong>{forecastCat || 'categorias gerais'}</strong>?
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3"
                  >
                    <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">Tudo sob controle!</p>
                      <p className="text-[11px] text-emerald-600 leading-relaxed">
                        Sua projeção indica que você terminá o período com saldo positivo. Continue assim!
                      </p>
                    </div>
                  </motion.div>
                )}

                {weekDiff > 10 && (
                  <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3"
                  >
                    <TrendingUp className="text-amber-500 shrink-0" size={20} />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Atenção aos gastos</p>
                      <p className="text-[11px] text-amber-600 leading-relaxed">
                        Seus gastos aumentaram cerca de <strong>{Math.round(weekDiff)}%</strong> em relação à semana passada.
                      </p>
                    </div>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3"
                >
                  <Zap className="text-blue-500 shrink-0" size={20} />
                  <div>
                    <p className="text-xs font-bold text-blue-800">Insight de Categoria</p>
                    <p className="text-[11px] text-blue-600 leading-relaxed">
                      A categoria <strong>{impactfulCategory}</strong> representa a maior parte das suas despesas recentes.
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Filtros Avançados */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("text-xs font-bold uppercase tracking-widest mb-2", isDark ? "text-zinc-400" : "text-zinc-500")}>Filtros de Análise</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Início</label>
                    <input 
                      type="date" 
                      value={forecastStart}
                      onChange={(e) => setForecastStart(e.target.value)}
                      className={cn("w-full border-none rounded-xl p-3 text-xs", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Fim</label>
                    <input 
                      type="date" 
                      value={forecastEnd}
                      onChange={(e) => setForecastEnd(e.target.value)}
                      className={cn("w-full border-none rounded-xl p-3 text-xs", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Categoria</label>
                  <select 
                    value={forecastCat}
                    onChange={(e) => setForecastCat(e.target.value)}
                    className={cn("w-full border-none rounded-xl p-3 text-xs appearance-none", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")}
                  >
                    <option value="">Todas as categorias</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Valor Mín.</label>
                    <input 
                      type="number" 
                      placeholder="R$ 0"
                      value={forecastMin}
                      onChange={(e) => setForecastMin(e.target.value)}
                      className={cn("w-full border-none rounded-xl p-3 text-xs", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Valor Máx.</label>
                    <input 
                      type="number" 
                      placeholder="Sem limite"
                      value={forecastMax}
                      onChange={(e) => setForecastMax(e.target.value)}
                      className={cn("w-full border-none rounded-xl p-3 text-xs", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")} 
                    />
                  </div>
                </div>
              </div>

              {/* Gráfico de Tendência */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-4", isDark ? "text-white" : "text-black")}>Tendência de Saldo</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#eee"} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: isDark ? '#888' : '#666'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: isDark ? '#888' : '#666'}} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          borderRadius: '16px', 
                          border: 'none', 
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          backgroundColor: isDark ? '#18181b' : '#fff',
                          color: isDark ? '#fff' : '#000'
                        }} 
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Line type="monotone" dataKey="balance" stroke="#10b981" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Interpretação da Anny */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Sparkles className="text-emerald-600" size={20} />
                  </div>
                  <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-black")}>O que isso significa?</h4>
                </div>
                <div className="space-y-4">
                  <p className={cn("text-xs leading-relaxed", isDark ? "text-zinc-400" : "text-zinc-500")}>
                    {willBeNegative 
                      ? "Notei uma tendência de queda no seu saldo. Isso acontece principalmente devido aos gastos recorrentes que identifiquei no seu histórico recente."
                      : "Seu saldo mostra uma estabilidade positiva. Isso indica que suas receitas estão cobrindo bem suas despesas habituais."}
                    {" "}A categoria <strong>{impactfulCategory}</strong> tem sido a mais relevante no seu comportamento atual.
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    <div className={cn("p-3 rounded-2xl flex items-center gap-3", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-[11px] font-medium text-zinc-500">Gasto provável até o fim do mês: <strong>{formatCurrency(forecastResult.dailyAverage * 30)}</strong></p>
                    </div>
                    <div className={cn("p-3 rounded-2xl flex items-center gap-3", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <p className="text-[11px] font-medium text-zinc-500">Saldo estimado final: <strong>{formatCurrency(forecastData[forecastData.length - 1]?.balance)}</strong></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variações Relevantes */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-4", isDark ? "text-white" : "text-black")}>Variações Relevantes</h4>
                <div className="space-y-3">
                  {weekDiff > 20 ? (
                    <div className="flex items-center gap-3">
                      <TrendingUp className="text-rose-500" size={16} />
                      <p className="text-[11px] text-zinc-500">Crescimento significativo nos gastos esta semana.</p>
                    </div>
                  ) : weekDiff < -10 ? (
                    <div className="flex items-center gap-3">
                      <TrendingDown className="text-emerald-500" size={16} />
                      <p className="text-[11px] text-zinc-500">Redução positiva! Você está gastando menos que o habitual.</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Activity className="text-blue-500" size={16} />
                      <p className="text-[11px] text-zinc-500">Seu comportamento financeiro está estável.</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Wallet className="text-amber-500" size={16} />
                    <p className="text-[11px] text-zinc-500">Gastos concentrados em <strong>{impactfulCategory}</strong>.</p>
                  </div>
                </div>
              </div>

              {/* Resumo Semanal Motivacional */}
              <div className={cn("p-6 rounded-[32px] shadow-sm border", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm mb-4", isDark ? "text-white" : "text-black")}>Resumo Semanal</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Esta Semana</p>
                      <p className={cn("text-sm font-bold", isDark ? "text-white" : "text-black")}>{formatCurrency(forecastResult.thisWeekExpense)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase">Status</p>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                        weekDiff <= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                      )}>
                        {weekDiff <= 0 ? `Redução de ${Math.abs(Math.round(weekDiff))}%` : `Aumento de ${Math.round(weekDiff)}%`}
                      </span>
                    </div>
                  </div>
                  
                  {weekDiff <= 0 ? (
                    <p className={cn("text-xs leading-relaxed italic", isDark ? "text-emerald-200" : "text-emerald-800")}>
                      "Parabéns! Você reduziu seus gastos em relação à semana passada. Esse esforço vai aparecer no seu saldo final!"
                    </p>
                  ) : (
                    <p className={cn("text-xs leading-relaxed italic", isDark ? "text-zinc-400" : "text-zinc-500")}>
                      "Esta semana os gastos subiram um pouco. Que tal tentar reduzir pequenas despesas em <strong>{impactfulCategory}</strong> na próxima semana?"
                    </p>
                  )}
                </div>
              </div>

              {/* Sugestões Práticas */}
              <div className="space-y-4">
                <h4 className={cn("font-bold text-sm px-1", isDark ? "text-zinc-300" : "text-zinc-700")}>Sugestões da Anny</h4>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: <Zap size={16} />, text: "Revise assinaturas que você não usa mais." },
                    { icon: <Wallet size={16} />, text: "Tente estabelecer um limite diário de gastos variáveis." },
                    { icon: <TrendingDown size={16} />, text: "Identifique 'gastos fantasma' (pequenas compras diárias)." }
                  ].map((item, i) => (
                    <div key={i} className={cn("p-4 rounded-2xl border flex items-center gap-3", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                        {item.icon}
                      </div>
                      <p className="text-[11px] font-medium text-zinc-500">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className={cn("font-bold text-lg", isDark ? "text-white" : "text-black")}>Relatórios</h3>
              
              <div className={cn("p-6 rounded-[32px] shadow-sm border space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Data de Início</label>
                    <input 
                      type="date" 
                      value={repStart}
                      onChange={(e) => setRepStart(e.target.value)}
                      className={cn(
                        "w-full border-none rounded-xl p-3 text-xs transition-all", 
                        isDark ? "bg-zinc-800 text-zinc-200 focus:ring-2 focus:ring-emerald-500" : "bg-zinc-50 text-zinc-700 focus:ring-2 focus:ring-emerald-500",
                        repStart && repEnd && repStart > repEnd ? "ring-2 ring-rose-500" : ""
                      )} 
                    />
                    {repStart && repEnd && repStart > repEnd && (
                      <p className="text-[9px] text-rose-500 font-bold mt-1 pl-1">Data inicial maior que final</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Data de Fim</label>
                    <input 
                      type="date" 
                      value={repEnd}
                      onChange={(e) => setRepEnd(e.target.value)}
                      className={cn(
                        "w-full border-none rounded-xl p-3 text-xs transition-all", 
                        isDark ? "bg-zinc-800 text-zinc-200 focus:ring-2 focus:ring-emerald-500" : "bg-zinc-50 text-zinc-700 focus:ring-2 focus:ring-emerald-500"
                      )} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Categoria</label>
                  <select 
                    value={repCat}
                    onChange={(e) => setRepCat(e.target.value)}
                    className={cn("w-full border-none rounded-xl p-3 text-xs appearance-none focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-700")}
                  >
                    <option value="">Todas as categorias</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Valor Mín.</label>
                    <input 
                      type="number" 
                      placeholder="R$ 0,00" 
                      value={repMin}
                      onChange={(e) => setRepMin(e.target.value)}
                      className={cn(
                        "w-full border-none rounded-xl p-3 text-xs transition-all", 
                        isDark ? "bg-zinc-800 text-zinc-200 focus:ring-2 focus:ring-emerald-500" : "bg-zinc-50 text-zinc-700 focus:ring-2 focus:ring-emerald-500",
                        Number(repMin) < 0 ? "ring-2 ring-rose-500" : ""
                      )} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest pl-1", isDark ? "text-zinc-400" : "text-black")}>Valor Máx.</label>
                    <input 
                      type="number" 
                      placeholder="R$ 10.000" 
                      value={repMax}
                      onChange={(e) => setRepMax(e.target.value)}
                      className={cn(
                        "w-full border-none rounded-xl p-3 text-xs transition-all", 
                        isDark ? "bg-zinc-800 text-zinc-200 focus:ring-2 focus:ring-emerald-500" : "bg-zinc-50 text-zinc-700 focus:ring-2 focus:ring-emerald-500",
                        repMin && repMax && Number(repMin) > Number(repMax) ? "ring-2 ring-rose-500" : ""
                      )} 
                    />
                  </div>
                </div>

                <div className="relative">
                  <button 
                    onClick={() => setShowReportMenu(!showReportMenu)}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-emerald-100 dark:shadow-none active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Extrair Relatório
                  </button>

                  <AnimatePresence>
                    {showReportMenu && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowReportMenu(false)} 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={cn(
                            "absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl shadow-xl border overflow-hidden",
                            isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
                          )}
                        >
                          <button 
                            className={cn("w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors", isDark ? "text-zinc-200" : "text-zinc-700")}
                            onClick={exportToPDF}
                          >
                            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center">
                              <FileText size={16} />
                            </div>
                            Exportar para PDF
                          </button>
                          <button 
                            className={cn("w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800", isDark ? "text-zinc-200" : "text-zinc-700")}
                            onClick={exportToExcel}
                          >
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                              <PieChartIcon size={16} />
                            </div>
                            Exportar para EXCEL
                          </button>
                          <button 
                            className={cn("w-full px-4 py-3 text-left text-sm font-medium flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-t border-zinc-100 dark:border-zinc-800", isDark ? "text-zinc-200" : "text-zinc-700")}
                            onClick={() => {
                              setShowWebView(true);
                              setShowReportMenu(false);
                            }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                              <Eye size={16} />
                            </div>
                            Visualização Rápida (Web)
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest pl-1">Resultados do Relatório</h4>
                {filteredReports.length > 0 ? (
                  <div className="space-y-3">
                    {filteredReports.map((t, index) => (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        key={t.id} 
                        onClick={() => setTransactionToDelete(t)}
                        className={cn(
                          "p-4 rounded-2xl flex items-center justify-between shadow-sm border cursor-pointer transition-all", 
                          isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            t.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
                          )}>
                            {t.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }} />
                              <p className={cn("font-semibold text-sm", isDark ? "text-zinc-100" : "text-black")}>
                                <span className="mr-1.5">{getCategoryIcon(t.category)}</span>
                                {t.description}
                              </p>
                            </div>
                            <p className="text-zinc-400 text-xs">{t.category} • {format(new Date(t.date), 'dd/MM/yyyy')}</p>
                          </div>
                        </div>
                        <p className={cn(
                          "font-bold text-sm",
                          t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {formatValue(t.amount)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
                    <FileText size={32} className="mx-auto mb-2 text-zinc-300 opacity-50" />
                    <p className="text-zinc-400 text-xs italic">Aplique os filtros para visualizar o relatório.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'planning' && (
            <motion.div
              key="planning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-24"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={cn("font-black text-xl", isDark ? "text-white" : "text-zinc-900")}>
                    Planejamento & Objetivos
                  </h3>
                  <p className="text-xs text-zinc-400">Monte suas metas e conquiste seus sonhos</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Target size={22} />
                </div>
              </div>

              {/* Reserva de Emergência Calculator Card */}
              <div className={cn("p-6 rounded-[32px] border shadow-sm space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                {(() => {
                  const idealReserve = fixedExpenses.reduce((acc, curr) => acc + curr.amount, 0) * 6;
                  const currentSaved = goalsList.reduce((acc, g) => acc + g.currentAmount, 0);
                  const reservePct = idealReserve > 0 ? Math.min(100, Math.round((currentSaved / idealReserve) * 100)) : 0;
                  const hasReserveGoal = goalsList.some(g => g.name.toLowerCase().includes('reserva'));
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <Shield size={20} />
                          </div>
                          <div>
                            <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-zinc-900")}>Reserva de Emergência</h4>
                            <p className="text-[10px] text-zinc-400">Recomendado: 6 meses de gastos fixos</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                          {formatCurrency(idealReserve)}
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${reservePct}%` }} />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                        <p className="text-[10px] text-zinc-400 italic">
                          {idealReserve > 0 
                            ? `Você já possui ${reservePct}% da sua reserva ideal recomendada!`
                            : 'Adicione suas despesas fixas para calcular o valor da sua reserva ideal.'}
                        </p>
                        <button
                          onClick={handleCreateReserveGoal}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                        >
                          <Shield size={13} />
                          <span>{hasReserveGoal ? 'Atualizar Reserva' : 'Criar Meta de Reserva'}</span>
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Objetivos & Sonhos */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className={cn("font-bold text-sm", isDark ? "text-zinc-300" : "text-zinc-800")}>Seus Objetivos Ativos</h4>
                  <button 
                    onClick={handleOpenAddGoalModal}
                    className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Novo Objetivo
                  </button>
                </div>

                <div className="space-y-3">
                  {goalsList.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                      <Target size={32} className="mx-auto mb-2 text-zinc-400 opacity-60" />
                      <p className="text-zinc-700 dark:text-zinc-300 text-sm font-bold">Nenhum objetivo cadastrado.</p>
                      <p className="text-zinc-500 text-xs mt-1">Clique em "+ Novo Objetivo" para começar a guardar para seus sonhos!</p>
                    </div>
                  ) : (
                    goalsList.map(goal => {
                      const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                      return (
                        <div key={goal.id} className={cn("p-5 rounded-[24px] border space-y-3", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{goal.icon || '🎯'}</span>
                              <div>
                                <h5 className={cn("font-bold text-sm", isDark ? "text-white" : "text-zinc-900")}>{goal.name}</h5>
                                <p className="text-[10px] text-zinc-400">{goal.category || 'Geral'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-black text-emerald-500">{pct}%</p>
                              <p className="text-[10px] text-zinc-400">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</p>
                            </div>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                setSelectedGoalForAction({ goal, actionType: 'deposit' });
                                setGoalActionAmount('');
                              }}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              + Guardar
                            </button>
                            <button
                              onClick={() => {
                                setSelectedGoalForAction({ goal, actionType: 'withdraw' });
                                setGoalActionAmount('');
                              }}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            >
                              - Retirar
                            </button>
                            <button
                              onClick={() => handleOpenEditGoalModal(goal)}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteGoal(goal.id)}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Regra 50-30-20 */}
              <div className={cn("p-6 rounded-[32px] border space-y-3", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-zinc-900")}>Método de Distribuição 50/30/20</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para manter uma vida financeira equilibrada, a Anny recomenda:
                </p>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <p className="text-sm font-black text-blue-500">50%</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Essenciais</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <p className="text-sm font-black text-amber-500">30%</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Desejos</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <p className="text-sm font-black text-emerald-500">20%</p>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Investir</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 pb-24"
            >
              {/* User Avatar Card */}
              <div className={cn("p-6 rounded-[32px] border shadow-sm relative overflow-hidden", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-500/20">
                    {user?.firstName ? user.firstName.charAt(0) : 'G'}
                  </div>
                  <div>
                    <h3 className={cn("font-black text-lg", isDark ? "text-white" : "text-zinc-900")}>
                      {userName}
                    </h3>
                    <p className="text-xs text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                      <Award size={14} /> Nível 5 - Mestre das Finanças 🏆
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-1">{user?.email || 'usuario@startfinancas.com'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="text-center">
                    <p className="text-lg font-black text-emerald-500 flex items-center justify-center gap-1">
                      <Flame size={18} className="text-amber-500" /> {transactions.length > 0 ? Math.max(1, Math.min(30, transactions.length)) : 0}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Dias de Streak</p>
                  </div>
                  <div className="text-center border-x border-zinc-100 dark:border-zinc-800">
                    <p className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                      <Target size={18} /> {goalsList.filter(g => g.currentAmount >= g.targetAmount).length}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Metas Concluídas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-purple-500 flex items-center justify-center gap-1">
                      <Sparkles size={18} /> {transactions.length === 0 ? 0 : Math.min(990, Math.max(300, 500 + (transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0) > 0 ? 150 : 0) + (goalsList.length * 50) + (fixedExpenses.length * 20)))}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase">Score Finanças</p>
                  </div>
                </div>
              </div>

              {/* Medalhas & Conquistas */}
              <div className="space-y-4">
                <h4 className={cn("font-bold text-sm px-1", isDark ? "text-zinc-300" : "text-zinc-800")}>Medalhas e Conquistas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { title: 'Primeiro Saldo Positivo', desc: 'Fechou o mês no verde', icon: '🥇', unlocked: transactions.length > 0 && (transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0) > 0) },
                    { title: 'Reserva Protegida', desc: 'Criou sua reserva de emergência', icon: '🛡️', unlocked: goalsList.some(g => g.name.toLowerCase().includes('reserva') && g.currentAmount > 0) },
                    { title: 'Contas em Dia', desc: 'Pagou suas contas fixas', icon: '⚡', unlocked: fixedExpenses.length > 0 && fixedExpenses.some(f => f.paidMonths.length > 0) },
                    { title: 'Investidor Iniciante', desc: 'Criou seu primeiro objetivo', icon: '🚀', unlocked: goalsList.length > 0 },
                    { title: 'Mestre da Economia', desc: 'Economizou no mês', icon: '🏆', unlocked: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) > 0 && (transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0) > 0) },
                    { title: 'Super Analista', desc: 'Registrou 10 ou mais movimentações', icon: '📊', unlocked: transactions.length >= 10 }
                  ].map((m, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "p-4 rounded-2xl border flex flex-col items-center text-center gap-2 transition-all",
                        m.unlocked 
                          ? (isDark ? "bg-zinc-900 border-emerald-500/30" : "bg-white border-emerald-200") 
                          : "opacity-40 bg-zinc-100 dark:bg-zinc-900 border-transparent"
                      )}
                    >
                      <span className="text-3xl">{m.icon}</span>
                      <div>
                        <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>{m.title}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5">{m.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'anny' && (
            <motion.div
              key="anny"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 pb-24"
            >
              {/* Card Unificado da Central da Anny */}
              <div className={cn(
                "p-6 rounded-[28px] border shadow-2xs space-y-5 relative overflow-hidden",
                isDark ? "bg-gradient-to-br from-zinc-900 via-zinc-900 to-emerald-950/30 border-zinc-800" : "bg-gradient-to-br from-emerald-500/5 via-white to-amber-500/5 border-zinc-200/80"
              )}>
                {/* Topo: Informações e Ação Principal */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-md">
                        <img 
                          src={ANNY_AVATAR} 
                          alt="Anny" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={cn("font-black text-xl flex items-center gap-1.5", isDark ? "text-white" : "text-zinc-900")}>
                          <span>Central da Anny</span>
                          <Sparkles size={18} className="text-amber-500 animate-spin" />
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          IA Ativa & Analisando
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">Sua consultora financeira pessoal integrada em tempo real</p>
                    </div>
                  </div>
                </div>

                {/* Divisor interno suave */}
                <div className={cn("h-px w-full", isDark ? "bg-zinc-800" : "bg-zinc-200/70")} />

                {/* Input Rápido da Anny na mesma Box */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-500" />
                    <h4 className={cn("font-bold text-xs", isDark ? "text-zinc-200" : "text-zinc-800")}>Pergunte qualquer coisa à Anny</h4>
                  </div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!annyCentralInput.trim()) return;
                      const q = annyCentralInput.trim();
                      setAnnyCentralInput('');
                      setShowHelpChat(true);
                      handleSendMessage(q);
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={annyCentralInput}
                      onChange={(e) => setAnnyCentralInput(e.target.value)}
                      placeholder="Ex: Como economizar R$ 300 este mês? Ou: Analise minhas metas..."
                      className={cn(
                        "flex-1 p-3.5 rounded-2xl text-xs outline-none border transition-all",
                        isDark ? "bg-zinc-800/80 border-zinc-700 text-white focus:border-emerald-500 placeholder:text-zinc-500" : "bg-zinc-50/80 border-zinc-200 focus:border-emerald-500 placeholder:text-zinc-400"
                      )}
                    />
                    <button
                      type="submit"
                      className="px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
                    >
                      <Send size={14} />
                      <span>Perguntar</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* 1. Saúde Financeira (0-100) */}
              {(() => {
                const health = calculateFinancialHealth(transactions, goalsList, fixedExpenses);
                return (
                  <div className={cn("p-6 rounded-[28px] border shadow-2xs space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80")}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={cn("font-bold text-sm flex items-center gap-1.5", isDark ? "text-white" : "text-zinc-900")}>
                          💚 Saúde Financeira
                        </h4>
                        <p className="text-[11px] text-zinc-400">Diagnóstico inteligente do seu momento</p>
                      </div>
                      <span className={cn("font-black text-xs px-3 py-1.5 rounded-xl border", isDark ? "bg-zinc-800 border-zinc-700 text-zinc-200" : "bg-emerald-50/80 border-emerald-200/80 text-emerald-700", health.color)}>
                        {health.score}/100 • {health.label}
                      </span>
                    </div>

                    <div className={cn("w-full h-3 rounded-full overflow-hidden", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", health.score >= 70 ? "bg-emerald-500" : health.score >= 40 ? "bg-amber-500" : "bg-rose-500")}
                        style={{ width: `${health.score}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <div className={cn("p-3 rounded-xl border transition-all", isDark ? "bg-zinc-800/40 border-zinc-800 text-zinc-300" : "bg-transparent border-zinc-200 text-zinc-800")}>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Regularidade</p>
                        <p className="text-xs font-bold">{health.regularity} / 25 pts</p>
                      </div>
                      <div className={cn("p-3 rounded-xl border transition-all", isDark ? "bg-zinc-800/40 border-zinc-800 text-zinc-300" : "bg-transparent border-zinc-200 text-zinc-800")}>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Economia</p>
                        <p className="text-xs font-bold">{health.savings} / 35 pts</p>
                      </div>
                      <div className={cn("p-3 rounded-xl border transition-all", isDark ? "bg-zinc-800/40 border-zinc-800 text-zinc-300" : "bg-transparent border-zinc-200 text-zinc-800")}>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Metas</p>
                        <p className="text-xs font-bold">{health.goals} / 20 pts</p>
                      </div>
                      <div className={cn("p-3 rounded-xl border transition-all", isDark ? "bg-zinc-800/40 border-zinc-800 text-zinc-300" : "bg-transparent border-zinc-200 text-zinc-800")}>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Contas Fixas</p>
                        <p className="text-xs font-bold">{health.organization} / 20 pts</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Insights Inteligentes da Anny */}
              {(() => {
                const insights = generateAnnyInsights(transactions, goalsList, fixedExpenses);

                return (
                  <div className={cn("p-6 rounded-[28px] border shadow-2xs space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500 animate-pulse" />
                        <div>
                          <h4 className={cn("font-bold text-sm", isDark ? "text-white" : "text-zinc-900")}>Insights Inteligentes da Anny</h4>
                          <p className="text-[10px] text-zinc-400">Análises automáticas baseadas no seu histórico</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {insights.length} {insights.length === 1 ? 'insight ativo' : 'insights ativos'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {insights.map((item, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "p-4 rounded-2xl border transition-all space-y-2.5",
                            isDark ? "bg-zinc-800/40 border-zinc-800 hover:border-zinc-700" : "bg-zinc-50/80 border-zinc-200/80 hover:bg-white hover:shadow-2xs"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <span>{item.icon || '✨'}</span>
                              <span>{item.tag}</span>
                            </span>
                            <button
                              onClick={() => {
                                setShowHelpChat(true);
                                handleSendMessage(`Anny, pode me dar orientações e um plano prático para este insight: "${item.text}"?`);
                              }}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <span>Montar plano</span>
                              <span>→</span>
                            </button>
                          </div>
                          <p className={cn("text-xs font-medium leading-relaxed", isDark ? "text-zinc-200" : "text-zinc-800")}>
                            "{item.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* 3. IA Conversacional / Perguntas Rápidas */}
              <div className={cn("p-6 rounded-[28px] border shadow-2xs space-y-4", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200/80")}>
                <h4 className={cn("font-bold text-sm flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
                  <HelpCircle size={16} className="text-amber-500" />
                  <span>Análises Financeiras Rápidas com a Anny</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    "Analisar meus gastos deste mês",
                    "Como criar minha reserva de emergência?",
                    "Quais contas fixas vencem esta semana?",
                    "Como economizar na minha maior categoria de gastos?",
                    "Monte um plano para eu atingir minhas metas",
                    "Qual a previsão do meu saldo final do mês?"
                  ].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setShowHelpChat(true);
                        handleSendMessage(q);
                      }}
                      className={cn(
                        "p-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left flex items-center gap-2.5 hover:border-emerald-500/50",
                        isDark 
                          ? "bg-zinc-800/40 border-zinc-800 text-emerald-400 hover:bg-zinc-800" 
                          : "bg-white border-zinc-200 text-emerald-700 hover:bg-emerald-50/50 shadow-2xs"
                      )}
                    >
                      <Sparkles size={14} className="shrink-0 text-amber-500" />
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'more' && (
            <motion.div
              key="more"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-6 pb-24"
            >
              {/* Profile Card Header */}
              <div 
                onClick={() => setActiveTab('profile')}
                className={cn(
                  "p-5 rounded-[28px] border flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]",
                  isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white font-black text-xl flex items-center justify-center">
                    {user?.firstName ? user.firstName.charAt(0) : 'G'}
                  </div>
                  <div>
                    <h4 className={cn("font-bold text-base", isDark ? "text-white" : "text-zinc-900")}>
                      {userName}
                    </h4>
                    <p className="text-xs text-emerald-500 font-bold">Nível 5 - Mestre das Finanças 🏆</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-zinc-400" />
              </div>

              {/* Seção 1: Visão Financeira */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Sua Visão Financeira</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <BarChart3 size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Dashboard</p>
                    <p className="text-[10px] text-zinc-400">Gráficos e estatísticas</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('reports')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Relatórios</p>
                    <p className="text-[10px] text-zinc-400">Exportar PDF / Excel</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('planning')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <Target size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Planejamento</p>
                    <p className="text-[10px] text-zinc-400">Objetivos e Sonhos</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('forecast')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <LineChartIcon size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Previsões</p>
                    <p className="text-[10px] text-zinc-400">Saldo fim do mês</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('fixed')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Repeat size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Despesas Fixas</p>
                    <p className="text-[10px] text-zinc-400">Contas recorrentes</p>
                  </button>

                  <button
                    onClick={() => setActiveTab('investments')}
                    className={cn("p-4 rounded-2xl border text-left space-y-2 transition-all hover:scale-[1.02] cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100")}
                  >
                    <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <p className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Investimentos</p>
                    <p className="text-[10px] text-zinc-400">Onde guardar dinheiro</p>
                  </button>
                </div>
              </div>

              {/* Seção 2: Sistema e Atendimento */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-2">Conta e Atendimento</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowNotifSettings(true)}
                    className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50")}
                  >
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-emerald-500" />
                      <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Configurações de Alertas</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setShowSecurityModal(true)}
                    className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50")}
                  >
                    <div className="flex items-center gap-3">
                      <Shield size={18} className="text-blue-500" />
                      <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Segurança e Biometria</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setShowRating(true)}
                    className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50")}
                  >
                    <div className="flex items-center gap-3">
                      <Star size={18} className="text-amber-500" />
                      <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Avaliar o Aplicativo</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setShowSyncModal(true)}
                    className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800" : "bg-white border-zinc-100 hover:bg-zinc-50")}
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw size={18} className="text-indigo-500" />
                      <span className={cn("font-bold text-xs", isDark ? "text-white" : "text-zinc-900")}>Sincronizar Extrato</span>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </button>

                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={cn("w-full p-4 rounded-2xl border flex items-center justify-between transition-all text-rose-500 cursor-pointer", isDark ? "bg-zinc-900 border-zinc-800 hover:bg-rose-500/10" : "bg-white border-zinc-100 hover:bg-rose-50")}
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={18} />
                      <span className="font-bold text-xs">Sair da Conta</span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Speed Dial Menu Backdrop & Actions */}
      <AnimatePresence>
        {showSpeedDial && (
          <div className="fixed inset-0 z-40 flex items-end justify-center pb-24 px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSpeedDial(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={cn(
                "w-full max-w-sm rounded-[32px] p-6 relative z-10 shadow-2xl border space-y-3",
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <p className={cn("font-black text-sm", isDark ? "text-white" : "text-zinc-900")}>
                  Ações Rápidas
                </p>
                <button onClick={() => setShowSpeedDial(false)} className="text-zinc-400 hover:text-zinc-200">
                  <X size={18} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => {
                    setType('income');
                    setIsModalOpen(true);
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <ArrowUpCircle size={20} />
                  <span>Nova Receita</span>
                </button>

                <button
                  onClick={() => {
                    setType('expense');
                    setIsModalOpen(true);
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <ArrowDownCircle size={20} />
                  <span>Nova Despesa</span>
                </button>

                <button
                  onClick={() => {
                    setEditingFixedId(null);
                    setFixedDesc('');
                    setFixedAmount('');
                    setIsFixedModalOpen(true);
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Repeat size={20} />
                  <span>Conta Fixa</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('planning');
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Target size={20} />
                  <span>Nova Meta</span>
                </button>

                <button
                  onClick={() => {
                    setShowTransferModal(true);
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Send size={20} />
                  <span>Transferência</span>
                </button>

                <button
                  onClick={() => {
                    setShowSyncModal(true);
                    setSyncMethod('csv');
                    setShowSpeedDial(false);
                  }}
                  className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center gap-3 font-bold text-xs hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Scan size={20} />
                  <span>Escanear Recibo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern 5-Item Bottom Navigation Bar */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 border-t flex items-center h-20 px-4 safe-bottom shadow-[0_-4px_25px_rgba(0,0,0,0.06)] z-30 transition-all duration-300",
        isNavVisible ? "translate-y-0" : "translate-y-full",
        isDark ? "bg-zinc-900/95 border-zinc-800 backdrop-blur-xl" : "bg-white/95 border-zinc-200/80 backdrop-blur-xl"
      )}>
        <div className="max-w-md mx-auto w-full flex justify-between items-center relative">
          {/* 1. Início */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setActiveTab('home');
              setShowSpeedDial(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1 cursor-pointer",
              activeTab === 'home' ? "text-emerald-500 font-extrabold" : "text-zinc-400"
            )}
          >
            <Home size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Início</span>
          </motion.button>

          {/* 2. Atividade */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setActiveTab('activity');
              setShowSpeedDial(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1 cursor-pointer",
              activeTab === 'activity' ? "text-emerald-500 font-extrabold" : "text-zinc-400"
            )}
          >
            <Activity size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Atividade</span>
          </motion.button>

          {/* 3. Central Speed Dial FAB (+) */}
          <div className="flex-1 flex justify-center relative -top-5">
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSpeedDial(!showSpeedDial)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl shadow-emerald-500/25 cursor-pointer transition-all border-4",
                showSpeedDial 
                  ? (isDark ? "bg-rose-500 border-zinc-950 rotate-45" : "bg-rose-500 border-white rotate-45") 
                  : (isDark ? "bg-emerald-600 border-zinc-950" : "bg-emerald-600 border-white")
              )}
            >
              <Plus size={28} />
            </motion.button>
          </div>

          {/* 4. Anny */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setActiveTab('anny');
              setShowSpeedDial(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1 cursor-pointer",
              activeTab === 'anny' ? "text-emerald-500 font-extrabold" : "text-zinc-400"
            )}
          >
            <Sparkles size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Anny</span>
          </motion.button>

          {/* 5. Mais */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setActiveTab('more');
              setShowSpeedDial(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1 cursor-pointer",
              activeTab === 'more' ? "text-emerald-500 font-extrabold" : "text-zinc-400"
            )}
          >
            <Menu size={22} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Mais</span>
          </motion.button>
        </div>
      </nav>

      {/* Web View Modal */}
      <AnimatePresence>
        {showWebView && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWebView(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "w-full max-w-2xl max-h-[80vh] rounded-[32px] p-8 relative z-10 shadow-2xl flex flex-col",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Visualização do Relatório</h3>
                  <p className="text-xs text-zinc-400">{filteredReports.length} transações encontradas</p>
                </div>
                <button onClick={() => setShowWebView(false)} className={cn("p-2 rounded-full", isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead className={cn("sticky top-0 z-10", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                    <tr>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Data</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Descrição</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className={cn("p-4 text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>{format(new Date(t.date), 'dd/MM/yy')}</td>
                        <td className="p-4">
                          <p className={cn("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>{t.description}</p>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">{getCategoryIcon(t.category)} {t.category}</p>
                        </td>
                        <td className={cn(
                          "p-4 text-sm font-bold text-right",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {formatValue(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={exportToPDF}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <FileText size={18} /> PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <PieChartIcon size={18} /> Excel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Web View Modal */}
      <AnimatePresence>
        {showWebView && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWebView(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "w-full max-w-2xl max-h-[80vh] rounded-[32px] p-8 relative z-10 shadow-2xl flex flex-col",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Visualização do Relatório</h3>
                  <p className="text-xs text-zinc-400">{filteredReports.length} transações encontradas</p>
                </div>
                <button onClick={() => setShowWebView(false)} className={cn("p-2 rounded-full", isDark ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500")}>
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto rounded-2xl border border-zinc-100 dark:border-zinc-800">
                <table className="w-full text-left border-collapse">
                  <thead className={cn("sticky top-0 z-10", isDark ? "bg-zinc-800" : "bg-zinc-50")}>
                    <tr>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Data</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">Descrição</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((t) => (
                      <tr key={t.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className={cn("p-4 text-xs", isDark ? "text-zinc-400" : "text-zinc-500")}>{format(new Date(t.date), 'dd/MM/yy')}</td>
                        <td className="p-4">
                          <p className={cn("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>{t.description}</p>
                          <p className="text-[10px] text-zinc-400 uppercase font-bold">{getCategoryIcon(t.category)} {t.category}</p>
                        </td>
                        <td className={cn(
                          "p-4 text-sm font-bold text-right",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'} {formatValue(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={exportToPDF}
                  className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <FileText size={18} /> PDF
                </button>
                <button
                  onClick={exportToExcel}
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <PieChartIcon size={18} /> Excel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={cn(
                "w-full max-w-xs rounded-[32px] p-8 relative z-10 shadow-2xl text-center",
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={32} />
              </div>
              <h3 className={cn("text-xl font-bold mb-2", isDark ? "text-white" : "text-zinc-900")}>Deseja sair do app?</h3>
              <p className="text-zinc-500 text-sm mb-8">Você precisará entrar novamente para acessar seus dados.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-3 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white transition-colors shadow-lg shadow-emerald-500/20"
                >
                  Não
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="py-3 rounded-2xl font-bold text-sm bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-lg shadow-rose-500/20"
                >
                  Sim
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {transactionToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTransactionToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={cn(
                "w-full max-w-xs rounded-[32px] p-8 relative z-10 shadow-2xl text-center",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className={cn("text-lg font-bold mb-2", isDark ? "text-white" : "text-zinc-900")}>Excluir Transação?</h3>
              <p className={cn("text-sm mb-8", isDark ? "text-zinc-400" : "text-zinc-500")}>
                Tem certeza que deseja excluir "{transactionToDelete.description}" no valor de {formatValue(transactionToDelete.amount)}?
              </p>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDeleteTransaction(transactionToDelete.id)}
                  className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold transition-all"
                >
                  Sim, Excluir
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setTransactionToDelete(null)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold transition-all",
                    isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  Cancelar
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal / Bottom Sheet */}
      <AnimatePresence>
        {transactionToEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTransactionToEdit(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-md rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Editar Transação</h2>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTransactionToEdit(null)} 
                  className={cn("p-2.5 rounded-full shadow-sm transition-all", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
                <form onSubmit={handleUpdateTransaction} className="space-y-6">
                  {/* Expense/Income Toggle */}
                  <div className={cn("flex p-1 rounded-2xl", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                    <button
                      type="button"
                      onClick={() => setEditType('expense')}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                        editType === 'expense' 
                          ? (isDark ? "bg-zinc-700 text-rose-400 shadow-sm" : "bg-white text-rose-600 shadow-sm") 
                          : "text-zinc-500"
                      )}
                    >
                      Despesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditType('income')}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                        editType === 'income' 
                          ? (isDark ? "bg-zinc-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm") 
                          : "text-zinc-500"
                      )}
                    >
                      Receita
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>Descrição</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Ex: Aluguel, Salário..."
                        className={cn(
                          "w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all text-sm",
                          isDark ? "bg-zinc-800 text-white placeholder:text-zinc-650 focus:bg-zinc-800" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-350"
                        )}
                      />
                    </div>

                    {/* Amount */}
                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>Valor</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="0,00"
                          className={cn(
                            "w-full border-none rounded-2xl p-4 pl-12 font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all",
                            isDark ? "bg-zinc-800 text-white focus:bg-zinc-800" : "bg-zinc-50 text-zinc-900"
                          )}
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest mb-3 block", isDark ? "text-zinc-400" : "text-black")}>Categoria</label>
                      <div className="grid grid-cols-3 gap-2">
                        {CATEGORIES.map(cat => (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={cat}
                            type="button"
                            onClick={() => setEditCategory(cat)}
                            className={cn(
                              "flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all gap-1",
                              editCategory === cat
                                ? (isDark ? "bg-emerald-900/20 border-emerald-500 text-emerald-400" : "bg-emerald-50 border-emerald-500 text-emerald-600")
                                : (isDark ? "bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100")
                            )}
                          >
                            <span className="text-lg">{getCategoryIcon(cat)}</span>
                            <span className="text-[10px] font-bold uppercase truncate w-full text-center">{cat}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 space-y-3 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
                    >
                      Salvar Alterações
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const t = transactionToEdit;
                        setTransactionToEdit(null);
                        setTransactionToDelete(t);
                      }}
                      className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      Excluir Transação
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Fixed Expense Modal */}
      <AnimatePresence>
        {isFixedModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFixedModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-md rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                    <Repeat size={20} />
                  </div>
                  <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                    {editingFixedId ? 'Editar Despesa Fixa' : 'Nova Despesa Fixa'}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsFixedModalOpen(false)} 
                  className={cn("p-2.5 rounded-full shadow-sm transition-all", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
                <form onSubmit={handleSaveFixedExpense} className="space-y-5">
                  {/* Description */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>
                      Nome da Conta / Despesa Fixa
                    </label>
                    <input
                      type="text"
                      required
                      value={fixedDesc}
                      onChange={(e) => setFixedDesc(e.target.value)}
                      placeholder="Ex: Conta de Energia (Luz), Internet, Aluguel..."
                      className={cn(
                        "w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all text-sm",
                        isDark ? "bg-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-400"
                      )}
                    />
                  </div>

                  {/* Amount & Due Day in 2 cols */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>
                        Valor Previsto (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={fixedAmount}
                          onChange={(e) => setFixedAmount(e.target.value)}
                          placeholder="185,50"
                          className={cn(
                            "w-full border-none rounded-2xl p-4 pl-10 font-bold text-base focus:ring-2 focus:ring-emerald-500 transition-all",
                            isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>
                        Dia do Vencimento
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        required
                        value={fixedDueDay}
                        onChange={(e) => setFixedDueDay(parseInt(e.target.value, 10) || 1)}
                        className={cn(
                          "w-full border-none rounded-2xl p-4 font-bold text-base focus:ring-2 focus:ring-emerald-500 transition-all text-center",
                          isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                        )}
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-3 block", isDark ? "text-zinc-400" : "text-black")}>
                      Categoria
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFixedCategory(cat)}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all gap-1 cursor-pointer",
                            fixedCategory === cat
                              ? (isDark ? "bg-emerald-900/20 border-emerald-500 text-emerald-400" : "bg-emerald-50 border-emerald-500 text-emerald-600")
                              : (isDark ? "bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100")
                          )}
                        >
                          <span className="text-lg">{getCategoryIcon(cat)}</span>
                          <span className="text-[10px] font-bold uppercase truncate w-full text-center">{cat}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>
                      Observações (Opcional)
                    </label>
                    <input
                      type="text"
                      value={fixedNotes}
                      onChange={(e) => setFixedNotes(e.target.value)}
                      placeholder="Ex: Código do cliente, débito automático..."
                      className={cn(
                        "w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all text-xs",
                        isDark ? "bg-zinc-800 text-white placeholder:text-zinc-500" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-400"
                      )}
                    />
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{editingFixedId ? 'Salvar Alterações' : 'Cadastrar Conta Fixa'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Custom Month Picker Modal */}
      <AnimatePresence>
        {isMonthPickerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMonthPickerModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className={cn(
                "w-[95%] sm:w-full max-w-md rounded-[32px] p-6 relative z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-5 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <h2 className={cn("text-lg font-extrabold", isDark ? "text-white" : "text-zinc-900")}>
                      Selecionar Mês
                    </h2>
                    <p className="text-xs text-zinc-400">Escolha o mês de referência</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsMonthPickerModalOpen(false)} 
                  className={cn("p-2.5 rounded-full shadow-sm transition-all cursor-pointer", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={20} />
                </motion.button>
              </div>

              {/* Year Navigation */}
              <div className={cn(
                "p-2 rounded-2xl border flex items-center justify-between mb-4 shadow-sm",
                isDark ? "bg-zinc-950/80 border-zinc-800" : "bg-zinc-50 border-zinc-200"
              )}>
                <button
                  type="button"
                  onClick={() => setMonthPickerYear(prev => prev - 1)}
                  className={cn("p-2 rounded-xl transition-all cursor-pointer", isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-200 text-zinc-700")}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className={cn("font-black text-base tracking-wider", isDark ? "text-white" : "text-zinc-900")}>
                  {monthPickerYear}
                </span>
                <button
                  type="button"
                  onClick={() => setMonthPickerYear(prev => prev + 1)}
                  className={cn("p-2 rounded-xl transition-all cursor-pointer", isDark ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-200 text-zinc-700")}
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* 12 Months Grid */}
              <div className="grid grid-cols-3 gap-2.5 flex-1 overflow-y-auto no-scrollbar pr-1">
                {(() => {
                  const months = [
                    'Janeiro', 'Fevereiro', 'Março', 'Abril',
                    'Maio', 'Junho', 'Julho', 'Agosto',
                    'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                  ];

                  const today = new Date();
                  const currentRealYear = today.getFullYear();
                  const currentRealMonth = today.getMonth() + 1; // 1-12

                  return months.map((monthName, idx) => {
                    const monthNum = idx + 1;
                    const monthMm = String(monthNum).padStart(2, '0');
                    const key = `${monthPickerYear}-${monthMm}`;
                    const isSelected = selectedMonthKey === key;
                    const isCurrentRealMonth = monthPickerYear === currentRealYear && monthNum === currentRealMonth;

                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedMonthKey(key);
                          setIsMonthPickerModalOpen(false);
                        }}
                        className={cn(
                          "p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer relative shadow-sm",
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20 font-bold"
                            : (isDark
                                ? "bg-zinc-800/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700"
                                : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:border-zinc-300")
                        )}
                      >
                        <span className="font-bold text-xs">{monthName}</span>
                        {isCurrentRealMonth && (
                          <span className={cn(
                            "text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wider",
                            isSelected ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-500"
                          )}>
                            Atual
                          </span>
                        )}
                      </motion.button>
                    );
                  });
                })()}
              </div>

              {/* Reset to Today Button */}
              <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const mm = String(today.getMonth() + 1).padStart(2, '0');
                    setSelectedMonthKey(`${today.getFullYear()}-${mm}`);
                    setIsMonthPickerModalOpen(false);
                  }}
                  className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Clock size={15} />
                  <span>Voltar para Mês Atual</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings & Profile Modal */}
      <AnimatePresence>
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-lg rounded-[32px] p-6 sm:p-7 relative z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Settings size={22} />
                  </div>
                  <div>
                    <h2 className={cn("text-lg sm:text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>
                      Configurações & Perfil
                    </h2>
                    <p className="text-xs text-zinc-400">Preferências, segurança e conta</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowProfileModal(false)} 
                  className={cn("p-2 rounded-full shadow-2xs transition-all cursor-pointer", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={18} />
                </motion.button>
              </div>

              {/* Navigation Tabs */}
              <div className={cn("flex rounded-2xl p-1 mb-5 gap-1 shrink-0 overflow-x-auto no-scrollbar border", isDark ? "bg-zinc-950/60 border-zinc-800" : "bg-zinc-100/80 border-zinc-200/60")}>
                {[
                  { id: 'profile', label: 'Perfil', icon: User },
                  { id: 'preferences', label: 'Finanças', icon: SlidersHorizontal },
                  { id: 'notifications', label: 'Alertas', icon: Bell },
                  { id: 'security', label: 'Segurança', icon: Shield },
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = settingsTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as any)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer",
                        isActive 
                          ? (isDark ? "bg-zinc-800 text-emerald-400 shadow-xs" : "bg-white text-emerald-700 shadow-2xs") 
                          : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      )}
                    >
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Tab Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 no-scrollbar">
                {settingsTab === 'profile' && (
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    {/* User Avatar Banner */}
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4",
                      isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-emerald-50/50 border-emerald-100"
                    )}>
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                        {editProfileForm.firstName ? editProfileForm.firstName.charAt(0).toUpperCase() : 'G'}
                        {editProfileForm.lastName ? editProfileForm.lastName.charAt(0).toUpperCase() : ''}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className={cn("font-bold text-base truncate", isDark ? "text-white" : "text-zinc-900")}>
                          {editProfileForm.firstName || 'Gleydson'} {editProfileForm.lastName || ''}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate">{editProfileForm.email || 'gleydsonr723@gmail.com'}</p>
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Conta Ativa
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Plano Pro
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                          Nome
                        </label>
                        <input 
                          type="text" 
                          value={editProfileForm.firstName}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, firstName: e.target.value })}
                          className={cn("w-full border-none rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-800")}
                        />
                      </div>
                      <div>
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                          Sobrenome
                        </label>
                        <input 
                          type="text" 
                          value={editProfileForm.lastName}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, lastName: e.target.value })}
                          className={cn("w-full border-none rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-800")}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                        E-mail Principal
                      </label>
                      <input 
                        type="email" 
                        value={editProfileForm.email}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, email: e.target.value })}
                        className={cn("w-full border-none rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-800")}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                          Idade
                        </label>
                        <input 
                          type="number" 
                          value={editProfileForm.age}
                          onChange={(e) => setEditProfileForm({ ...editProfileForm, age: e.target.value })}
                          className={cn("w-full border-none rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-800")}
                        />
                      </div>
                      <div>
                        <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                          Cidade / Estado
                        </label>
                        <input 
                          type="text" 
                          value={`${editProfileForm.city}${editProfileForm.state ? ' / ' + editProfileForm.state : ''}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            const parts = val.split('/');
                            setEditProfileForm({ ...editProfileForm, city: parts[0]?.trim() || '', state: parts[1]?.trim() || '' });
                          }}
                          className={cn("w-full border-none rounded-xl p-3 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-zinc-50 text-zinc-800")}
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10 text-sm cursor-pointer"
                      >
                        Salvar Alterações
                      </motion.button>
                    </div>
                  </form>
                )}

                {settingsTab === 'preferences' && (
                  <div className="space-y-4">
                    <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Moeda Principal</p>
                          <p className="text-[11px] text-zinc-400">Moeda exibida nos totais e extratos</p>
                        </div>
                        <select
                          value={appSettings.currency}
                          onChange={(e) => setAppSettings({ ...appSettings, currency: e.target.value })}
                          className={cn("px-3 py-2 rounded-xl text-xs font-bold border-none outline-none cursor-pointer", isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-800 shadow-2xs")}
                        >
                          <option value="BRL">BRL (R$)</option>
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                        </select>
                      </div>

                      <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Início do Ciclo Mensal</p>
                          <p className="text-[11px] text-zinc-400">Dia em que seus orçamentos e salário resetam</p>
                        </div>
                        <select
                          value={appSettings.cycleStartDay}
                          onChange={(e) => setAppSettings({ ...appSettings, cycleStartDay: e.target.value })}
                          className={cn("px-3 py-2 rounded-xl text-xs font-bold border-none outline-none cursor-pointer", isDark ? "bg-zinc-800 text-white" : "bg-white text-zinc-800 shadow-2xs")}
                        >
                          <option value="1">Dia 01</option>
                          <option value="5">Dia 05</option>
                          <option value="10">Dia 10</option>
                          <option value="15">Dia 15</option>
                          <option value="25">Dia 25</option>
                        </select>
                      </div>
                    </div>

                    <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Modo Privado Padrão</p>
                          <p className="text-[11px] text-zinc-400">Ocultar valores monetários ao abrir o aplicativo</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, hideValuesDefault: !appSettings.hideValuesDefault })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.hideValuesDefault ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.hideValuesDefault ? "right-1" : "left-1")} />
                        </button>
                      </div>

                      <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Alertas de Estouro de Metas</p>
                          <p className="text-[11px] text-zinc-400">Avisar quando ultrapassar 80% da meta por categoria</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, budgetAlerts: !appSettings.budgetAlerts })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.budgetAlerts ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.budgetAlerts ? "right-1" : "left-1")} />
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleSaveProfile(e as any)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all text-xs cursor-pointer"
                    >
                      Salvar Preferências
                    </motion.button>
                  </div>
                )}

                {settingsTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Lembrete de Contas a Vencer</p>
                          <p className="text-[11px] text-zinc-400">Alertar com 3 dias de antecedência sobre vencimentos</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, dueBillNotifications: !appSettings.dueBillNotifications })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.dueBillNotifications ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.dueBillNotifications ? "right-1" : "left-1")} />
                        </button>
                      </div>

                      <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Relatórios Inteligentes da Anny</p>
                          <p className="text-[11px] text-zinc-400">Receber insights semanais sobre seus hábitos de consumo</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, weeklyReport: !appSettings.weeklyReport })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.weeklyReport ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.weeklyReport ? "right-1" : "left-1")} />
                        </button>
                      </div>

                      <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Efeitos Sonoros</p>
                          <p className="text-[11px] text-zinc-400">Sons de confirmação ao registrar transações</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, soundEffects: !appSettings.soundEffects })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.soundEffects ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.soundEffects ? "right-1" : "left-1")} />
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleSaveProfile(e as any)}
                      className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-500 transition-all text-xs cursor-pointer"
                    >
                      Salvar Notificações
                    </motion.button>
                  </div>
                )}

                {settingsTab === 'security' && (
                  <div className="space-y-4">
                    <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Proteção por PIN / Biometria</p>
                          <p className="text-[11px] text-zinc-400">Exigir autenticação ao abrir o aplicativo</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAppSettings({ ...appSettings, biometricsLock: !appSettings.biometricsLock })}
                          className={cn("w-11 h-6 rounded-full transition-all relative cursor-pointer", appSettings.biometricsLock ? "bg-emerald-600" : (isDark ? "bg-zinc-700" : "bg-zinc-300"))}
                        >
                          <span className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-xs", appSettings.biometricsLock ? "right-1" : "left-1")} />
                        </button>
                      </div>

                      <hr className={isDark ? "border-zinc-800" : "border-zinc-200"} />

                      <div className="flex justify-between items-center">
                        <div>
                          <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Tema da Interface</p>
                          <p className="text-[11px] text-zinc-400">{isDark ? "Modo Escuro Ativo" : "Modo Claro Ativo"}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsDark(!isDark)}
                          className={cn("px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border cursor-pointer transition-all", isDark ? "bg-zinc-800 border-zinc-700 text-yellow-400" : "bg-white border-zinc-200 text-zinc-700 shadow-2xs")}
                        >
                          {isDark ? <Sun size={14} /> : <Moon size={14} />}
                          <span>{isDark ? 'Escuro' : 'Claro'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Password Change Form */}
                    <div className={cn("p-4 rounded-2xl border space-y-3", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>Alterar Senha de Acesso</p>
                      <form onSubmit={handleChangePassword} className="space-y-2.5">
                        <input
                          type="password"
                          placeholder="Senha atual"
                          value={currentPasswordInput}
                          onChange={(e) => setCurrentPasswordInput(e.target.value)}
                          className={cn("w-full border-none rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-white text-zinc-800 shadow-2xs")}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="password"
                            placeholder="Nova senha"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            className={cn("w-full border-none rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-white text-zinc-800 shadow-2xs")}
                          />
                          <input
                            type="password"
                            placeholder="Confirmar nova senha"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            className={cn("w-full border-none rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition-all", isDark ? "bg-zinc-800 text-zinc-200" : "bg-white text-zinc-800 shadow-2xs")}
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Atualizar Senha
                        </button>
                      </form>
                    </div>

                    {/* Export & Import Actions */}
                    <div className={cn("p-4 rounded-2xl border space-y-2.5", isDark ? "bg-zinc-800/40 border-zinc-800" : "bg-zinc-50 border-zinc-200/60")}>
                      <p className={cn("text-xs font-bold mb-1", isDark ? "text-white" : "text-zinc-900")}>Exportação & Backup de Dados</p>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={handleExportCSV}
                          className={cn(
                            "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                            isDark ? "bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-emerald-700 hover:bg-emerald-50 shadow-2xs"
                          )}
                          title="Exportar Extrato em CSV"
                        >
                          <Download size={13} />
                          <span>Extrato CSV</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className={cn(
                            "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                            isDark ? "bg-zinc-800 border-zinc-700 text-blue-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-blue-700 hover:bg-blue-50 shadow-2xs"
                          )}
                          title="Baixar Backup JSON"
                        >
                          <Database size={13} />
                          <span>Baixar Backup</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => backupFileInputRef.current?.click()}
                          className={cn(
                            "py-2.5 px-2 rounded-xl border text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                            isDark ? "bg-zinc-800 border-zinc-700 text-amber-400 hover:bg-zinc-700" : "bg-white border-zinc-200 text-amber-700 hover:bg-amber-50 shadow-2xs"
                          )}
                          title="Restaurar dados a partir de arquivo JSON"
                        >
                          <FileUp size={13} />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setShowProfileModal(false);
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 py-3 rounded-2xl font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-2 border border-rose-500/20"
                      >
                        <LogOut size={15} />
                        <span>Sair da Conta / Encerrar Sessão</span>
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Goal Setting Modal */}
      <AnimatePresence>
        {selectedCategoryForGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCategoryForGoal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
                  <span>{getCategoryIcon(selectedCategoryForGoal)}</span>
                  Definir Meta
                </h2>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedCategoryForGoal(null)} 
                  className={cn("p-2 rounded-full shadow-sm transition-all", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={18} />
                </motion.button>
              </div>

              <div className="space-y-4">
                <p className={cn("text-xs font-semibold uppercase tracking-wider text-zinc-500")}>
                  Meta mensal para {selectedCategoryForGoal}
                </p>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="50"
                    min="0"
                    value={editGoalValue}
                    onChange={(e) => setEditGoalValue(e.target.value)}
                    placeholder="0,00"
                    className={cn(
                      "w-full border-none rounded-2xl p-4 pl-12 font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDark ? "bg-zinc-800 text-white focus:bg-zinc-800" : "bg-zinc-50 text-zinc-900"
                    )}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const val = parseFloat(editGoalValue);
                      const finalGoal = isNaN(val) || val < 0 ? 0 : val;
                      setCategoryGoals(prev => ({
                        ...prev,
                        [selectedCategoryForGoal]: finalGoal
                      }));
                      setSelectedCategoryForGoal(null);
                    }}
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/10 text-sm"
                  >
                    Salvar Meta
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategoryForGoal(null)}
                    className={cn(
                      "flex-1 py-3.5 rounded-2xl font-bold transition-all text-sm",
                      isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-md rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col max-h-[90vh]", 
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className={cn("text-2xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Nova Transação</h2>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsModalOpen(false)} 
                  className={cn("p-2.5 rounded-full shadow-sm transition-all", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={20} />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className={cn("flex p-1 rounded-2xl", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      type === 'expense' 
                        ? (isDark ? "bg-zinc-700 text-rose-400 shadow-sm" : "bg-white text-rose-600 shadow-sm") 
                        : "text-zinc-500"
                    )}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-sm font-bold transition-all",
                      type === 'income' 
                        ? (isDark ? "bg-zinc-700 text-emerald-400 shadow-sm" : "bg-white text-emerald-600 shadow-sm") 
                        : "text-zinc-500"
                    )}
                  >
                    Receita
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>Descrição</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Aluguel, Salário..."
                      className={cn(
                        "w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all",
                        isDark ? "bg-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-300"
                      )}
                    />
                  </div>

                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>Valor</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                      <input
                        type="number"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0,00"
                        className={cn(
                          "w-full border-none rounded-2xl p-4 pl-12 font-bold text-xl focus:ring-2 focus:ring-emerald-500 transition-all",
                          isDark ? "bg-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-300"
                        )}
                      />
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-2 block", isDark ? "text-zinc-400" : "text-black")}>
                      Forma de Pagamento
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'debito', label: 'Débito', icon: '💳' },
                        { id: 'credito', label: 'Crédito', icon: '💳' },
                        { id: 'pix', label: 'PIX', icon: '⚡' },
                        { id: 'boleto', label: 'Boleto', icon: '📄' },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(pm.id as any);
                            if (pm.id === 'credito' && type === 'expense') {
                              setIsInstallment(true);
                            } else if (pm.id !== 'credito') {
                              setIsInstallment(false);
                            }
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-2.5 rounded-2xl border-2 transition-all gap-1 cursor-pointer",
                            paymentMethod === pm.id
                              ? (isDark ? "bg-emerald-900/30 border-emerald-500 text-emerald-400 font-bold ring-1 ring-emerald-500" : "bg-emerald-50 border-emerald-500 text-emerald-700 font-bold ring-1 ring-emerald-500")
                              : (isDark ? "bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700" : "bg-zinc-50 border-transparent text-zinc-600 hover:bg-zinc-100")
                          )}
                        >
                          <span className="text-base">{pm.icon}</span>
                          <span className="text-[10px] uppercase font-bold truncate">{pm.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className={cn("text-xs font-bold uppercase tracking-widest mb-3 block", isDark ? "text-zinc-400" : "text-black")}>Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(cat => (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          key={cat}
                          type="button"
                          onClick={() => {
                            setIsCustomCategory(false);
                            setCategory(cat);
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1",
                            !isCustomCategory && category === cat
                              ? (isDark ? "bg-emerald-900/20 border-emerald-500 text-emerald-400" : "bg-emerald-50 border-emerald-500 text-emerald-600")
                              : (isDark ? "bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100")
                          )}
                        >
                          <span className="text-xl">{getCategoryIcon(cat)}</span>
                          <span className="text-[10px] font-bold uppercase truncate w-full text-center">{cat}</span>
                        </motion.button>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setIsCustomCategory(true)}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all gap-1",
                          isCustomCategory
                            ? (isDark ? "bg-emerald-900/20 border-emerald-500 text-emerald-400" : "bg-emerald-50 border-emerald-500 text-emerald-600")
                            : (isDark ? "bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700" : "bg-zinc-50 border-transparent text-zinc-500 hover:bg-zinc-100")
                        )}
                      >
                        <span className="text-xl">➕</span>
                        <span className="text-[10px] font-bold uppercase">Outra...</span>
                      </motion.button>
                    </div>

                    {isCustomCategory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4"
                      >
                        <input
                          type="text"
                          value={customCategoryName}
                          onChange={(e) => setCustomCategoryName(e.target.value)}
                          placeholder="Nome da categoria (ex: Vestuário)"
                          maxLength={20}
                          className={cn(
                            "w-full border-none rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 transition-all",
                            isDark ? "bg-zinc-800 text-white placeholder:text-zinc-600" : "bg-zinc-50 text-zinc-900 placeholder:text-zinc-300"
                          )}
                        />
                        <p className="text-[10px] text-zinc-400 mt-2 pl-1 italic">
                          Dica: A Anny escolherá um ícone automaticamente! {customCategoryName && `(${getCategoryIcon(customCategoryName)})`}
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Parcelamento Inteligente com Juros do Banco */}
                  {type === 'expense' && (
                    <div className={cn(
                      "p-4 rounded-2xl border transition-all space-y-4",
                      isDark ? "bg-zinc-800/80 border-zinc-700" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <p className={cn("text-xs font-bold", isDark ? "text-white" : "text-zinc-900")}>
                              Compra Parcelada no Cartão
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Calcula juros reais por instituição financeira
                            </p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setIsInstallment(!isInstallment)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                            isInstallment ? "bg-emerald-500" : (isDark ? "bg-zinc-700" : "bg-zinc-300")
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              isInstallment ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      {isInstallment && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-3 border-t border-zinc-200/50 dark:border-zinc-700/50"
                        >
                          {/* Seleção de Banco / Cartão */}
                          <div>
                            <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-2 block", isDark ? "text-zinc-400" : "text-zinc-600")}>
                              Banco / Emissor do Cartão
                            </label>
                            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto no-scrollbar pr-1">
                              {BANK_RATES.map((bank) => {
                                const isSelected = selectedBankId === bank.id;
                                return (
                                  <button
                                    key={bank.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedBankId(bank.id);
                                      setCustomInterestRate('');
                                    }}
                                    className={cn(
                                      "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 cursor-pointer",
                                      isSelected
                                        ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                                        : (isDark ? "border-zinc-700 bg-zinc-900/60 hover:bg-zinc-800" : "border-zinc-200 bg-white hover:bg-zinc-100")
                                    )}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className={cn("text-xs font-bold truncate", isDark ? "text-white" : "text-zinc-900")}>
                                        {bank.name}
                                      </span>
                                      <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-extrabold text-white shrink-0", bank.logoBg)}>
                                        {bank.code}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-medium">
                                      {bank.averageMonthlyInterest > 0 ? `~${bank.averageMonthlyInterest.toString().replace('.', ',')}% a.m.` : '0% Sem Juros'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quantidade de Parcelas + Taxa de Juros Customizada */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-1.5 block", isDark ? "text-zinc-400" : "text-zinc-600")}>
                                Parcelas
                              </label>
                              <select
                                value={installmentsCount}
                                onChange={(e) => setInstallmentsCount(parseInt(e.target.value))}
                                className={cn(
                                  "w-full border-none rounded-xl p-3 font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer",
                                  isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900 border border-zinc-200 shadow-sm"
                                )}
                              >
                                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 24, 36].map(num => (
                                  <option key={num} value={num}>
                                    {num}x parcelas
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={cn("text-[10px] font-bold uppercase tracking-wider mb-1.5 block", isDark ? "text-zinc-400" : "text-zinc-600")}>
                                Taxa Juros (% a.m.)
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={(() => {
                                    const b = BANK_RATES.find(x => x.id === selectedBankId);
                                    return b ? b.averageMonthlyInterest.toString() : '0';
                                  })()}
                                  value={customInterestRate}
                                  onChange={(e) => setCustomInterestRate(e.target.value)}
                                  className={cn(
                                    "w-full border-none rounded-xl p-3 pr-7 font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none",
                                    isDark ? "bg-zinc-900 text-white placeholder:text-zinc-600" : "bg-white text-zinc-900 border border-zinc-200 shadow-sm placeholder:text-zinc-400"
                                  )}
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">%</span>
                              </div>
                            </div>
                          </div>

                          {/* Painel de Cálculo de Fatura do Banco */}
                          {parseFloat(amount) > 0 && (() => {
                            const currentBank = BANK_RATES.find(b => b.id === selectedBankId) || BANK_RATES[0];
                            const rate = customInterestRate !== '' && !isNaN(parseFloat(customInterestRate))
                              ? Math.max(0, parseFloat(customInterestRate))
                              : currentBank.averageMonthlyInterest;
                            
                            const calcResult = calculateInstallments(parseFloat(amount), installmentsCount, rate);

                            return (
                              <div className={cn(
                                "p-3.5 rounded-2xl border space-y-3",
                                isDark ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" : "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                              )}>
                                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                                  <span className="text-xs font-bold flex items-center gap-1.5">
                                    <Calculator size={14} className="text-emerald-500" />
                                    Fatura Real ({currentBank.name})
                                  </span>
                                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500">
                                    {rate > 0 ? `${rate.toString().replace('.', ',')}% a.m.` : 'Sem Juros'}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <p className="text-[10px] text-zinc-400 font-medium">Parcela Mensal:</p>
                                    <p className="font-black text-sm sm:text-base text-emerald-500">
                                      {installmentsCount}x de {formatCurrency(calcResult.monthlyPayment)}
                                    </p>
                                  </div>

                                  <div>
                                    <p className="text-[10px] text-zinc-400 font-medium">Total com Juros:</p>
                                    <p className="font-bold text-xs sm:text-sm">
                                      {formatCurrency(calcResult.totalWithInterest)}
                                    </p>
                                  </div>
                                </div>

                                {calcResult.totalInterest > 0 ? (
                                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-semibold flex items-center justify-between">
                                    <span>💸 Total em Juros Cobrados:</span>
                                    <span className="font-black">+{formatCurrency(calcResult.totalInterest)}</span>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold text-center">
                                    ✅ NENHUM JUROS ADICIONAL
                                  </div>
                                )}

                                {/* Opções de Agendamento */}
                                <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Modo de Agendamento</p>
                                  <label className="flex items-center gap-2 text-[11px] font-medium cursor-pointer">
                                    <input
                                      type="radio"
                                      name="scheduleMode"
                                      checked={scheduleAllInstallments}
                                      onChange={() => setScheduleAllInstallments(true)}
                                      className="accent-emerald-500"
                                    />
                                    <span>Agendar todas as {installmentsCount} parcelas nos meses futuros</span>
                                  </label>
                                  <label className="flex items-center gap-2 text-[11px] font-medium cursor-pointer">
                                    <input
                                      type="radio"
                                      name="scheduleMode"
                                      checked={!scheduleAllInstallments}
                                      onChange={() => setScheduleAllInstallments(false)}
                                      className="accent-emerald-500"
                                    />
                                    <span>Lançar apenas 1ª parcela ({formatCurrency(calcResult.monthlyPayment)}) neste mês</span>
                                  </label>
                                </div>
                              </div>
                            );
                          })()}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  {type === 'expense' ? 'Adicionar gasto' : 'Adicionar entrada'}
                </button>
              </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Help Chat Modal */}
      <AnimatePresence>
        {showHelpChat && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHelpChat(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className={cn(
                "relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              {/* Chat Header */}
              <div className="bg-emerald-600 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-2 border-white/30 shadow-inner">
                    <img 
                      src={ANNY_AVATAR} 
                      alt="Anny" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold">Anny</h3>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-400"
                      )} />
                      <p className="text-[10px] text-emerald-100">
                        {isConnected ? "Online" : "Conectando..."}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(isAdmin || chatMessages.length > 0) && (
                    <button 
                      onClick={handleEndService}
                      className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-[10px] font-bold transition-colors"
                    >
                      Finalizar
                    </button>
                  )}
                  <button 
                    onClick={() => setShowHelpChat(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Chat Body */}
              <div className="p-6 space-y-4 h-[50vh] overflow-y-auto bg-zinc-50 dark:bg-zinc-950/50 relative">
                {/* Welcome Message */}
                <div className="flex justify-start items-start gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 shrink-0 shadow-sm">
                    <img src={ANNY_AVATAR} alt="Anny" className="w-full h-full object-cover" />
                  </div>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed shadow-sm space-y-1.5",
                    isDark ? "bg-zinc-800 text-zinc-200" : "bg-white text-zinc-700"
                  )}>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Olá {userName}! 👋</p>
                    <p>Eu sou a <strong>Anny</strong>, sua consultora e assistente financeira pessoal no <strong>Start Finanças</strong>.</p>
                    <p className="text-xs text-zinc-400 pt-1">Estou conectada ao seu saldo, categorias, despesas e metas para te dar conselhos sob medida. Como posso te orientar hoje?</p>
                  </div>
                </div>

                {/* Chat Messages */}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.sender === (isAdmin ? 'admin' : 'user') ? "justify-end" : "justify-start items-start")}>
                    {msg.sender !== (isAdmin ? 'admin' : 'user') && !msg.isSystem && (
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 shrink-0 shadow-sm flex items-center justify-center bg-emerald-600 text-white text-[10px] font-bold">
                        {msg.sender === 'Anny' || msg.sender === 'anny' ? (
                          <img src={ANNY_AVATAR} alt="Anny" className="w-full h-full object-cover" />
                        ) : (
                          'AT'
                        )}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] p-4 rounded-2xl text-sm shadow-sm",
                      msg.sender === (isAdmin ? 'admin' : 'user') 
                        ? "bg-emerald-600 text-white rounded-tr-none" 
                        : (isDark ? "bg-zinc-800 text-zinc-200 rounded-tl-none" : "bg-white text-zinc-700 rounded-tl-none"),
                      msg.isSystem && "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 italic text-center w-full max-w-none rounded-none shadow-none"
                    )}>
                      {msg.isSystem ? (
                        <p className="text-xs">{msg.text}</p>
                      ) : (
                        <>
                          <p className="font-bold text-[10px] mb-1 opacity-70 uppercase tracking-wider">
                            {msg.sender === 'admin' ? 'Atendente' : (msg.sender === 'Anny' ? 'Anny • Consultora IA' : userName)}
                          </p>
                          {msg.fileData && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/10">
                              {msg.fileType?.startsWith('image/') ? (
                                <img src={msg.fileData} alt="Shared" className="max-w-full h-auto" referrerPolicy="no-referrer" />
                              ) : msg.fileType?.startsWith('video/') ? (
                                <video src={msg.fileData} controls className="max-w-full h-auto" />
                              ) : null}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap leading-relaxed space-y-1">
                            {msg.text.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                              if (part.startsWith('**') && part.endsWith('**')) {
                                return <strong key={idx} className="font-bold underline decoration-emerald-500/40">{part.slice(2, -2)}</strong>;
                              }
                              return part;
                            })}
                          </div>
                          {(msg.showBackMenu || ((msg.sender === 'Anny' || msg.sender === 'anny') && !showMenu)) && (
                            <button
                              onClick={() => setShowMenu(true)}
                              className="mt-3 text-[10px] font-bold text-emerald-500 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ChevronRight size={10} className="rotate-180" />
                              Voltar ao menu de Temas Comuns
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isAnnyTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start items-start gap-2"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 shrink-0 shadow-sm">
                      <img src={ANNY_AVATAR} alt="Anny" className="w-full h-full object-cover" />
                    </div>
                    <div className={cn(
                      "p-3 rounded-2xl rounded-tl-none flex gap-1 items-center",
                      isDark ? "bg-zinc-800" : "bg-white"
                    )}>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Rating Overlay */}
              <AnimatePresence>
                {showRating && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className={cn(
                      "absolute inset-0 z-50 p-8 flex flex-col items-center justify-center text-center",
                      isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                    )}
                  >
                    {!ratingSubmitted ? (
                      <>
                        <h4 className="text-xl font-bold mb-2">Avalie nosso atendimento</h4>
                        <p className={cn("text-sm mb-8", isDark ? "text-zinc-400" : "text-zinc-500")}>Sua opinião é muito importante para nós!</p>
                        
                        <div className="flex gap-2 mb-4">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className="transition-transform active:scale-90"
                            >
                              <Star 
                                size={40} 
                                fill={rating >= star ? "#EAB308" : "transparent"} 
                                className={cn(
                                  rating >= star ? "text-yellow-500" : (isDark ? "text-zinc-700" : "text-zinc-200")
                                )}
                              />
                            </button>
                          ))}
                        </div>
                        
                        {rating > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="w-full space-y-4"
                          >
                            <p className="text-sm font-bold text-yellow-600">
                              {rating === 1 && "Péssimo"}
                              {rating === 2 && "Ruim"}
                              {rating === 3 && "Padrão"}
                              {rating === 4 && "Bom"}
                              {rating === 5 && "Ótimo"}
                            </p>
                            
                            <textarea
                              value={ratingComment}
                              onChange={(e) => setRatingComment(e.target.value)}
                              placeholder="Deixe um comentário (opcional)"
                              className={cn(
                                "w-full p-4 rounded-2xl border text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none h-24",
                                isDark ? "bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-700" : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-300"
                              )}
                            />
                            
                            <button
                              onClick={handleSubmitRating}
                              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold transition-all active:scale-[0.98]"
                            >
                              Enviar Avaliação
                            </button>
                          </motion.div>
                        )}
                      </>
                    ) : (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-4xl mb-4">
                          🎉
                        </div>
                        <h4 className="text-xl font-bold mb-2">Obrigado!</h4>
                        <p className={cn("text-sm", isDark ? "text-zinc-400" : "text-zinc-500")}>Sua avaliação foi enviada com sucesso.</p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Footer / Input */}
              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                {showMenu && !isAdmin && (
                  <div className="mb-4 space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">Temas Comuns</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '💡 Analisar meu Saldo', msg: 'Analise meu saldo atual e diga como está minha situação.' },
                        { label: '⚡ Onde economizar?', msg: 'Análise minhas maiores categorias de gasto e sugira onde economizar.' },
                        { label: '🎯 Progresso das Metas', msg: 'Analise minhas metas financeiras e como posso alcançá-las mais rápido.' },
                        { label: '🔮 Previsão de Saldo', msg: 'Qual a previsão do meu saldo para o final do mês?' },
                        { label: '💳 Analisar Contas Fixas', msg: 'Quais são minhas principais contas fixas do mês?' },
                        { label: '📊 Dicas de Investimento', msg: 'Quais opções de investimento combinam com minhas economias?' },
                        { label: 'Como cadastrar?', msg: 'Como cadastrar novos gastos?' },
                        { label: 'Dashboard', msg: 'Gostaria de entender os gráficos do Dashboard' },
                        { label: 'Falar com Atendente', msg: 'Desejo falar com um atendente humano' },
                      ].map((item, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(item.msg)}
                          className={cn(
                            "px-3 py-1.5 text-[10px] font-medium rounded-full border transition-all active:scale-[0.98]",
                            isDark ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!showMenu && !isAdmin && (
                  <div className="mb-3 flex justify-between items-center px-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Opções de ajuda</p>
                    <button
                      type="button"
                      onClick={() => setShowMenu(true)}
                      className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer transition-all active:scale-[0.98]"
                    >
                      <ChevronRight size={10} className="rotate-180" />
                      Visualizar Temas Comuns (Balões)
                    </button>
                  </div>
                )}

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage(chatInput, isAdmin ? 'admin' : 'user');
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className={cn(
                      "flex-1 p-3 rounded-2xl text-sm outline-none border transition-all",
                      isDark ? "bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500" : "bg-zinc-50 border-zinc-100 focus:border-emerald-500"
                    )}
                  />
                  <label className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 cursor-pointer active:scale-90 transition-transform">
                    <Paperclip size={18} />
                    <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                  </label>
                  <button 
                    type="submit"
                    className="p-3 rounded-2xl bg-emerald-600 text-white active:scale-90 transition-transform shadow-lg shadow-emerald-500/20"
                  >
                    <Send size={18} />
                  </button>
                </form>
                <p className="text-[10px] text-center text-zinc-400 mt-3">
                  {isAdmin ? "Modo Atendente Ativo" : "Suporte disponível em horário comercial"}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotifSettings && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifSettings(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 relative z-10 shadow-2xl overflow-hidden",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Notificações e Alertas</h3>
                <button 
                  onClick={() => setShowNotifSettings(false)} 
                  className={cn(
                    "p-2 rounded-full transition-all active:scale-95",
                    isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 shadow-sm hover:bg-zinc-50"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                {/* Alerts List */}
                {alerts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Alertas Recentes</h4>
                    {alerts.map(alert => (
                      <div 
                        key={alert.id}
                        className={cn(
                          "p-4 rounded-2xl border flex gap-3 items-start",
                          alert.read ? "opacity-60" : "border-emerald-500/30 bg-emerald-500/5"
                        )}
                      >
                        <div className="mt-1 shrink-0">
                          {alert.type === 'low_balance' ? (
                            <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
                          ) : alert.type === 'budget_near' ? (
                            <AlertTriangle size={18} className="text-amber-500" />
                          ) : alert.type === 'high_spending' ? (
                            <ArrowDownCircle size={18} className="text-rose-500" />
                          ) : alert.type === 'budget_limit' ? (
                            <ArrowUpCircle size={18} className="text-emerald-500" />
                          ) : (
                            <Zap size={18} className="text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold leading-relaxed break-words", isDark ? "text-zinc-200" : "text-zinc-800")}>{alert.message}</p>
                          <p className="text-[9px] text-zinc-500 mt-1">{format(new Date(alert.timestamp), "HH:mm '•' dd/MM")}</p>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => setAlerts(alerts.map(a => ({...a, read: true})))}
                      className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest w-full text-center py-2 hover:text-emerald-400 transition-colors"
                    >
                      Marcar todos como lidos
                    </button>
                  </div>
                )}

                {/* Settings */}
                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Configurações da Anny</h4>
                  
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <Bell size={18} className="text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold">Lembretes</p>
                        <p className="text-[10px] text-zinc-500">Contas e vencimentos</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNotifSettings({...notifSettings, reminders: !notifSettings.reminders})}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", notifSettings.reminders ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")}
                    >
                      <motion.div animate={{ x: notifSettings.reminders ? 24 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <Zap size={18} className="text-amber-500" />
                      <div>
                        <p className="text-sm font-bold">Alertas Inteligentes</p>
                        <p className="text-[10px] text-zinc-500">Saldo baixo e gastos altos</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNotifSettings({...notifSettings, alerts: !notifSettings.alerts})}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", notifSettings.alerts ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")}
                    >
                      <motion.div animate={{ x: notifSettings.alerts ? 24 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <Sparkles size={18} className="text-purple-500" />
                      <div>
                        <p className="text-sm font-bold">Dicas Financeiras</p>
                        <p className="text-[10px] text-zinc-500">Sugestões personalizadas</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setNotifSettings({...notifSettings, tips: !notifSettings.tips})}
                      className={cn("w-12 h-6 rounded-full transition-colors relative", notifSettings.tips ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700")}
                    >
                      <motion.div animate={{ x: notifSettings.tips ? 24 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Limite de Saldo Baixo</label>
                      <input 
                        type="range" min="100" max="5000" step="100"
                        value={notifSettings.lowBalanceThreshold}
                        onChange={(e) => setNotifSettings({...notifSettings, lowBalanceThreshold: parseInt(e.target.value)})}
                        className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                        <span>R$ 100</span>
                        <span className="text-emerald-500">{formatCurrency(notifSettings.lowBalanceThreshold)}</span>
                        <span>R$ 5.000</span>
                      </div>
                    </div>
                  </div>


                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resumos & Saúde Financeira da Anny Modal */}
      <AnimatePresence>
        {showAnnySummaryModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAnnySummaryModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "w-full max-w-xl rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar",
                isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/40 shadow-sm shrink-0">
                    <img src={ANNY_AVATAR} alt="Anny" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                      <span>Análises da Anny</span>
                      <Sparkles size={16} className="text-amber-500" />
                    </h3>
                    <p className="text-xs text-zinc-400">Resumos periódicos e pontuação de saúde</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAnnySummaryModal(false)}
                  className={cn(
                    "p-2 rounded-full transition-all active:scale-95 cursor-pointer",
                    isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sub-Tabs */}
              <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl mb-6">
                <button
                  onClick={() => setSummaryTab('semanal')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    summaryTab === 'semanal' 
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  🗓️ Resumo Semanal
                </button>
                <button
                  onClick={() => setSummaryTab('mensal')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    summaryTab === 'mensal' 
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  📊 Resumo Mensal
                </button>
                <button
                  onClick={() => setSummaryTab('saude')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer",
                    summaryTab === 'saude' 
                      ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                  )}
                >
                  💚 Saúde (0-100)
                </button>
              </div>

              {/* Tab Content */}
              {summaryTab === 'semanal' && (() => {
                const weekly = getWeeklySummary(transactions);
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Receitas</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(weekly.income)}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Despesas</p>
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400 truncate">{formatCurrency(weekly.expense)}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Economia</p>
                        <p className={cn("text-sm font-black truncate", weekly.savings >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {formatCurrency(weekly.savings)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Maior Categoria de Gastos:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{weekly.topCat}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Movimentações na Semana:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{weekly.count} registros</span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-emerald-500" />
                        <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Sugestão da Anny para a Semana</h4>
                      </div>
                      <p className="text-xs leading-relaxed font-medium text-zinc-700 dark:text-zinc-300">
                        "{weekly.suggestion}"
                      </p>
                    </div>
                  </div>
                );
              })()}

              {summaryTab === 'mensal' && (() => {
                const monthly = getMonthlySummary(transactions, goalsList, fixedExpenses);
                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Receitas 30d</p>
                        <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(monthly.income)}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                        <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Despesas 30d</p>
                        <p className="text-sm font-black text-rose-600 dark:text-rose-400 truncate">{formatCurrency(monthly.expense)}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-center">
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Economia Líquida</p>
                        <p className={cn("text-sm font-black truncate", monthly.savings >= 0 ? "text-emerald-500" : "text-rose-500")}>
                          {formatCurrency(monthly.savings)}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Maior Categoria do Mês:</span>
                        <span className="font-bold text-zinc-900 dark:text-white">{monthly.topCat}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Maior Gasto Individual:</span>
                        <span className="font-bold text-rose-500">
                          {monthly.biggestExpense.description} ({formatCurrency(monthly.biggestExpense.amount)})
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500">Saúde Financeira Atual:</span>
                        <span className={cn("font-black text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700", monthly.health.color)}>
                          {monthly.health.score}/100 ({monthly.health.label})
                        </span>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-emerald-500" />
                        <h4 className="font-bold text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Recomendação da Anny para o Próximo Mês</h4>
                      </div>
                      <p className="text-xs leading-relaxed font-medium text-zinc-700 dark:text-zinc-300">
                        "{monthly.recommendation}"
                      </p>
                    </div>
                  </div>
                );
              })()}

              {summaryTab === 'saude' && (() => {
                const health = calculateFinancialHealth(transactions, goalsList, fixedExpenses);
                return (
                  <div className="space-y-6 text-center">
                    {/* Score Circle */}
                    <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="72" cy="72" r="60" stroke="currentColor" strokeWidth="12" className="text-zinc-100 dark:text-zinc-800" fill="transparent" />
                        <circle 
                          cx="72" 
                          cy="72" 
                          r="60" 
                          stroke="currentColor" 
                          strokeWidth="12" 
                          className={health.color}
                          strokeDasharray={377}
                          strokeDashoffset={377 - (377 * health.score) / 100}
                          strokeLinecap="round"
                          fill="transparent" 
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={cn("text-3xl font-black tracking-tight", health.color)}>{health.score}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">Pontos</span>
                      </div>
                    </div>

                    <div>
                      <span className={cn("font-black text-sm px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 uppercase tracking-wider inline-block", health.color)}>
                        Saúde Financeira {health.label}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2 max-w-sm mx-auto">
                        Sua pontuação é calculada dinamicamente com base na regularidade dos seus registros, taxa de economia e organização.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-left">
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Regularidade</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{health.regularity} / 25 pts</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Taxa de Economia</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{health.savings} / 35 pts</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Metas Ativas</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{health.goals} / 20 pts</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Organização Fixa</p>
                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{health.organization} / 20 pts</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sync Modal */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSyncModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-8 relative z-10 shadow-2xl overflow-hidden",
                isDark ? "bg-zinc-900" : "bg-white"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-zinc-900")}>Sincronizar Dados</h3>
                  <p className="text-xs text-zinc-500">Atualize seu saldo sem Open Finance</p>
                </div>
                <button 
                  onClick={() => setShowSyncModal(false)} 
                  className={cn(
                    "p-2 rounded-full transition-all active:scale-95",
                    isDark ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700" : "bg-white text-zinc-500 border border-zinc-100 shadow-sm hover:bg-zinc-50"
                  )}
                >
                  <X size={20} />
                </button>
              </div>

              {!syncMethod ? (
                <div className="grid grid-cols-1 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSyncMethod('csv')}
                    className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <FileUp size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Importar Extrato (CSV/OFX)</p>
                      <p className="text-[10px] text-zinc-500">Carregue o arquivo do seu banco</p>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSyncMethod('notif')}
                    className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Smartphone size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Ler Notificações</p>
                      <p className="text-[10px] text-zinc-500">Detectar compras em tempo real</p>
                    </div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSyncMethod('sms')}
                    className="p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <MessageSquare size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Mensagens SMS</p>
                      <p className="text-[10px] text-zinc-500">Importar gastos via SMS bancário</p>
                    </div>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-center space-y-4">
                    {isSyncing ? (
                      <div className="py-8 space-y-4">
                        <RefreshCw size={40} className="text-emerald-500 animate-spin mx-auto" />
                        <p className="text-sm font-medium animate-pulse">Analisando dados...</p>
                      </div>
                    ) : detectedTransactions.length > 0 ? (
                      <div className="space-y-4 text-left">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Transações Detectadas</h4>
                        <div className="space-y-2 max-h-[30vh] overflow-y-auto no-scrollbar">
                          {detectedTransactions.map((t, i) => (
                            <div key={i} className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                              <div>
                                <p className="text-xs font-bold">{t.description}</p>
                                <p className="text-[10px] text-zinc-500">{t.date}</p>
                              </div>
                              <p className="text-xs font-black text-rose-500">-{formatCurrency(t.amount)}</p>
                            </div>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            // Mock adding transactions
                            alert("Transações importadas com sucesso!");
                            setShowSyncModal(false);
                            setSyncMethod(null);
                            setDetectedTransactions([]);
                          }}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20"
                        >
                          Confirmar Importação
                        </button>
                      </div>
                    ) : (
                      <div className="py-8 space-y-4">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 size={32} />
                        </div>
                        <p className="text-sm font-medium">Pronto para iniciar a sincronização via {syncMethod.toUpperCase()}</p>
                        <button 
                          onClick={() => {
                            setIsSyncing(true);
                            setTimeout(() => {
                              setIsSyncing(false);
                              setDetectedTransactions([
                                { description: 'Supermercado Silva', amount: 156.40, date: 'Hoje' },
                                { description: 'Posto Shell', amount: 210.00, date: 'Ontem' },
                                { description: 'Netflix', amount: 55.90, date: '12/03' }
                              ]);
                            }, 2000);
                          }}
                          className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold"
                        >
                          Iniciar Escaneamento
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setSyncMethod(null); setDetectedTransactions([]); }}
                    className="w-full py-3 text-xs font-bold text-zinc-400 uppercase tracking-widest"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 text-xs font-bold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-zinc-700 dark:border-zinc-300 pointer-events-none"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Backup File Input */}
      <input
        type="file"
        ref={backupFileInputRef}
        accept=".json"
        onChange={handleImportBackup}
        className="hidden"
      />

      {/* Reminder Modal */}
      <AnimatePresence>
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReminderModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
                  <span>⏰</span> Novo Lembrete
                </h2>
                <button 
                  onClick={() => setIsReminderModalOpen(false)} 
                  className={cn("p-2 rounded-full shadow-2xs transition-all cursor-pointer", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveReminder} className="space-y-4">
                <div>
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Descrição do Lembrete
                  </label>
                  <input
                    type="text"
                    required
                    value={reminderDesc}
                    onChange={(e) => setReminderDesc(e.target.value)}
                    placeholder="Ex: Pagar Fatura do Cartão, Aluguel..."
                    className={cn(
                      "w-full border-none rounded-2xl p-3.5 font-bold text-xs focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Data de Vencimento
                    </label>
                    <input
                      type="date"
                      required
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className={cn(
                        "w-full border-none rounded-2xl p-3 font-bold text-xs focus:ring-2 focus:ring-emerald-500 transition-all",
                        isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Categoria
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Geral', 'Contas', 'Cartão', 'Investimentos', 'Pessoal'].map(cat => (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => setReminderCat(cat)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer",
                            reminderCat === cat
                              ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                              : isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white" : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900"
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10 text-xs cursor-pointer"
                  >
                    Salvar Lembrete
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal Add / Edit Modal */}
      <AnimatePresence>
        {isGoalModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
                  <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 text-2xl">{goalIcon}</span>
                  <span>{editingGoalId ? 'Editar Objetivo' : 'Novo Objetivo'}</span>
                </h2>
                <button 
                  onClick={() => setIsGoalModalOpen(false)} 
                  className={cn("p-2 rounded-full shadow-2xs transition-all cursor-pointer", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveGoal} className="space-y-4">
                <div>
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Nome do Objetivo
                  </label>
                  <input
                    type="text"
                    required
                    value={goalName}
                    onChange={(e) => setGoalName(e.target.value)}
                    placeholder="Ex: Viagem de Férias, Carro Novo..."
                    className={cn(
                      "w-full border-none rounded-2xl p-3.5 font-bold text-xs focus:ring-2 focus:ring-emerald-500 transition-all",
                      isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Valor Meta (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={goalTargetAmount}
                      onChange={(e) => setGoalTargetAmount(e.target.value)}
                      placeholder="5000,00"
                      className={cn(
                        "w-full border-none rounded-2xl p-3 font-bold text-xs focus:ring-2 focus:ring-emerald-500 transition-all",
                        isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                      )}
                    />
                  </div>
                  <div>
                    <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                      Já Guardado (R$)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={goalCurrentAmount}
                      onChange={(e) => setGoalCurrentAmount(e.target.value)}
                      placeholder="0,00"
                      className={cn(
                        "w-full border-none rounded-2xl p-3 font-bold text-xs focus:ring-2 focus:ring-emerald-500 transition-all",
                        isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Escolha o Ícone
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['🎯', '🏖️', '🚗', '🏠', '🎓', '💻', '🛡️', '💍', '🚀', '💰'].map(icon => (
                      <button
                        type="button"
                        key={icon}
                        onClick={() => setGoalIcon(icon)}
                        className={cn(
                          "p-2.5 rounded-2xl text-xl transition-all border flex items-center justify-center cursor-pointer",
                          goalIcon === icon
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-500 scale-105 shadow-xs"
                            : isDark ? "bg-zinc-800 border-zinc-700/60 hover:border-zinc-500" : "bg-zinc-100 border-zinc-200 hover:border-zinc-300"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Sonhos', 'Viagens', 'Bens', 'Educação', 'Segurança', 'Investimentos', 'Geral'].map(cat => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setGoalCategory(cat)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border cursor-pointer",
                          goalCategory === cat
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                            : isDark ? "bg-zinc-800 text-zinc-400 border-zinc-700/60 hover:text-white" : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-zinc-900"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white py-3.5 rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-md shadow-emerald-500/10 text-xs cursor-pointer"
                  >
                    {editingGoalId ? 'Salvar Alterações' : 'Criar Objetivo'}
                  </button>
                  {editingGoalId && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(editingGoalId)}
                      className="px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-2xl font-bold transition-all text-xs cursor-pointer"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Goal Deposit / Withdraw Action Modal */}
      <AnimatePresence>
        {selectedGoalForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGoalForAction(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className={cn(
                "w-[95%] sm:w-full max-w-sm rounded-[32px] p-6 sm:p-8 relative z-10 shadow-2xl flex flex-col", 
                isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-100"
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className={cn("text-xl font-bold flex items-center gap-2", isDark ? "text-white" : "text-zinc-900")}>
                  <span>{selectedGoalForAction.goal.icon || '🎯'}</span>
                  <span>{selectedGoalForAction.actionType === 'deposit' ? 'Guardar em' : 'Retirar de'} {selectedGoalForAction.goal.name}</span>
                </h2>
                <button 
                  onClick={() => setSelectedGoalForAction(null)} 
                  className={cn("p-2 rounded-full shadow-2xs transition-all cursor-pointer", isDark ? "bg-zinc-800 text-zinc-400 hover:text-white" : "bg-zinc-100 text-zinc-500 hover:text-zinc-900")}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmGoalAction} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Saldo Atual do Objetivo:</span>
                  <span className="font-bold text-emerald-500">{formatCurrency(selectedGoalForAction.goal.currentAmount)}</span>
                </div>

                <div>
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest block mb-1.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    {selectedGoalForAction.actionType === 'deposit' ? 'Valor a Guardar (R$)' : 'Valor a Retirar (R$)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      autoFocus
                      value={goalActionAmount}
                      onChange={(e) => setGoalActionAmount(e.target.value)}
                      placeholder="0,00"
                      className={cn(
                        "w-full border-none rounded-2xl p-4 pl-12 font-bold text-lg focus:ring-2 focus:ring-emerald-500 transition-all",
                        isDark ? "bg-zinc-800 text-white" : "bg-zinc-50 text-zinc-900"
                      )}
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className={cn(
                      "flex-1 text-white py-3.5 rounded-2xl font-bold transition-all shadow-md text-xs cursor-pointer",
                      selectedGoalForAction.actionType === 'deposit' 
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10" 
                        : "bg-amber-600 hover:bg-amber-500 shadow-amber-500/10"
                    )}
                  >
                    {selectedGoalForAction.actionType === 'deposit' ? 'Confirmar Depósito' : 'Confirmar Retirada'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedGoalForAction(null)}
                    className={cn(
                      "px-4 py-3.5 rounded-2xl font-bold transition-all text-xs cursor-pointer",
                      isDark ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    )}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
