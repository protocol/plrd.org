"use client";
import { useMemo, useState } from "react";
import { buildSignalExperiment } from "@/lib/lab-signal";
import RecordEditor from "@/components/lab/RecordEditor";
import { downloadText } from "@/lib/lab-packets";
export default function SignalSandbox() {
  const [frequency, setFrequency] = useState(5);
  const [rate, setRate] = useState(40);
  const [noise, setNoise] = useState(0);
  const [samples, setSamples] = useState(true);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState(false);
  const experiment = useMemo(
    () => buildSignalExperiment(frequency, rate, noise),
    [frequency, rate, noise],
  );
  const points = experiment.samples;
  const curve = Array.from(
    { length: 501 },
    (_, i) =>
      `${i ? "L" : "M"}${(30 + i * 1.28).toFixed(3)},${(150 - Math.sin((2 * Math.PI * frequency * i) / 500) * 82).toFixed(3)}`,
  ).join(" ");
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${(30 + p.time * 640).toFixed(3)},${(150 - p.value * 82).toFixed(3)}`)
    .join(" ");
  const under = rate <= 2 * frequency;
  function reset() {
    setFrequency(5);
    setRate(40);
    setNoise(0);
    setSamples(true);
    setMessage("Reset to 5 Hz, 40 samples/second, and no noise.");
  }
  return (
    <section id="signal-sandbox" className="lab-sandbox">
      <div className="lab-sandbox-title">
        <div>
          <p className="lab-eyebrow">NATIVE MINIAPP / SYNTHETIC DATA</p>
          <h2>Between the samples.</h2>
          <p>When does a measurement stop telling the truth?</p>
        </div>
        <span className="lab-sandbox-badge">
          RUNS IN YOUR BROWSER
          <br />
          NO DATA LEAVES THIS PAGE
        </span>
      </div>
      <div className="lab-sandbox-actions">
        <p className="lab-smallprint">Try this: make a fast wave look slow. Then raise the sampling rate and see what returns.</p>
        <button onClick={() => { setFrequency(12); setRate(16); setNoise(0); setSamples(true); setMessage(""); }}>Try the aliasing challenge →</button>
      </div>
      <div className="lab-sandbox-plot">
        <svg
          viewBox="0 0 700 300"
          role="img"
          aria-label={`A ${frequency} Hz sine wave measured at ${rate} samples per second, with ${noise} noise amplitude.`}
        >
          {[68, 150, 232].map((y) => (
            <line
              key={y}
              x1="30"
              x2="670"
              y1={y}
              y2={y}
              stroke="#4d565c"
              strokeDasharray="2 5"
            />
          ))}
          <path d={curve} fill="none" stroke="#677a85" strokeWidth="1.5" />
          {samples && (
            <>
              <path d={path} fill="none" stroke="#8fc7ff" strokeWidth="2" />
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={(30 + p.time * 640).toFixed(3)}
                  cy={(150 - p.value * 82).toFixed(3)}
                  r={rate > 70 ? 2 : 3}
                  fill="#d9eafa"
                />
              ))}
            </>
          )}
          <text x="30" y="282">
            0 seconds
          </text>
          <text x="670" y="282" textAnchor="end">
            1 second
          </text>
          <text x="31" y="28">
            AMPLITUDE (ARBITRARY UNITS)
          </text>
        </svg>
      </div>
      <div className="lab-sandbox-bottom">
        <div className="lab-sandbox-controls">
          {[
            {
              label: "Signal frequency",
              value: frequency,
              min: 1,
              max: 20,
              step: 1,
              unit: "Hz",
              set: setFrequency,
            },
            {
              label: "Sampling rate",
              value: rate,
              min: 8,
              max: 120,
              step: 1,
              unit: "Hz",
              set: setRate,
            },
            {
              label: "Noise amplitude",
              value: noise,
              min: 0,
              max: 1,
              step: 0.05,
              unit: "",
              set: setNoise,
            },
          ].map((c) => (
            <label key={c.label}>
              {c.label}
              <output>
                {c.value} {c.unit}
              </output>
              <input
                aria-label={c.label}
                type="range"
                min={c.min}
                max={c.max}
                step={c.step}
                value={c.value}
                onChange={(e) => {
                  c.set(Number(e.target.value));
                  setMessage("");
                }}
              />
            </label>
          ))}
        </div>
        <div className="lab-sandbox-explanation" aria-live="polite">
          <span>{under ? "THE MISSING INFORMATION" : "THE NYQUIST IDEA"}</span>
          <p>
            {under
              ? "At or below twice the signal frequency, these samples cannot uniquely recover the signal. Different waves can produce the same measurements."
              : "Sampling faster than twice the highest signal frequency avoids aliasing for an ideal band-limited signal. Noise and real instruments add other limits."}
          </p>
          <p>The noiseless component folds to {experiment.result.foldedFrequencyHz} Hz at this sampling rate. {rate === 2 * frequency ? "At this boundary, phase can hide the entire sine wave." : "The samples alone do not reveal which frequency was originally present."}</p>
          <small>
            Gray: underlying sine wave. Blue: straight lines between samples,
            not a reconstruction algorithm. Noise is deterministic and
            synthetic.
          </small>
        </div>
      </div>
      <div className="lab-sandbox-actions">
        <label className="lab-checkbox">
          <input
            type="checkbox"
            checked={samples}
            onChange={(e) => setSamples(e.target.checked)}
          />
          Show sampled measurements
        </label>
        <button onClick={reset}>Reset</button>
        <button
          onClick={() => {
            downloadText(
              "open-lab-signal.json",
              JSON.stringify(
                experiment,
                null,
                2,
              ),
            );
            setMessage("Synthetic sample data prepared for download.");
          }}
        >
          Download experiment ↓
        </button>
      </div>
      <p className="lab-smallprint">Keep the configuration and samples, not just a screenshot. This is synthetic data—not a neuroscience finding. A useful next contribution compares two sampling rates and names what changed.</p>
      <div className="lab-sandbox-actions"><button onClick={() => setDraft(true)}>Draft an observation →</button></div>
      {draft && <RecordEditor kind="note" initial={{ postType: "finding", field: "cross-field", text: `Synthetic signal experiment (not biological data): ${frequency} Hz sampled at ${rate} Hz, noise amplitude ${noise}. Noiseless folded frequency: ${experiment.result.foldedFrequencyHz} Hz.\n\nWhat changed when I varied the sampling rate:\n\nLimitations: educational model; blue lines connect samples rather than reconstructing the signal.` }} onClose={() => setDraft(false)} />}
      {message && (
        <p role="status" className="lab-smallprint">
          {message}
        </p>
      )}
    </section>
  );
}
