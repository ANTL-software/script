import "./clock.scss";

import { useClock } from '../../../utils/scripts/index.ts';

export default function Clock() {
  const currentTime = useClock();

  return <p className="clock-fixed">{currentTime}</p>;
}
