import { Banknote, Plus } from 'lucide-react';

export default function CashPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inventario de Efectivo</h1>
                    <p className="text-gray-500">Gestiona tus billetes reales y cajas chicas</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
                    <Plus size={20} />
                    <span>Añadir Registro</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                    <Banknote size={48} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo en Construcción</h3>
                <p className="text-gray-500 max-w-sm">
                    Próximamente podrás rastrear todo el efectivo físico que tienes en cajas y billeteras con desglose por denominación.
                </p>
            </div>
        </div>
    );
}
