export const OPC_SIGNAL_VALUES = ["solo-feed"] as const;

export type OpcSignalValue = (typeof OPC_SIGNAL_VALUES)[number];

export const OPC_SIGNAL_LABELS: Record<OpcSignalValue, string> = {
  "solo-feed": "solo-feed"
};

export const DEFAULT_OPC_SIGNAL: OpcSignalValue = "solo-feed";

const OPC_SIGNAL_SET = new Set<string>(OPC_SIGNAL_VALUES);

export function isOpcSignal(value?: string | null): value is OpcSignalValue {
  if (!value) return false;
  return OPC_SIGNAL_SET.has(value);
}

export function getOpcSignalLabel(value?: string | null): string {
  if (value && OPC_SIGNAL_SET.has(value)) {
    return OPC_SIGNAL_LABELS[value as OpcSignalValue];
  }
  return OPC_SIGNAL_LABELS[DEFAULT_OPC_SIGNAL];
}
