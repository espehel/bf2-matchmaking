import React, { FC, useEffect, useState } from 'react';
import moment from 'moment';
import { SUMMONING_DURATION, getDurationString, getTimeLeft } from '@bf2-matchmaking/utils';

interface Props {
  target: string;
  onTimedOut: VoidFunction;
}
const circumference = 30 * 2 * Math.PI;
const Countdown: FC<Props> = ({ target, onTimedOut }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(target));
  const percent = (timeLeft.asMilliseconds() / SUMMONING_DURATION) * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = moment(target).diff(moment());
      if (diff > 0) {
        setTimeLeft(moment.duration(diff));
      } else {
        setTimeLeft(moment.duration(0));
        onTimedOut();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="inline-flex items-center justify-center overflow-hidden rounded-full bottom-5 left-5">
      <svg className="w-20 h-20">
        <circle
          className="text-gray-300"
          strokeWidth="5"
          stroke="currentColor"
          fill="transparent"
          r="30"
          cx="40"
          cy="40"
        />
        <circle
          className="text-blue-600"
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="30"
          cx="40"
          cy="40"
        />
      </svg>
      <span className="absolute text-xl text-blue-700">{getDurationString(timeLeft)}</span>
    </div>
  );
};

export default Countdown;
