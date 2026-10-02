export function Sparkline({ tone = "green", downward = false }: { tone?: string; downward?: boolean }) {
  const points = downward ? "0,7 8,10 16,7 24,17 32,14 40,20 48,17 56,26 64,22 72,30 80,27" : "0,31 8,25 16,29 24,18 32,22 40,13 48,17 56,7 64,11 72,3 80,6";
  return <svg className={`sparkline spark-${tone}`} viewBox="0 0 82 38" aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function ActivityChart({ period }: { period: "today" | "week" }) {
  const curve = period === "today" ? "M 0 157 C 20 157 23 130 48 134 S 81 154 106 117 S 149 128 177 102 S 210 80 247 95 S 283 133 318 87 S 355 104 391 60 S 429 76 461 41 S 501 64 537 25 S 575 30 602 14" : "M0 164 C30 160 35 140 80 143 S125 106 164 118 S205 99 250 81 S297 107 342 61 S403 80 452 38 S537 57 602 14";
  const pending = "M0 173 C38 174 58 165 103 173 S179 161 224 173 S301 166 348 170 S430 156 472 165 S550 153 602 160";
  return <div className="activity-chart">
    <div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div>
    <div className="chart-plot">
      <svg viewBox="0 0 610 200" preserveAspectRatio="none" role="img" aria-label="Illustrative inventory verification trend, not measured business performance">
        <defs><linearGradient id="sync-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#169576" stopOpacity=".19" /><stop offset="100%" stopColor="#169576" stopOpacity=".015" /></linearGradient></defs>
        {[12, 65, 118, 171].map(height => <path key={height} d={`M0 ${height}H610`} stroke="#e9eeeb" strokeDasharray="4 5" />)}
        <path d={`${curve} L602 200 L0 200 Z`} fill="url(#sync-fill)" />
        <path d={pending} stroke="#c4a465" strokeWidth="2" strokeDasharray="5 5" fill="none" />
        <path d={curve} stroke="#148b6a" strokeWidth="3" fill="none" />
        <circle cx="602" cy="14" r="7" fill="#148b6a" fillOpacity=".12" /><circle cx="602" cy="14" r="4" fill="#148b6a" stroke="white" strokeWidth="2" />
      </svg>
      <div className="chart-x">{(period === "today" ? ["06:00", "09:00", "12:00", "15:00", "18:00", "Now"] : ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"]).map(label => <span key={label}>{label}</span>)}</div>
    </div>
  </div>;
}
