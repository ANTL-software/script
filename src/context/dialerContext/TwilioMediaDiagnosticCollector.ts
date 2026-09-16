import type { CallMediaDiagnostic, CallMediaEvent, CallMediaSample } from '../../utils/types';

export interface TwilioMediaSnapshot {
  bytesReceived: number;
  bytesSent: number;
  audioOutputLevel: number;
  packetsLost: number;
  jitter: number;
  rtt: number;
}

type SendDiagnostic = (appelId: number, diagnostic: CallMediaDiagnostic) => Promise<void>;

const bounded = (value: number, max: number): number =>
  Number.isFinite(value) ? Math.min(max, Math.max(0, value)) : 0;

const eventName = (name: string | number | null | undefined): string | null => {
  if (name === null || name === undefined) return null;
  const normalized = String(name).replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64);
  return normalized || null;
};

export class TwilioMediaDiagnosticCollector {
  private readonly acceptedAt: string;
  private readonly startedAtMs: number;
  private readonly edge: string | null;
  private readonly appelId: number;
  private readonly send: SendDiagnostic;
  private readonly samples: CallMediaSample[] = [];
  private readonly events: CallMediaEvent[] = [];
  private readonly timer: ReturnType<typeof setInterval>;
  private pending: CallMediaSample | null = null;
  private sequence = 0;
  private dirty = true;
  private flushing = false;
  private flushRequested = false;
  private finished = false;

  public constructor(
    appelId: number,
    edge: string | null,
    send: SendDiagnostic,
    startedAtMs = Date.now(),
  ) {
    this.appelId = appelId;
    this.send = send;
    this.startedAtMs = startedAtMs;
    this.acceptedAt = new Date(startedAtMs).toISOString();
    this.edge = edge && /^[a-z0-9-]{1,40}$/.test(edge) ? edge : null;
    this.timer = setInterval(() => { void this.flush(); }, 15000);
  }

  public recordSample(sample: TwilioMediaSnapshot | null | undefined, atMs = Date.now()): void {
    if (this.finished || !sample) return;
    const second = Math.floor(Math.max(0, atMs - this.startedAtMs) / 5000) * 5;
    if (second > 21600) return;

    if (this.pending && this.pending.second !== second) {
      this.samples.push(this.pending);
      if (this.samples.length > 719) this.samples.shift();
      this.pending = null;
    }
    if (!this.pending) {
      this.pending = {
        second,
        count: 0,
        receivedBytes: 0,
        sentBytes: 0,
        zeroReceivedSamples: 0,
        outputLevelMax: 0,
        lostPackets: 0,
        jitterMax: 0,
        rttMax: 0,
      };
    }
    if (this.pending.count >= 5) return;

    const receivedBytes = Math.round(bounded(sample.bytesReceived, 1000000000));
    this.pending.count += 1;
    this.pending.receivedBytes = Math.min(1000000000, this.pending.receivedBytes + receivedBytes);
    this.pending.sentBytes = Math.min(1000000000, this.pending.sentBytes + Math.round(bounded(sample.bytesSent, 1000000000)));
    this.pending.zeroReceivedSamples += receivedBytes === 0 ? 1 : 0;
    this.pending.outputLevelMax = Math.max(this.pending.outputLevelMax, Math.round(bounded(sample.audioOutputLevel, 32767)));
    this.pending.lostPackets = Math.min(1000000, this.pending.lostPackets + Math.round(bounded(sample.packetsLost, 1000000)));
    this.pending.jitterMax = Math.max(this.pending.jitterMax, bounded(sample.jitter, 100000));
    this.pending.rttMax = Math.max(this.pending.rttMax, bounded(sample.rtt, 100000));
    this.dirty = true;
  }

  public recordEvent(type: CallMediaEvent['type'], name: string | number | null = null, atMs = Date.now()): void {
    if (this.finished) return;
    const elapsedSecond = Math.min(21600, Math.floor(Math.max(0, atMs - this.startedAtMs) / 1000));
    const second = Math.max(this.events.at(-1)?.second ?? 0, elapsedSecond);
    this.events.push({ second, type, name: eventName(name) });
    if (this.events.length > 60) this.events.shift();
    this.dirty = true;
  }

  public snapshot(): CallMediaDiagnostic {
    return {
      version: 1,
      sequence: this.sequence,
      acceptedAt: this.acceptedAt,
      edge: this.edge,
      samples: [...this.samples, ...(this.pending ? [this.pending] : [])].map((sample) => ({ ...sample })),
      events: this.events.map((event) => ({ ...event })),
    };
  }

  public async flush(): Promise<void> {
    if (!this.dirty) return;
    if (this.flushing) {
      this.flushRequested = true;
      return;
    }
    this.flushing = true;
    this.dirty = false;
    this.sequence += 1;
    const payload = this.snapshot();
    try {
      await this.send(this.appelId, payload);
    } catch (error) {
      this.dirty = true;
      console.warn('[TWILIO] Diagnostic média non enregistré', { appelId: this.appelId, error });
    } finally {
      this.flushing = false;
      if (this.flushRequested) {
        this.flushRequested = false;
        void this.flush();
      }
    }
  }

  public finish(atMs = Date.now()): void {
    if (this.finished) return;
    this.recordEvent('finished', null, atMs);
    this.finished = true;
    clearInterval(this.timer);
    void this.flush();
  }
}
