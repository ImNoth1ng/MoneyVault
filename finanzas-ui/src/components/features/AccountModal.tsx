import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, DollarSign, Settings2, Wallet } from 'lucide-react';
import { Card } from '../common/Card';
import { Input, Select } from '../common/FormInputs';
import { Button } from '../common/Button';
import { Account, AccountType } from '../../types';
import { getAccountTypeLabel } from '../../utils/formatters';

const accountSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: z.enum(Object.values(AccountType) as [AccountType, ...AccountType[]]),
  currentBalance: z.coerce.number().min(0, 'El saldo no puede ser negativo'),
  creditLimit: z.coerce.number().optional(),
  currency: z.string().min(3, 'La moneda es requerida').default('MXN'),
  active: z.boolean().default(true),
});

export type AccountFormData = {
  name: string;
  type: AccountType;
  currentBalance: number;
  creditLimit?: number;
  currency: string;
  active: boolean;
};

interface AccountModalProps {
  mode: 'create' | 'edit_balance' | 'edit_full';
  account?: Account | null;
  onClose: () => void;
  onSave: (data: Partial<Account>) => void;
  isLoading?: boolean;
}

export const AccountModal = ({
  mode,
  account,
  onClose,
  onSave,
  isLoading = false,
}: AccountModalProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema) as any,
    defaultValues: {
      name: '',
      type: AccountType.DEBIT,
      currentBalance: 0,
      creditLimit: undefined,
      currency: 'MXN',
      active: true,
    },
  });

  useEffect(() => {
    if (account && (mode === 'edit_balance' || mode === 'edit_full')) {
      reset({
        name: account.name || '',
        type: account.type || AccountType.DEBIT,
        currentBalance: account.currentBalance ? parseFloat(String(account.currentBalance)) : 0,
        creditLimit: account.creditLimit ? parseFloat(String(account.creditLimit)) : undefined,
        currency: account.currency || 'MXN',
        active: account.active !== false,
      });
    }
  }, [account, mode, reset]);

  const handleFormSubmit = (data: AccountFormData) => {
    onSave(data as any);
  };

  const isBalanceMode = mode === 'edit_balance';
  const isFullMode = mode === 'edit_full';
  const isCreateMode = mode === 'create';

  return (
    <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Card className="w-full max-w-md border border-emerald-500/30 bg-[#0f172a]/95 shadow-2xl backdrop-blur-3xl">
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
          <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            {isBalanceMode ? (
              <>
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>Actualizar Saldo de Cuenta</span>
              </>
            ) : isFullMode ? (
              <>
                <Settings2 className="w-5 h-5 text-cyan-400" />
                <span>Configuración de Cuenta</span>
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 text-emerald-400" />
                <span>Nueva Cuenta Bancaria</span>
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info header when editing balance */}
        {isBalanceMode && account && (
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl mb-4 text-xs space-y-1">
            <p className="font-extrabold text-white">Cuenta: <span className="text-emerald-400">{account.name}</span></p>
            <p className="text-slate-400">Tipo: <span className="font-bold text-slate-200">{account.type} ({account.currency || 'MXN'})</span></p>
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {(isCreateMode || isFullMode) && (
            <>
              <Input
                label="Nombre de la Cuenta"
                placeholder="Ej: Cuenta Principal"
                error={errors.name?.message}
                {...register('name')}
              />

              <Select
                label="Tipo de Cuenta"
                options={Object.values(AccountType).map((type) => ({
                  value: type,
                  label: getAccountTypeLabel(type),
                }))}
                error={errors.type?.message}
                {...register('type')}
              />
            </>
          )}

          <Input
            label={isBalanceMode ? "Nuevo Saldo Actual *" : "Saldo Inicial / Actual *"}
            type="number"
            placeholder="0.00"
            step="0.01"
            error={errors.currentBalance?.message}
            {...register('currentBalance')}
          />

          {(isCreateMode || isFullMode || (account && (account.type === 'CREDIT' || String(account.type) === 'CREDIT_CARD'))) && (
            <Input
              label="Límite de Crédito (Opcional)"
              type="number"
              placeholder="0.00"
              step="0.01"
              error={errors.creditLimit?.message}
              {...register('creditLimit')}
            />
          )}

          {(isCreateMode || isFullMode) && (
            <>
              <Select
                label="Moneda"
                options={[
                  { value: 'MXN', label: 'MXN ($)' },
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'COP', label: 'COP ($)' },
                ]}
                {...register('currency')}
              />

              <div className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  id="active"
                  className="rounded accent-emerald-500 cursor-pointer w-4 h-4"
                  defaultChecked={true}
                  {...register('active')}
                />
                <label htmlFor="active" className="text-xs font-bold text-slate-200 cursor-pointer">
                  Cuenta Activa
                </label>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className="flex-1 btn-emerald"
            >
              {isBalanceMode ? 'Actualizar Saldo' : isCreateMode ? 'Crear Cuenta' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
