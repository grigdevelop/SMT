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
      className="w-full border-b border-warning/30 bg-warning/10 text-base-content transition-all"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-xs font-medium">
        {/* Left: Status Indicator & Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex items-center gap-2 text-base-content hover:text-primary font-semibold cursor-pointer"
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-warning/20 text-warning shrink-0">
            <Sparkles className="w-3 h-3" />
          </span>
          <span>
            {isSimulated ? (
              <span className="flex items-center gap-1.5 font-bold text-warning flex-wrap">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse shrink-0" />
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
              className="btn btn-warning btn-xs font-semibold"
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
              className="text-warning hover:underline text-2xs cursor-pointer font-medium"
            >
              Change Date
            </button>
          )}
        </div>
      </div>

      {/* Expanded Controls Drawer */}
      {isOpen && (
        <div className="border-t border-warning/20 bg-warning/5 px-3 sm:px-4 py-2.5">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            {/* Direct Date Input */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="dev-time-picker"
                className="text-base-content/80 font-medium flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 shrink-0 text-warning" />
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
                className="input input-bordered input-sm bg-base-100 border-warning/40 text-base-content font-mono"
              />
            </div>

            {/* Quick Jumps */}
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-2xs uppercase tracking-wider text-base-content/60 mr-1 font-semibold">
                Quick Jump:
              </span>
              <button
                type="button"
                onClick={() => offsetDays(-1)}
                className="btn btn-ghost btn-xs bg-base-100 border border-base-300 hover:bg-base-200 text-base-content"
                title="Go back 1 day"
              >
                <ChevronLeft className="w-3 h-3" /> -1d
              </button>
              <button
                type="button"
                onClick={() => offsetDays(1)}
                className="btn btn-ghost btn-xs bg-base-100 border border-base-300 hover:bg-base-200 text-base-content"
                title="Advance 1 day"
              >
                +1d <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => offsetDays(7)}
                className="btn btn-ghost btn-xs bg-base-100 border border-base-300 hover:bg-base-200 text-base-content"
                title="Advance 1 week"
              >
                +1w <ChevronRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={resetToRealToday}
                disabled={!isSimulated}
                className="sm:ml-2 btn btn-warning btn-xs text-warning-content font-medium"
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
