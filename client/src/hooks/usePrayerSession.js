import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildSteps } from '../data/steps.js';

export function usePrayerSession(mode, { onStepChange, onFinish } = {}) {
  const steps = useMemo(() => buildSteps(mode), [mode]);

  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0].duration);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;
  const hasStartedRef = useRef(false);

  useEffect(() => {
    hasStartedRef.current = false;
    setStepIndex(0);
    setSecondsLeft(steps[0].duration);
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
  }, [steps]);

  useEffect(() => {
    if (!isRunning) return undefined;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning]);

  // Schrittwechsel im Effekt-Rumpf, nicht im State-Updater: Updater müssen
  // seiteneffektfrei sein (StrictMode ruft sie doppelt auf – die Glocke
  // würde sonst zweimal läuten).
  useEffect(() => {
    if (!isRunning || secondsLeft !== 0) return;

    const nextIndex = stepIndex + 1;
    if (nextIndex >= steps.length) {
      setIsRunning(false);
      setIsFinished(true);
      onFinishRef.current?.();
      return;
    }

    setStepIndex(nextIndex);
    setSecondsLeft(steps[nextIndex].duration);
    onStepChangeRef.current?.(steps[nextIndex], nextIndex);
  }, [secondsLeft, isRunning, stepIndex, steps]);

  // Event-Handler statt State-Updater für die Erststart-Glocke: Handler laufen
  // genau einmal pro Klick, Updater dürfen keine Seiteneffekte haben.
  const start = useCallback(() => {
    setIsRunning(true);
    setIsFinished(false);
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setHasStarted(true);
      onStepChangeRef.current?.(steps[0], 0);
    }
  }, [steps]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    hasStartedRef.current = false;
    setIsRunning(false);
    setHasStarted(false);
    setIsFinished(false);
    setStepIndex(0);
    setSecondsLeft(steps[0].duration);
  }, [steps]);

  const elapsedTotal = useMemo(() => {
    const previousStepsDuration = steps.slice(0, stepIndex).reduce((sum, s) => sum + s.duration, 0);
    return previousStepsDuration + (steps[stepIndex].duration - secondsLeft);
  }, [steps, stepIndex, secondsLeft]);

  return {
    steps,
    step: steps[stepIndex],
    stepIndex,
    secondsLeft,
    isRunning,
    hasStarted,
    isFinished,
    elapsedTotal,
    start,
    pause,
    reset,
  };
}
