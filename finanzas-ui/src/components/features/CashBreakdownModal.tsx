import { useState, useEffect } from 'react';
import { X, Banknote, Save, RotateCcw } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { Account } from '../../types';

interface CashBreakdownModalProps {
  account: Account;
  onClose: () => void;
  onSave: (payload: {
    currentBalance: number;
    b1000Count: number;
    b500Count: number;
    b200Count: number;
    b100Count: number;
    b50Count: number;
    b20Count: number;
  }) => void;
  isLoading?: boolean;
}

export const CashBreakdownModal = ({
  account,
  onClose,
  onSave,
  isLoading = false,
}: CashBreakdownModalProps) => {
  const [b1000, setB1000] = useState<number>(account.b1000Count || 0);
  const [b500, setB500] = useState<number>(account.b500Count || 0);
  const [b200, setB200] = useState<number>(account.b200Count || 0);
  const [b100, setB100] = useState<number>(account.b100Count || 0);
  const [b50, setB50] = useState<number>(account.b50Count || 0);
  const [b20, setB20] = useState<number>(account.b20Count || 0);

  useEffect(() => {
    setB1000(account.b1000Count || 0);
    setB500(account.b500Count || 0);
    setB200(account.b200Count || 0);
    setB100(account.b100Count || 0);
    setB50(account.b50Count || 0);
    setB20(account.b20Count || 0);
  }, [account]);

  const totalCalculated =
    b1000 * 1000 +
    b500 * 500 +
    b200 * 200 +
    b100 * 100 +
    b50 * 50 +
    b20 * 20;

  const handleResetZero = () => {
    setB1000(0);
    setB500(0);
    setB200(0);
    setB100(0);
    setB50(0);
    setB20(0);
  };

  const handleSave = () => {
    onSave({
      currentBalance: totalCalculated,
      b1000Count: b1000,
      b500Count: b500,
      b200Count: b200,
      b100Count: b100,
      b50Count: b50,
      b20Count: b20,
    });
  };

  const currentBalance = parseFloat(String(account.currentBalance || 0));

  return (
    <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-lg border border-emerald-500/30 bg-[#0f172a]/95 shadow-2xl backdrop-blur-3xl">
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-400" />
            <span>Conteo de Billetes ({account.name})</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-slate-300 font-medium">
            Ingresa cuántos billetes tienes de cada denominación.
          </p>
          <button
            type="button"
            onClick={handleResetZero}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1 flex-shrink-0"
            title="Reiniciar todos los billetes a 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset a 0</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mb-5">
          <DenominationInput label="Billetes $1,000" val={1000} count={b1000} onChange={setB1000} color="border-emerald-500/30 text-emerald-300" />
          <DenominationInput label="Billetes $500" val={500} count={b500} onChange={setB500} color="border-cyan-500/30 text-cyan-300" />
          <DenominationInput label="Billetes $200" val={200} count={b200} onChange={setB200} color="border-emerald-500/30 text-emerald-300" />
          <DenominationInput label="Billetes $100" val={100} count={b100} onChange={setB100} color="border-amber-500/30 text-amber-300" />
          <DenominationInput label="Billetes $50" val={50} count={b50} onChange={setB50} color="border-cyan-500/30 text-cyan-300" />
          <DenominationInput label="Billetes $20" val={20} count={b20} onChange={setB20} color="border-blue-500/30 text-blue-300" />
        </div>

        {/* Resumen Total Calculado */}
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total en Billetes</p>
            <p className="text-3xl font-black text-white mt-0.5 tracking-tight">{formatCurrency(totalCalculated)}</p>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 font-semibold block">Saldo Previo:</span>
            <span className="font-mono font-bold text-slate-200">{formatCurrency(currentBalance)}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-800">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} isLoading={isLoading} className="flex-1 btn-emerald gap-2">
            <Save className="w-4 h-4" />
            <span>Actualizar</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface DenominationInputProps {
  label: string;
  val: number;
  count: number;
  onChange: (val: number) => void;
  color: string;
}

const DenominationInput = ({ label, val, count, onChange, color }: DenominationInputProps) => {
  const subtotal = count * val;

  return (
    <div className={`p-3 bg-slate-900 border rounded-xl space-y-1.5 ${color}`}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-black text-white">{label}</span>
        <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, count - 1))}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-black text-white border border-slate-700 transition"
        >
          -
        </button>
        <input
          type="number"
          min="0"
          value={count || ''}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="glass-input w-full py-1 text-center font-bold text-white text-sm bg-[#0b0f19]"
          placeholder="0"
        />
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 font-black text-white border border-slate-700 transition"
        >
          +
        </button>
      </div>
    </div>
  );
};
