export function buildSignalExperiment(frequency: number, sampleRate: number, noise: number) {
  const samples = sampleSignal(frequency, sampleRate, noise);
  return {
    version: 1,
    label: "educational-synthetic-signal",
    configuration: { frequencyHz: frequency, sampleRateHz: sampleRate, noiseAmplitude: noise, durationSeconds: 1, phaseRadians: 0 },
    model: {
      signal: "sin(2 * pi * frequencyHz * time)",
      noise: "noiseAmplitude * sin(i * 127.1 + 3.7) * cos(i * 31.3)",
      sampling: "i = 0..floor(sampleRateHz), inclusive; time = i / sampleRateHz",
      units: "time: seconds; amplitude: arbitrary units; IEEE 754 double precision",
    },
    result: {
      samplingRisk: sampleRate < 2 * frequency ? "aliasing" : sampleRate === 2 * frequency ? "nyquist-boundary" : "above-nyquist",
      foldedFrequencyHz: Math.abs(frequency - sampleRate * Math.round(frequency / sampleRate)),
      sampleCount: samples.length,
    },
    samples,
    limitation: "Synthetic educational experiment, not biological data or a finding about real instruments. Folded frequency describes the noiseless sine component; phase may change. Blue lines join samples, not a reconstruction algorithm.",
    nextExperiment: "Hold frequency fixed and vary the sampling rate. Preserve both configurations and identify where the interpretation changes.",
  };
}

export function sampleSignal(
  frequency: number,
  sampleRate: number,
  noise: number,
) {
  if (!Number.isFinite(sampleRate) || sampleRate < 4 || sampleRate > 240)
    throw Error("Sample rate must be between 4 and 240 Hz");
  if (
    !Number.isFinite(frequency) ||
    frequency < 1 ||
    frequency > 20 ||
    !Number.isFinite(noise) ||
    noise < 0 ||
    noise > 1
  )
    throw Error("Invalid signal parameters");
  return Array.from({ length: Math.floor(sampleRate) + 1 }, (_, i) => {
    const t = i / sampleRate;
    return {
      time: t,
      value:
        Math.sin(2 * Math.PI * frequency * t) +
        noise * Math.sin(i * 127.1 + 3.7) * Math.cos(i * 31.3),
    };
  });
}
