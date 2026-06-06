import React, { useState } from 'react';

export default function AuthSandbox() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('En attente d\'une action...');

  const handleResponse = async (res: Response) => {
    const data = await res.json();
    setOutput(`[Statut ${res.status}]\n${JSON.stringify(data, null, 2)}`);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
  };

  const handleRegister = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOutput('Envoi inscription...');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      await handleResponse(res);
    } catch (err: any) {
      setOutput(`Erreur réseau : ${err.message}`);
    }
  };

  const handleLogin = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setOutput('Connexion...');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await handleResponse(res);
    } catch (err: any) {
      setOutput(`Erreur réseau : ${err.message}`);
    }
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '450px', margin: '20px auto', padding: '15px', border: '2px dashed #007bff', borderRadius: '8px' }}>
      <h2 style={{ margin: '0 0 15px 0', color: '#007bff' }}>🎮 ChessGuard Auth Sandbox</h2>
      
      {/* INSCRIPTION */}
      <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>1. Inscription</h3>
        <form onSubmit={handleRegister}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px' }} />
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px' }} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px' }} />
          <button type="submit" style={{ width: '100%', padding: '6px', background: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>Créer compte</button>
        </form>
      </div>

      {/* CONNEXION */}
      <div style={{ marginBottom: '15px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
        <h3>2. Connexion</h3>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px' }} />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '6px' }} />
          <button type="submit" style={{ width: '100%', padding: '6px', background: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }}>Se connecter</button>
        </form>
      </div>

      <h3>🖥️ Serveur :</h3>
      <pre style={{ background: '#222', color: '#0f0', padding: '10px', overflowX: 'auto', fontSize: '12px' }}>{output}</pre>
    </div>
  );
}