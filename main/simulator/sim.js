// Fill model and helpers, kept free of MQTT so they can be tested without a broker.

// Base rate in percentage points per hour; peaks are [de, ate) in Azores local hours.
export const ZONAS_PADRAO = {
  turistica: { taxa_pct_h: 3, picos: [{ de: 10, ate: 19, fator: 2.5 }] },
  residencial: {
    taxa_pct_h: 2,
    picos: [
      { de: 7, ate: 9, fator: 1.5 },
      { de: 19, ate: 22, fator: 1.5 },
    ],
  },
};

const formatoHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Atlantic/Azores',
  hour: 'numeric',
  hourCycle: 'h23',
});

export const horaAcores = (data) => Number(formatoHora.format(data));

export function taxaAtual(zona, hora, taxaSensor) {
  const pico = zona.picos.find((p) => hora >= p.de && hora < p.ate);
  return (taxaSensor ?? zona.taxa_pct_h) * (pico?.fator ?? 1);
}

// Stops at 100 %: only a pickup (recolha.registada) empties the container.
export const proximoNivel = (nivel, taxaPctH, dtMs, speed) =>
  Math.min(100, nivel + taxaPctH * (dtMs / 3_600_000) * speed);
