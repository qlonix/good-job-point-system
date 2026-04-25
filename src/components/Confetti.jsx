import { useEffect, useState } from 'react';

const COLORS = ['#ff8fab','#90d5ff','#7dddb3','#ffe066','#c4a7ff','#ffb347','#ff6b6b','#6dd5ed'];

export default function Confetti({ duration = 2500, count = 40 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const p = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100 + '%',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 6,
      dur: Math.random() * 1.5 + 1.5,
      delay: Math.random() * 0.5,
    }));
    setParticles(p);
    const t = setTimeout(() => setParticles([]), duration);
    return () => clearTimeout(t);
  }, [count, duration]);

  if (!particles.length) return null;

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            '--x': p.x,
            '--duration': p.dur + 's',
            left: p.x,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay + 's',
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
