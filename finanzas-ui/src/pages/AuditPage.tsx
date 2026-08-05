import { FileText, Download } from 'lucide-react';

export default function AuditPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Registro de Auditoría</h1>
                    <p className="text-gray-500">Consulta el historial completo de cambios en el sistema</p>
                </div>
                <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                    <Download size={20} />
                    <span>Exportar Log</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="bg-gray-100 p-4 rounded-full mb-4 text-gray-400">
                    <FileText size={48} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Módulo en Construcción</h3>
                <p className="text-gray-500 max-w-sm">
                    Próximamente verás un feed de todos los eventos del sistema: transferencias, reasignaciones y errores a lo largo del tiempo.
                </p>
            </div>
        </div>
    );
}
