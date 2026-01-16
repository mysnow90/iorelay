import { useState, useEffect } from "react"
import { io } from "socket.io-client"
import axios from "axios"
import "./App.css"
import "./styles/dashboard.css"

const API_URL = "http://localhost:3001/api"
const SOCKET_URL = "http://localhost:3001"

function App() {
  const [streams, setStreams] = useState([])
  const [destinations, setDestinations] = useState([])
  const [newStream, setNewStream] = useState({ name: "", inputUrl: "", active: true })
  const [newDestination, setNewDestination] = useState({ name: "", outputUrl: "", active: true })
  const [socket, setSocket] = useState(null)
  const [stats, setStats] = useState({ streams: 0, destinations: 0, activeStreams: 0 })
  const [loading, setLoading] = useState(true)

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL)
    setSocket(newSocket)

    newSocket.on("stream:update", () => {
      fetchStreams()
      fetchDestinations()
    })

    newSocket.on("stream:stats", (data) => {
      setStats(data)
    })

    return () => newSocket.close()
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([
      fetchStreams(),
      fetchDestinations(),
      fetchStats()
    ])
    setLoading(false)
  }

  const fetchStreams = async () => {
    try {
      const response = await axios.get(`${API_URL}/streams`)
      setStreams(response.data || [])
    } catch (error) {
      console.error("Error fetching streams:", error)
      setStreams([])
    }
  }

  const fetchDestinations = async () => {
    try {
      const response = await axios.get(`${API_URL}/destinations`)
      setDestinations(response.data || [])
    } catch (error) {
      console.error("Error fetching destinations:", error)
      setDestinations([])
    }
  }

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats`)
      setStats(response.data || { streams: 0, destinations: 0, activeStreams: 0 })
    } catch (error) {
      console.error("Error fetching stats:", error)
      setStats({ streams: 0, destinations: 0, activeStreams: 0 })
    }
  }

  const handleAddStream = async (e) => {
    e.preventDefault()
    if (!newStream.name || !newStream.inputUrl) {
      alert("Please fill in all fields")
      return
    }

    try {
      await axios.post(`${API_URL}/streams`, newStream)
      setNewStream({ name: "", inputUrl: "", active: true })
      fetchStreams()
    } catch (error) {
      console.error("Error adding stream:", error)
      alert("Failed to add stream")
    }
  }

  const handleAddDestination = async (e) => {
    e.preventDefault()
    if (!newDestination.name || !newDestination.outputUrl) {
      alert("Please fill in all fields")
      return
    }

    try {
      await axios.post(`${API_URL}/destinations`, newDestination)
      setNewDestination({ name: "", outputUrl: "", active: true })
      fetchDestinations()
    } catch (error) {
      console.error("Error adding destination:", error)
      alert("Failed to add destination")
    }
  }

  const handleToggleStream = async (id, active) => {
    try {
      await axios.put(`${API_URL}/streams/${id}`, { active: !active })
      fetchStreams()
    } catch (error) {
      console.error("Error toggling stream:", error)
    }
  }

  const handleToggleDestination = async (id, active) => {
    try {
      await axios.put(`${API_URL}/destinations/${id}`, { active: !active })
      fetchDestinations()
    } catch (error) {
      console.error("Error toggling destination:", error)
    }
  }

  const handleDeleteStream = async (id) => {
    if (!confirm("Are you sure you want to delete this stream?")) return
    
    try {
      await axios.delete(`${API_URL}/streams/${id}`)
      fetchStreams()
    } catch (error) {
      console.error("Error deleting stream:", error)
    }
  }

  const handleDeleteDestination = async (id) => {
    if (!confirm("Are you sure you want to delete this destination?")) return
    
    try {
      await axios.delete(`${API_URL}/destinations/${id}`)
      fetchDestinations()
    } catch (error) {
      console.error("Error deleting destination:", error)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-container flex items-center justify-center">
        <div className="text-white text-xl">Loading ioRelay Dashboard...</div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 shadow-lg py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-4xl font-bold gradient-text">ioRelay</h1>
              <p className="text-gray-400 mt-2">RTMP Stream Relay Dashboard</p>
            </div>
            
            <div className="flex flex-wrap gap-6">
              <div className="dashboard-card p-4 min-w-[100px] text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.streams || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Streams</div>
              </div>
              <div className="dashboard-card p-4 min-w-[100px] text-center">
                <div className="text-3xl font-bold text-green-400">{stats.destinations || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Destinations</div>
              </div>
              <div className="dashboard-card p-4 min-w-[100px] text-center">
                <div className="text-3xl font-bold text-purple-400">{stats.activeStreams || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Active</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Configuration Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Stream Configuration */}
          <div className="dashboard-card overflow-hidden">
            <div className="card-header-blue">
              <h2 className="text-2xl font-bold">Configure Stream</h2>
              <p className="text-blue-100 text-sm">Add new RTMP input stream</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddStream} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stream Name
                  </label>
                  <input
                    type="text"
                    value={newStream.name}
                    onChange={(e) => setNewStream({ ...newStream, name: e.target.value })}
                    className="dashboard-input w-full"
                    placeholder="e.g., Camera 1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    RTMP Input URL
                  </label>
                  <input
                    type="text"
                    value={newStream.inputUrl}
                    onChange={(e) => setNewStream({ ...newStream, inputUrl: e.target.value })}
                    className="dashboard-input w-full"
                    placeholder="rtmp://localhost/live/{streamKey}"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={newStream.active}
                        onChange={(e) => setNewStream({ ...newStream, active: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">Active</span>
                      <p className="text-xs text-gray-500">Enable this stream</p>
                    </div>
                  </label>
                  
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Stream
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Destination Configuration */}
          <div className="dashboard-card overflow-hidden">
            <div className="card-header-purple">
              <h2 className="text-2xl font-bold">Configure Destination</h2>
              <p className="text-purple-100 text-sm">Add RTMP output destination</p>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleAddDestination} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Destination Name
                  </label>
                  <input
                    type="text"
                    value={newDestination.name}
                    onChange={(e) => setNewDestination({ ...newDestination, name: e.target.value })}
                    className="dashboard-input w-full"
                    placeholder="e.g., YouTube Live"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    RTMP Output URL
                  </label>
                  <input
                    type="text"
                    value={newDestination.outputUrl}
                    onChange={(e) => setNewDestination({ ...newDestination, outputUrl: e.target.value })}
                    className="dashboard-input w-full"
                    placeholder="rtmp://a.rtmp.youtube.com/live2/{streamKey}"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={newDestination.active}
                        onChange={(e) => setNewDestination({ ...newDestination, active: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-300">Active</span>
                      <p className="text-xs text-gray-500">Enable this destination</p>
                    </div>
                  </label>
                  
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add Destination
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Streams & Destinations Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Streams List */}
          <div className="dashboard-card overflow-hidden">
            <div className="card-header-blue flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Streams</h2>
                <p className="text-blue-100 text-sm">Active input streams</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="stat-badge">
                  {streams.filter(s => s.active).length} active
                </span>
                <button
                  onClick={fetchStreams}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {streams.length > 0 ? (
                <div className="space-y-4">
                  {streams.map((stream) => (
                    <div key={stream.id || stream.name} className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={stream.active ? "status-active" : "status-inactive"}></div>
                          <div>
                            <h3 className="font-bold text-white">{stream.name}</h3>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(stream.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStream(stream.id, stream.active)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${stream.active ? "btn-danger" : "btn-primary"}`}
                          >
                            {stream.active ? "Stop" : "Start"}
                          </button>
                          <button
                            onClick={() => handleDeleteStream(stream.id)}
                            className="btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-xs text-gray-400 mb-2">Input URL:</div>
                        <div className="code-block">
                          <code>{stream.inputUrl}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No Streams Yet</h3>
                  <p className="text-gray-500">Add your first stream using the configuration panel above</p>
                </div>
              )}
            </div>
          </div>

          {/* Destinations List */}
          <div className="dashboard-card overflow-hidden">
            <div className="card-header-purple flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Destinations</h2>
                <p className="text-purple-100 text-sm">Output destinations</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className="stat-badge">
                  {destinations.filter(d => d.active).length} active
                </span>
                <button
                  onClick={fetchDestinations}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all"
                >
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {destinations.length > 0 ? (
                <div className="space-y-4">
                  {destinations.map((destination) => (
                    <div key={destination.id || destination.name} className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={destination.active ? "status-active" : "status-inactive"}></div>
                          <div>
                            <h3 className="font-bold text-white">{destination.name}</h3>
                            <p className="text-xs text-gray-500">
                              Created: {new Date(destination.createdAt || Date.now()).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleDestination(destination.id, destination.active)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${destination.active ? "btn-danger" : "btn-primary"}`}
                          >
                            {destination.active ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => handleDeleteDestination(destination.id)}
                            className="btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <div className="text-xs text-gray-400 mb-2">Output URL:</div>
                        <div className="code-block">
                          <code>{destination.outputUrl}</code>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-300 mb-2">No Destinations Yet</h3>
                  <p className="text-gray-500">Add your first destination using the configuration panel above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Server Status */}
          <div className="dashboard-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="status-active"></div>
              <h3 className="text-xl font-bold text-white">Server Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400">WebSocket</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${socket?.connected ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {socket?.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400">RTMP Server</span>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                  Running
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-xl">
                <span className="text-gray-400">Backend API</span>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>

          {/* Connection Info */}
          <div className="dashboard-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-white">Connection Info</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-gray-900/50 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">RTMP Ingest URL</div>
                <div className="code-block">
                  <code>rtmp://localhost/live</code>
                </div>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-xl">
                <div className="text-xs text-gray-400 mb-1">HLS Playback URL</div>
                <div className="code-block">
                  <code>http://localhost:8000/live</code>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dashboard-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={fetchAllData} className="p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="text-sm font-medium text-blue-300">Refresh All</span>
                </div>
              </button>
              <button className="p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-purple-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span className="text-sm font-medium text-purple-300">Export</span>
                </div>
              </button>
              <button className="p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  <span className="text-sm font-medium text-green-300">Restart</span>
                </div>
              </button>
              <button className="p-4 bg-gray-900/50 hover:bg-gray-800/50 rounded-xl transition-all">
                <div className="flex flex-col items-center">
                  <svg className="w-6 h-6 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="text-sm font-medium text-red-300">Clear All</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold gradient-text">ioRelay</h3>
              <p className="text-gray-500 text-sm">RTMP Stream Relay System v1.0.0</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                Made with <span className="text-red-500">?</span> by ioRelay Team
              </p>
              <p className="text-gray-500 text-sm mt-1">Stream smarter, relay better.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
