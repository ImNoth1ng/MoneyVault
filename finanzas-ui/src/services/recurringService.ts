export interface RecurringServiceItem {
  id: string;
  debtorId: string | number;
  debtorName: string;
  serviceName: string; // ej: Telmex, Luz, Netflix
  dayOfMonth: number; // 1 - 31
  amount: number;
  currency: string;
  createdAt: string;
}

const STORAGE_KEY = 'moneyvault_recurring_services';

export const recurringService = {
  getAll: (): RecurringServiceItem[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [
        {
          id: '1',
          debtorId: '1',
          debtorName: 'Mamá',
          serviceName: 'Telmex Internet',
          dayOfMonth: 14,
          amount: 550,
          currency: 'MXN',
          createdAt: new Date().toISOString(),
        }
      ];
    } catch {
      return [];
    }
  },

  saveAll: (items: RecurringServiceItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  },

  add: (item: Omit<RecurringServiceItem, 'id' | 'createdAt'>): RecurringServiceItem => {
    const items = recurringService.getAll();
    const newItem: RecurringServiceItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...items];
    recurringService.saveAll(updated);
    return newItem;
  },

  update: (id: string, updatedFields: Omit<RecurringServiceItem, 'id' | 'createdAt'>): RecurringServiceItem => {
    const items = recurringService.getAll();
    const updated = items.map((i) => (i.id === id ? { ...i, ...updatedFields } : i));
    recurringService.saveAll(updated);
    return updated.find((i) => i.id === id)!;
  },

  remove: (id: string) => {
    const items = recurringService.getAll();
    const updated = items.filter((i) => i.id !== id);
    recurringService.saveAll(updated);
  },
};
