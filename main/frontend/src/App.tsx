import { useEffect, useState } from 'react'

function App() {
  const [api, setApi] = useState('a verificar…')

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => (res.ok ? 'ligada' : `erro ${res.status}`))
      .catch(() => 'sem ligação')
      .then(setApi)
  }, [])

  return (
    <main style={{ padding: 16 }}>
      <h1>TrashCanned</h1>
      <p>API: {api}</p>
    </main>
  )
}

export default App
