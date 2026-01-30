import {
    addMonths,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    isToday,
    setHours,
    setMinutes,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ModernDatePickerProps {
    selected?: Date | null;
    onChange: (date: Date | null) => void;
    placeholder?: string;
    showTimeSelect?: boolean;
    selectsStart?: boolean;
    selectsEnd?: boolean;
    startDate?: Date | null;
    endDate?: Date | null;
    minDate?: Date | null;
    maxDate?: Date | null;
    className?: string;
    popperClassName?: string;
}

const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
    selected,
    onChange,
    placeholder = 'Sélectionner une date',
    showTimeSelect = false,
    selectsStart = false,
    selectsEnd = false,
    startDate,
    endDate,
    minDate,
    maxDate,
    className = '',
    popperClassName = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(selected || new Date());
    const [selectedTime, setSelectedTime] = useState({
        hours: selected ? selected.getHours() : 9,
        minutes: selected ? selected.getMinutes() : 0,
    });
    const [view, setView] = useState<'calendar' | 'time'>('calendar');

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fermer le picker en cliquant à l'extérieur
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Générer les jours du calendrier
    const generateCalendarDays = () => {
        const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });

        return eachDayOfInterval({ start, end });
    };

    const handleDateSelect = (date: Date) => {
        let newDate = date;

        if (showTimeSelect) {
            newDate = setHours(setMinutes(date, selectedTime.minutes), selectedTime.hours);
        }

        onChange(newDate);

        if (!showTimeSelect) {
            setIsOpen(false);
        } else {
            setView('time');
        }
    };

    const handleTimeConfirm = () => {
        if (selected) {
            const newDate = setHours(setMinutes(selected, selectedTime.minutes), selectedTime.hours);
            onChange(newDate);
        }
        setIsOpen(false);
    };

    const isDateInRange = (date: Date) => {
        if (!selectsStart && !selectsEnd) return false;
        if (!startDate || !endDate) return false;
        return date >= startDate && date <= endDate;
    };

    const isDateDisabled = (date: Date) => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        if (selectsEnd && startDate && date < startDate) return true;
        return false;
    };

    const formatDisplayValue = () => {
        if (!selected) return '';

        if (showTimeSelect) {
            return format(selected, 'dd/MM/yyyy HH:mm', { locale: fr });
        }

        return format(selected, 'dd/MM/yyyy', { locale: fr });
    };

    const calendarDays = generateCalendarDays();
    const weekDays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input Field */}
            <div className="group relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <input
                    ref={inputRef}
                    type="text"
                    value={formatDisplayValue()}
                    placeholder={placeholder}
                    readOnly
                    className="text-xm w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2 pr-10 pl-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 group-hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:group-hover:border-blue-600 dark:focus:border-blue-400"
                />

                <div className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
                    {selected ? (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(null);
                            }}
                            className="pointer-events-auto rounded-full p-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                            <X className="h-3 w-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        </button>
                    ) : (
                        <CalendarDays className="h-4 w-4 text-slate-400 transition-colors group-hover:text-blue-500" />
                    )}
                </div>
            </div>

            {/* Dropdown Calendar */}
            {isOpen && (
                <div
                    className={`animate-in fade-in-0 zoom-in-95 absolute top-full left-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl backdrop-blur-sm duration-200 dark:border-slate-700 dark:bg-slate-900 ${popperClassName}`}
                >
                    {view === 'calendar' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 dark:border-slate-600 dark:from-slate-800 dark:to-slate-700">
                                <button
                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                    className="rounded-md p-1.5 transition-colors hover:bg-white/50 dark:hover:bg-slate-700"
                                >
                                    <ChevronLeft className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                </button>

                                <h3 className="text-sm font-semibold text-slate-800 capitalize dark:text-slate-200">
                                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                                </h3>

                                <button
                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                    className="rounded-md p-1.5 transition-colors hover:bg-white/50 dark:hover:bg-slate-700"
                                >
                                    <ChevronRight className="h-3 w-3 text-slate-600 dark:text-slate-300" />
                                </button>
                            </div>

                            {/* Week Days */}
                            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800">
                                {weekDays.map((day) => (
                                    <div key={day} className="py-1.5 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-0.5 p-1.5">
                                {calendarDays.map((date, index) => {
                                    const isCurrentMonth = isSameMonth(date, currentMonth);
                                    const isSelected = selected && isSameDay(date, selected);
                                    const isInRange = isDateInRange(date);
                                    const isDisabled = isDateDisabled(date);
                                    const isTodayDate = isToday(date);

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !isDisabled && handleDateSelect(date)}
                                            disabled={isDisabled}
                                            className={`relative h-8 w-8 transform rounded-md text-xs font-medium transition-all duration-200 hover:scale-105 ${
                                                !isCurrentMonth
                                                    ? 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800'
                                                    : isSelected
                                                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25'
                                                      : isInRange
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : isTodayDate
                                                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                                                          : 'text-slate-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-blue-900/20'
                                            } ${isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'} `}
                                        >
                                            {format(date, 'd')}
                                            {isTodayDate && !isSelected && (
                                                <div className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-white"></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Time Button */}
                            {showTimeSelect && (
                                <div className="border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800">
                                    <button
                                        onClick={() => setView('time')}
                                        className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-purple-500 to-pink-600 px-3 py-1.5 text-xs text-white shadow-md shadow-purple-500/25 transition-all duration-200 hover:from-purple-600 hover:to-pink-700"
                                    >
                                        <Clock className="h-3 w-3" />
                                        Choisir l'heure
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {view === 'time' && (
                        <div className="p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <button
                                    onClick={() => setView('calendar')}
                                    className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100"
                                >
                                    <ChevronLeft className="h-3 w-3" />
                                    Retour au calendrier
                                </button>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Choisir l'heure</h3>
                            </div>

                            <div className="mb-4 flex items-center justify-center gap-3">
                                {/* Hours */}
                                <div className="text-center">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Heures</label>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={() => setSelectedTime((prev) => ({ ...prev, hours: Math.min(23, prev.hours + 1) }))}
                                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
                                        </button>
                                        <div className="flex h-10 w-12 items-center justify-center rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 text-lg font-bold text-slate-800 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200">
                                            {selectedTime.hours.toString().padStart(2, '0')}
                                        </div>
                                        <button
                                            onClick={() => setSelectedTime((prev) => ({ ...prev, hours: Math.max(0, prev.hours - 1) }))}
                                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </button>
                                    </div>
                                </div>

                                <span className="mt-6 text-lg font-bold text-slate-400 dark:text-slate-500">:</span>

                                {/* Minutes */}
                                <div className="text-center">
                                    <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Minutes</label>
                                    <div className="flex flex-col items-center gap-1.5">
                                        <button
                                            onClick={() => setSelectedTime((prev) => ({ ...prev, minutes: Math.min(59, prev.minutes + 15) }))}
                                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ChevronRight className="h-3 w-3 rotate-[-90deg]" />
                                        </button>
                                        <div className="flex h-10 w-12 items-center justify-center rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 text-lg font-bold text-slate-800 dark:from-slate-800 dark:to-slate-700 dark:text-slate-200">
                                            {selectedTime.minutes.toString().padStart(2, '0')}
                                        </div>
                                        <button
                                            onClick={() => setSelectedTime((prev) => ({ ...prev, minutes: Math.max(0, prev.minutes - 15) }))}
                                            className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <ChevronRight className="h-3 w-3 rotate-90" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleTimeConfirm}
                                className="w-full rounded-md bg-gradient-to-r from-green-500 to-emerald-600 py-2 text-xs font-medium text-white shadow-md shadow-green-500/25 transition-all duration-200 hover:from-green-600 hover:to-emerald-700"
                            >
                                Confirmer l'heure
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ModernDatePicker;
