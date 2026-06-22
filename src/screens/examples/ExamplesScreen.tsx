/**
 * Examples — a standalone gallery of every task's finished drawing ("how it's
 * meant to look"). It renders each subject's hidden `target` through the shared
 * read-only `DrawingPreview`, so a gallery tile looks exactly like the same
 * drawing does on Reflection or in History.
 *
 * SCOPE / boundary: this sits *outside* the linear play flow (welcome → … →
 * reflection), reachable only by deliberately opening it from Welcome and
 * returning there. It shows the intended results but never names or explains the
 * ASD point — that stays deferred to Reflection (ADR-008, show-don't-tell). The
 * neutral chrome lives in `strings.examples`; the warm subject names come from
 * `content/tasks.ts` (content is data, not JSX — ADR-007).
 */
import { useGameStore } from '../../store/gameStore';
import { TASK_CONTENT } from '../../content/tasks';
import { strings } from '../../content/strings';
import { DrawingPreview } from '../../components/DrawingPreview';

const EXAMPLES = Object.values(TASK_CONTENT);

export function ExamplesScreen() {
  const go = useGameStore((s) => s.go);

  return (
    <main
      data-testid="screen-examples"
      className="flex h-full flex-col px-6 pb-8 pt-10 wide:mx-auto wide:w-full wide:max-w-4xl wide:px-10"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{strings.examples.title}</h1>
        <button
          type="button"
          onClick={() => go('welcome')}
          aria-label={strings.common.back}
          data-testid="examples-back"
          className="min-h-touch px-2 text-textMuted active:text-text"
        >
          ‹ {strings.common.back}
        </button>
      </header>

      <p className="mt-2 text-sm text-textMuted">{strings.examples.intro}</p>

      <div className="mt-6 flex-1 overflow-y-auto">
        <ul
          data-testid="examples-list"
          className="grid grid-cols-2 gap-3 wide:grid-cols-4"
        >
          {EXAMPLES.map((task) => (
            <li key={task.id} className="flex flex-col items-center gap-2">
              <DrawingPreview
                drawing={task.target}
                label={strings.examples.itemAria(task.label)}
                data-testid={`example-${task.id}`}
                className="aspect-square w-full"
              />
              <span className="text-center text-sm text-textMuted">
                {task.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
