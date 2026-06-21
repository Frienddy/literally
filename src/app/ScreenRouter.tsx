/**
 * Renders the active screen from `store.screen` — a `switch`, not a URL router
 * (ADR-004, _docs/02 §3). There is no history stack to swipe back through; every
 * transition is a deliberate store action. Subscribes only to `screen` so it never
 * re-renders during a stroke (NFR-1).
 */
import { useScreen } from '../store/selectors';
import { WelcomeScreen } from '../screens/welcome/WelcomeScreen';
import { SensoryStormScreen } from '../screens/mode1/SensoryStormScreen';
import { FeedbackCheckScreen } from '../screens/feedback/FeedbackCheckScreen';
import { AnchorPointScreen } from '../screens/mode2/AnchorPointScreen';
import { ReflectionScreen } from '../screens/reflection/ReflectionScreen';
import { HistoryScreen } from '../screens/history/HistoryScreen';

export function ScreenRouter() {
  const screen = useScreen();

  switch (screen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'mode1':
      return <SensoryStormScreen />;
    case 'stress1':
    case 'stress2':
      return <FeedbackCheckScreen />;
    case 'mode2':
      return <AnchorPointScreen />;
    case 'reflection':
      return <ReflectionScreen />;
    case 'history':
      return <HistoryScreen />;
  }
}
