export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0a0a0a',
      gap: '16px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f5a623, #e8834a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0a0a0a',
        fontWeight: '800',
        fontSize: '22px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: 'pulse-glow 2s ease-in-out infinite'
      }}>S</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#f5a623',
            animation: 'bounce-dot 1s infinite',
            animationDelay: `${i * 0.15}s`
          }}/>
        ))}
      </div>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.3); transform: scale(1); }
          50% { box-shadow: 0 0 24px 6px rgba(245,166,35,0.15); transform: scale(1.05); }
        }
        @keyframes bounce-dot {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
