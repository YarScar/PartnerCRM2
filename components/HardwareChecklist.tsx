'use client';

import { useState } from 'react';
import { HARDWARE_CHECKLIST, HardwareItem } from '@/lib/types';
import { Plus, X } from 'lucide-react';

interface Props {
  name: string;
  defaultValue?: HardwareItem[];
}

export function HardwareChecklist({ name, defaultValue = [] }: Props) {
  const [items, setItems] = useState<HardwareItem[]>(defaultValue);
  const [customType, setCustomType] = useState('');

  const toggleType = (type: string) => {
    const exists = items.find((i) => i.type === type);
    if (exists) {
      setItems(items.filter((i) => i.type !== type));
    } else {
      setItems([...items, { type, quantity: 1 }]);
    }
  };

  const updateItem = (idx: number, patch: Partial<HardwareItem>) => {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const addCustom = () => {
    if (!customType.trim()) return;
    setItems([...items, { type: customType.trim(), quantity: 1 }]);
    setCustomType('');
  };

  return (
    <div>
      {/* Hidden input that serializes the JSON for form submission */}
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      <div className="flex flex-wrap gap-2 mb-4">
        {HARDWARE_CHECKLIST.map((type) => {
          const checked = items.some((i) => i.type === type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${checked
                  ? 'bg-ink text-cream border-ink'
                  : 'bg-cream-soft text-ink/70 border-ink/15 hover:border-ink/40'}`}
            >
              {checked ? '✓ ' : '+ '}
              {type}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={customType}
          onChange={(e) => setCustomType(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustom())}
          placeholder="Add custom equipment..."
          className="input-base flex-1"
        />
        <button type="button" onClick={addCustom} className="btn-secondary">
          <Plus size={14} /> Add
        </button>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 bg-cream/40 border border-ink/10 rounded-lg p-3">
          <div className="grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wider text-ink/50 px-2 pb-1">
            <div className="col-span-4">Equipment</div>
            <div className="col-span-2">Qty</div>
            <div className="col-span-5">Notes</div>
            <div className="col-span-1"></div>
          </div>
          {items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-4 text-sm font-medium px-2 truncate">{it.type}</div>
              <input
                type="number"
                min={1}
                value={it.quantity}
                onChange={(e) => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                className="col-span-2 input-base py-1.5 text-sm"
              />
              <input
                type="text"
                value={it.notes || ''}
                onChange={(e) => updateItem(idx, { notes: e.target.value })}
                placeholder="Model, condition, etc."
                className="col-span-5 input-base py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="col-span-1 text-ink/40 hover:text-court justify-self-center"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
