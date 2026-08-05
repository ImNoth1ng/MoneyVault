import { TrendingUp, Plus } from 'lucide-react';

export default function InvestmentsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inversiones</h1>
                    <p className="text-gray-500">Maneja tu portafolio de inversiones, criptomonedas y cetes</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus size={20} />
                    <span>Nueva Inversión</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                    <TrendingUp size={48} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo en Construcción</h3>
                <p className="text-gray-500 max-w-sm">
                    Próximamente podrás seguir el valor de tus índices, acciones, criptos y depósitos a plazo de forma automática.
                </p>
            </div>
        </div>
    );
}
