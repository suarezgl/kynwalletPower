import type { ResponseLatency } from '../../application/ports/response-latency.port.js';

export class SimulatedLatency implements ResponseLatency {
  constructor(private readonly milliseconds: number) {}

  wait(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.milliseconds));
  }
}
