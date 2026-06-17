'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface OptionItem {
  value: string;
  label: string;
}

type OptionsProp = readonly string[] | OptionItem[];

interface Props {
  name: string;
  label: string;
  options?: OptionsProp;
  defaultValue?: ChecklistItem[] | string;
  hint?: string;
}

export function DynamicChecklist({ name, label, options = [], defaultValue, hint }: Props) {
  const [customItem, setCustomItem] = useState('');
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    if (defaultValue) {
      if (typeof defaultValue === 'string') {
        try {
          const parsed = JSON.parse(defaultValue);
          if (Array.isArray(parsed)) {
            return parsed.map((item) => ({
              id: item.id || item.label || String(item),
              label: item.label || String(item),
              checked: Boolean(item.checked),
            }));
          }
          return [];
        } catch {
          return [];
        }
      }
      if (Array.isArray(defaultValue)) {
        return defaultValue.map((item: any) => ({
          id: item.id || item.label || String(item),
          label: item.label || String(item),
          checked: Boolean(item.checked),
        }));
      }
      return [];
    }
    return options.map((opt: any) => {
      const label = typeof opt === 'string' ? opt : opt.label ?? String(opt.value ?? opt);
      return {
        id: (typeof opt === 'string' ? opt : opt.value ?? opt.label ?? String(opt))
          .toString()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_'),
        label,
        checked: false,
      };
    });
  });

  const handleToggle = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const addCustomItem = () => {
    const label = customItem.trim();
    if (!label) return;

    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    if (items.some((item) => item.id === id)) {
      setCustomItem('');
      return;
    }

    setItems([...items, { id, label, checked: true }]);
    setCustomItem('');
  };

  return (
    <div>
      <label className="label-base">{label}</label>
      {hint && <p className="text-xs text-ink/50 mb-3">{hint}</p>}
      
      {items.length === 0 ? (
        <div className="text-sm text-ink/50 italic">No options available</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleToggle(item.id)}
                aria-pressed={item.checked}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
                  ${item.checked
                    ? 'bg-ink text-cream border-ink'
                    : 'bg-cream-soft text-ink/70 border-ink/15 hover:border-ink/40'}`}
              >
                {item.checked ? '✓ ' : '+ '}
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={customItem}
              onChange={(e) => setCustomItem(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomItem())}
              placeholder="Add custom item..."
              className="input-base flex-1"
            />
            <button type="button" onClick={addCustomItem} className="btn-secondary">
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Hidden input to store the data */}
          <input
            type="hidden"
            name={name}
            value={JSON.stringify(items)}
          />
        </>
      )}
    </div>
  );
}
