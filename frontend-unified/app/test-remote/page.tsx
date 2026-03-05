'use client'

import { useEffect, useState } from 'react'

export default function TestRemotePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${msg}`])
    console.log(msg)
  }

  useEffect(() => {
    async function test() {
      try {
        addLog('Starting test...')
        addLog(`Current origin: ${window.location.origin}`)

        // Test 1: Fetch remoteEntry.js
        addLog('Test 1: Fetching remoteEntry.js...')
        const response = await fetch('/vue-remote/assets/remoteEntry.js')
        addLog(`Response status: ${response.status}`)
        addLog(`Content-Type: ${response.headers.get('content-type')}`)

        // Test 2: Try dynamic import
        addLog('Test 2: Trying dynamic import...')
        // @ts-expect-error - No type declarations for runtime remoteEntry.js
        const remoteModule = await import('/vue-remote/assets/remoteEntry.js')
        addLog(`Import result: ${JSON.stringify(Object.keys(remoteModule))}`)
        addLog(`Has get: ${typeof remoteModule.get}`)
        addLog(`Has init: ${typeof remoteModule.init}`)

        // Test 3: Call get function
        if (remoteModule.get) {
          addLog('Test 3: Calling get("./Dashboard")...')
          const moduleFactory = await remoteModule.get('./Dashboard')
          addLog(`Module factory keys: ${Object.keys(moduleFactory)}`)
          setResult(moduleFactory)
        }

        addLog('All tests passed!')
      } catch (err) {
        addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`)
        addLog(`Stack: ${err instanceof Error ? err.stack : ''}`)
      }
    }

    test()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vue Remote Module Test</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Logs:</h2>
          {logs.map((log, i) => (
            <div key={i} className="text-sm font-mono">{log}</div>
          ))}
        </div>

        {result && (
          <div className="bg-green-100 p-4 rounded">
            <h2 className="font-bold mb-2">Result:</h2>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
