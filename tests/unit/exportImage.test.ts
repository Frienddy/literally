import { describe, it, expect, vi, afterEach } from 'vitest';
import { exportComparison, isExportSupported } from '../../src/lib/exportImage';
import { resolveTask } from '../../src/content/tasks';
import type { GameSession } from '../../src/types/session';

const session: GameSession = {
  id: 'x',
  schemaVersion: 1,
  task_id: 'house',
  mode_1_drawing_data: {
    kind: 'freehand',
    strokes: [
      {
        points: [
          { x: 0, y: 0 },
          { x: 5, y: 5 },
        ],
        width: 3,
      },
    ],
    canvas: { width: 300, height: 400 },
  },
  mode_2_drawing_data: {
    kind: 'grid',
    segments: [{ from: { col: 0, row: 0 }, to: { col: 0, row: 4 } }],
    grid: { cols: 8, rows: 10 },
  },
  mode_1_stress_level: 7,
  mode_2_stress_level: 2,
  mode_1_confidence_level: 3,
  mode_2_confidence_level: 9,
  started_at: 1,
  completed_at: 2,
};

/** A no-op recording 2D context covering every call the composer makes. */
function fakeCtx() {
  const noop = () => {};
  const ctx: Record<string, unknown> = {
    fillRect: noop,
    fillText: noop,
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    beginPath: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    arc: noop,
    fill: noop,
    setLineDash: noop,
    setTransform: noop,
    clearRect: noop,
    fillStyle: '',
    strokeStyle: '',
    font: '',
    textAlign: '',
    lineCap: '',
    lineJoin: '',
    lineWidth: 0,
    globalAlpha: 1,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

afterEach(() => vi.restoreAllMocks());

describe('image export (PRD-008 R08-12 / FR-14)', () => {
  it('reports unsupported and fails safe under jsdom (no 2D context)', async () => {
    expect(isExportSupported()).toBe(false);
    await expect(exportComparison(session, resolveTask('house'))).resolves.toBe(
      false,
    );
  });

  it('produces a PNG and triggers a local download when supported', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      fakeCtx() as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(
      (cb: BlobCallback) => cb(new Blob(['png'], { type: 'image/png' })),
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    const createURL = vi.fn(() => 'blob:test');
    const revokeURL = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createURL,
      revokeObjectURL: revokeURL,
    });

    expect(isExportSupported()).toBe(true);
    await expect(exportComparison(session, resolveTask('house'))).resolves.toBe(
      true,
    );
    expect(click).toHaveBeenCalledTimes(1);
    expect(createURL).toHaveBeenCalledTimes(1);
    expect(revokeURL).toHaveBeenCalledTimes(1);
  });
});
