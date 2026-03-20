export default function Loading() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#0f0e0d'
    }}>
      <div style={{
        display: 'flex',
        gap: '8px'
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: '#c9a84c',
            animation: 'bounce 1s infinite',
            animationDelay: `${i * 0.2}s`
          }}/>
        ))}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
