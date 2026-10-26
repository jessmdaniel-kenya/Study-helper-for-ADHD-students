import { motion } from 'framer-motion';
import { BatteryLow, BatteryMedium, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import {
  useAppStore,
  type EnergyLevel,
} from '../stores/useAppStore';

const energyOptions: {
  level: EnergyLevel;
  description: string;
  Icon: typeof BatteryLow;
}[] = [
  {
    level: 'Low',
    description: 'Start a gentle 50-second teaser.',
    Icon: BatteryLow,
  },
  {
    level: 'Medium',
    description: 'Standard 20-minute focused sprint.',
    Icon: BatteryMedium,
  },
  {
    level: 'Wired',
    description: 'Open count-up or 30-minute deep dive.',
    Icon: Zap,
  },
];

const MotionButton = motion.create(Button);

export default function EnergyCheckIn() {
  const navigate = useNavigate();
  const energyLevel = useAppStore((state) => state.energyLevel);
  const setEnergyLevel = useAppStore((state) => state.setEnergyLevel);
  const { reducedMotion, lowSensory } = useAppStore(
    (state) => state.accessibilityProfile,
  );
  const disableAnimations = reducedMotion || lowSensory;

  const handleEnergySelect = (level: EnergyLevel) => {
    setEnergyLevel(level);
    navigate('/feed');
  };

  return (
    <section className="energy-check-in" aria-labelledby="energy-heading">
      <h1 id="energy-heading">Tap Your Energy</h1>
      <p id="energy-description" className="hint">
        How much battery do you have right now?
      </p>

      <div
        className="energy-options"
        role="group"
        aria-labelledby="energy-heading"
        aria-describedby="energy-description"
      >
        {energyOptions.map(({ level, description, Icon }, index) => (
          <Card className="energy-card" key={level}>
            <MotionButton
              type="button"
              className="energy-option"
              aria-label={`Select ${level} energy. ${description}`}
              aria-pressed={energyLevel === level}
              onClick={() => handleEnergySelect(level)}
              initial={disableAnimations ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                disableAnimations
                  ? { duration: 0 }
                  : { duration: 0.3, delay: index * 0.08 }
              }
            >
              <span className="energy-option__icon" aria-hidden="true">
                <Icon size={28} strokeWidth={2} />
              </span>
              <span className="energy-option__copy">
                <span className="energy-option__title">{level}</span>
                <span className="energy-option__description">{description}</span>
              </span>
              <span className="energy-option__arrow" aria-hidden="true">
                →
              </span>
            </MotionButton>
          </Card>
        ))}
      </div>
    </section>
  );
}
