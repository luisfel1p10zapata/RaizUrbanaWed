import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, X } from 'lucide-react';

const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function SearchableSelect({
  id,
  name,
  options = [],
  value = '',
  onChange,
  onBlur,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
  hasError = false,
  errorId,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Normalizar opciones a { value, label, disabled }
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: opt.value ?? opt.id ?? opt.id_usuario ?? opt.id_producto_vari ?? opt.id_accion,
          label: opt.label ?? opt.nombre ?? opt.nombre_completo ?? String(opt.value),
          disabled: Boolean(opt.disabled),
        };
      }
      return { value: opt, label: String(opt), disabled: false };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtrado insensible a mayúsculas y acentos
  const filteredOptions = useMemo(() => {
    const q = normalizar(searchTerm);
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => normalizar(opt.label).includes(q));
  }, [normalizedOptions, searchTerm]);

  // Sincronizar texto cuando cambia la opción seleccionada
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedOption ? selectedOption.label : '');
    }
  }, [selectedOption, isOpen]);

  // Click outside para cerrar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) {
          setIsOpen(false);
          // Restaurar label original si el usuario escribió algo que no seleccionó
          setSearchTerm(selectedOption ? selectedOption.label : '');
          if (onBlur) onBlur({ target: { id, name, value } });
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, selectedOption, onBlur, id, name, value]);

  const selectOption = useCallback(
    (opt) => {
      if (opt.disabled) return;
      onChange && onChange(opt.value);
      setSearchTerm(opt.label);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.focus();
    },
    [onChange]
  );

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => {
          const next = prev + 1;
          return next >= filteredOptions.length ? 0 : next;
        });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? filteredOptions.length - 1 : next;
        });
      }
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        e.preventDefault();
        selectOption(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm(selectedOption ? selectedOption.label : '');
    } else if (e.key === 'Tab') {
      if (isOpen) {
        setIsOpen(false);
        setSearchTerm(selectedOption ? selectedOption.label : '');
        if (onBlur) onBlur({ target: { id, name, value } });
      }
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleInputFocus = () => {
    if (!disabled && !isOpen) {
      setIsOpen(true);
      setSearchTerm('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width: '100%' }}
      className={`ru-searchable-select-container ${disabled ? 'is-disabled' : ''}`}
    >
      <div
        className="ru-form-input-wrap"
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
            if (!isOpen) setIsOpen(true);
          }
        }}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-invalid={hasError}
          aria-describedby={errorId}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={`ru-form-input ${hasError ? 'is-invalid' : ''} ${className}`}
          style={{
            paddingRight: value ? '52px' : '32px',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
        />

        <div
          style={{
            position: 'absolute',
            right: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Limpiar selección"
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}

          <ChevronDown
            size={16}
            style={{
              color: '#64748b',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Desplegable de opciones */}
      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            zIndex: 1300,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
          }}
        >
          {filteredOptions.length === 0 ? (
            <li
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                color: '#64748b',
                fontStyle: 'italic',
                textAlign: 'center',
              }}
            >
              Sin resultados
            </li>
          ) : (
            filteredOptions.map((opt, idx) => {
              const isSelected = String(opt.value) === String(value);
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Evitar blur antes del click
                    selectOption(opt);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    cursor: opt.disabled ? 'not-allowed' : 'pointer',
                    opacity: opt.disabled ? 0.45 : 1,
                    background: isHighlighted
                      ? 'var(--hover-bg, #eff6ff)'
                      : isSelected
                      ? 'var(--selected-bg, #f1f5f9)'
                      : 'transparent',
                    color: opt.disabled
                      ? '#94a3b8'
                      : isSelected
                      ? '#2563eb'
                      : 'var(--text-primary, #0f172a)',
                    fontWeight: isSelected ? 600 : 400,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span style={{ fontSize: '11px', color: '#2563eb' }}>✓</span>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
