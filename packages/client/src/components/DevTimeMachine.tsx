import { useState } from 'react';
import { useCurrentDate } from '../lib/date-context';
import {
  Calendar,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function DevTimeMachine() {
  const { realToday, currentDate, isSimulated, setSimulatedDate, offsetDays, resetToRealToday } =
    useCurrentDate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      aria-label="Development Time Travel Tools"
      className="w-full border-b border-amber-200 bg-amber-50/80 text-amber-900 transition-all"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs font-medium">
        {/* Left: Status Indicator & Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 text-amber-900 hover:text-amber-950 font-semibold cursor-pointer"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-200 text-amber-800 shrink-0">
            <Sparkles className="w-3 h-3" />
          </span>
          <span>
            {isSimulated ? (
              <span className="flex items-center gap-1.5 font-bold text-amber-800 flex-wrap">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                <span>
                  Dev Time Travel: <span className="underline">{currentDate}</span> (Simulated)
                </span>
              </span>
            ) : (
              <span>Dev Time Machine (Real: {realToday})</span>
            )}
          </span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          )}
        </button>

        {/* Right: Quick Reset if Simulated */}
        <div className="flex items-center gap-2 shrink-0">
          {isSimulated && (
            <button
              type="button"
              onClick={resetToRealToday}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-semibold transition cursor-pointer"
              title="Reset to actual today"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset to Today</span>
            </button>
          )}

          {!isOpen && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="text-amber-700 hover:text-amber-900 underline text-2xs cursor-pointer"
            >
              Change Date
            </button>
          )}
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isOpen && (
        <div className="border-t border-amber-200/60 bg-amber-100/60 px-3 sm:px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {/* Direct Date Input */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="dev-time-picker"
                className="text-amber-800 font-medium flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Simulate Date:</span>
              </label>
              <input
                id="dev-time-picker"
                type="date"
                value={currentDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSimulatedDate(e.target.value);
                  }
                }}
                className="px-2.5 py-1 bg-white border border-amber-300 rounded text-slate-800 text-base sm:text-xs font-mono shadow-2xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Quick Jumps */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-2xs uppercase tracking-wider text-amber-700 mr-1 font-semibold">
                Quick Jump:
              </span>
              <button
                type="button"
                onClick={() => offsetDays(-1)}
                className="px-2 py-1 bg-white border border-amber-300 rounded hover:bg-amber-50 text-amber-900 transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Go back 1 day"
              >
                <ChevronLeft className="w-3 h-3" /> -1d
              </button>
              <button
                type="button"
                onClick={() => offsetDays(1)}
                className="px-2 py-1 bg-white border border-amber-300 rounded hover:bg-amber-50 text-amber-900 transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Advance 1 day"
              >
                +1d <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => offsetDays(7)}
                className="px-2 py-1 bg-white border border-amber-300 rounded hover:bg-amber-50 text-amber-900 transition flex items-center gap-0.5 cursor-pointer shadow-2xs"
                title="Advance 1 week"
              >
                +1w <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={resetToRealToday}
                disabled={!isSimulated}
                className="sm:ml-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-medium rounded transition flex items-center gap-1 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3 h-3" /> Real Today
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
