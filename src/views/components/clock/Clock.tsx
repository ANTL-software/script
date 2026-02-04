import "./clock.scss";

import { useClock } from "../../../utils/scripts/utils";

export default function Clock() {
  const currentTime = useClock();

  return <p className="clock-fixed">{currentTime}</p>;
}
