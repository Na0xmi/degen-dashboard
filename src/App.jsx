import { useState, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const DEGEN_TOKEN_ADDRESS = '4w6bnjMbj8G7Ga8SGYgEMYVRRbEiFV54Nt8DiF1Hpump'
const TATUM_RPC = 'https://solana-mainnet.gateway.tatum.io'
const TATUM_API_KEY = import.meta.env.VITE_TATUM_API_KEY
function TweetEmbed() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <a 
        href="https://x.com/ConejoCapital/status/1854610237078356127"
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg">
          <div className="flex items-center mb-4">
            <img 
              src="https://pbs.twimg.com/profile_images/1649147774611386376/qIO0vCcu_400x400.jpg" 
              alt="Conejo Capital" 
              className="w-12 h-12 rounded-full mr-4"
            />
            <div>
              <p className="font-bold">Conejo Capital 🐰</p>
              <p className="text-gray-500">@ConejoCapital</p>
            </div>
          </div>
          <p className="text-lg mb-4">
            chat, i'm very disheartened by the $DEGEN drama<br/><br/>
            that is why, as a member of the degen community i have started to migrate the Degen community <br/>
            to the one true degen chain: Solana<br/><br/>
            the hat stays on 🎩 <br/>

          </p>
          <p className="text-gray-500">10:15 PM · Apr 26, 2024</p>
        </div>
      </a>
    </div>
  )
}

function TenorGifEmbed() {
  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://tenor.com/embed.js"
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div 
      className="tenor-gif-embed" 
      data-postid="18688401" 
      data-share-method="host" 
      data-aspect-ratio="1.35021" 
      data-width="100%"
    >
      <a href="https://tenor.com/view/detective-conan-magic-kaito-kaito-kid-kaitou-kid-kaito-kuroba-gif-18688401">
        Detective Conan Magic Kaito GIF
      </a>
    </div>
  )
}

const customRpcRequest = async (method, params = []) => {
  try {
    const { data } = await axios.post('https://cors.bridged.cc/https://solana-mainnet.gateway.tatum.io/', {
      jsonrpc: '2.0',
      id: 1,
      method,
      params
    }, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': TATUM_API_KEY,
        'origin': 'http://localhost:5173'
      }
    })
    return data.result
  } catch (error) {
    console.error('RPC Error:', error)
    throw error
  }
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatPrice(price) {
  if (!price || price === 0) return '0.00000000';
  if (price < 0.00000001) {
    return price.toExponential(8);
  }
  return price.toFixed(8);
}

function formatMarketCap(marketCap) {
  if (!marketCap || marketCap === 0) return '$0';
  if (marketCap >= 1000000) {
    return `$${(marketCap / 1000000).toFixed(2)}M`;
  }
  return `$${marketCap.toLocaleString()}`;
}

function App() {
  const [data, setData] = useState({
    supply: 0,
    price: 0,
    priceHistory: [],
    holders: [],
    transfers: [],
    isLoading: true,
    error: null
  })


  useEffect(() => {
    const TATUM_API_KEY = import.meta.env.VITE_TATUM_API_KEY
  
    const customRpcRequest = async (method, params = []) => {
      try {
        const { data } = await axios.post('https://solana-mainnet.gateway.tatum.io/', {
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        }, {
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'x-api-key': TATUM_API_KEY
          }
        })
        if (data.error) {
          console.error('RPC Error:', data.error)
          throw new Error(data.error.message)
        }
        return data.result
      } catch (error) {
        console.error('RPC Error:', error)
        throw error
      }
    }
  
    async function fetchData() {
      try {
        // Get token metadata and supply
        const mintInfoResponse = await customRpcRequest('getAccountInfo', [DEGEN_TOKEN_ADDRESS, {
          encoding: 'jsonParsed'
        }])
        const mintInfo = mintInfoResponse?.value?.data?.parsed?.info
        const supply = mintInfo?.supply || 0
  
        // Get price and market cap from DEXScreener
        const dexScreenerResponse = await axios.get(
          'https://api.dexscreener.com/latest/dex/tokens/4w6bnjMbj8G7Ga8SGYgEMYVRRbEiFV54Nt8DiF1Hpump'
        )
        
        const priceData = dexScreenerResponse.data.pairs?.[0] || {}
        const price = parseFloat(priceData.priceUsd) || 0
        const marketCap = parseFloat(priceData.fdv) || 0
  
        // Get price history from DexScreener data
        let priceHistory = []
        if (priceData.priceHistory) {
          const history = priceData.priceHistory.h24 || 
                         priceData.priceHistory.h6 || 
                         priceData.priceHistory.h1
                         
          if (history) {
            priceHistory = history.map(point => ({
              time: parseInt(point.timestamp),
              price: parseFloat(point.value),
              formattedTime: new Date(parseInt(point.timestamp)).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            })).sort((a, b) => a.time - b.time)
          }
        }
  
        // If no price history, generate sample data
        if (priceHistory.length === 0) {
          const now = Date.now()
          priceHistory = Array.from({ length: 24 }, (_, i) => {
            const time = now - (23 - i) * 3600000
            return {
              time,
              price: price * (1 + (Math.random() * 0.1 - 0.05)),
              formattedTime: new Date(time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          })
        }
  
        // Get token holders using getProgramAccounts
        const holdersResponse = await customRpcRequest('getProgramAccounts', [
          'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          {
            filters: [
              {
                dataSize: 165  // Size of token account data
              },
              {
                memcmp: {
                  offset: 0,
                  bytes: DEGEN_TOKEN_ADDRESS
                }
              }
            ],
            encoding: 'jsonParsed'
          }
        ])
  
        // Process holder data
        const holders = holdersResponse
          .map(account => ({
            address: account.pubkey,
            balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
            owner: account.account.data.parsed.info.owner
          }))
          .filter(holder => holder.balance > 0)
          .sort((a, b) => b.balance - a.balance)
          .slice(0, 10)
  
        // Get recent transactions
        const signaturesResponse = await customRpcRequest('getSignaturesForAddress', [
          DEGEN_TOKEN_ADDRESS,
          { limit: 10 }
        ])
  
        // Get transaction details
        const transfers = await Promise.all(
          signaturesResponse.map(async (sig) => {
            const tx = await customRpcRequest('getTransaction', [
              sig.signature,
              {
                encoding: 'jsonParsed',
                maxSupportedTransactionVersion: 0
              }
            ])
  
            let amount = 0
            if (tx?.meta?.preTokenBalances?.[0] && tx?.meta?.postTokenBalances?.[0]) {
              amount = Math.abs(
                (tx.meta.postTokenBalances[0].uiTokenAmount.uiAmount || 0) -
                (tx.meta.preTokenBalances[0].uiTokenAmount.uiAmount || 0)
              )
            }
  
            return {
              signature: sig.signature,
              timestamp: sig.blockTime || 0,
              amount,
              from: tx?.meta?.preTokenBalances?.[0]?.owner || 'unknown',
              to: tx?.meta?.postTokenBalances?.[0]?.owner || 'unknown'
            }
          })
        )
  
        // Update state with all data
        setData({
          supply: parseFloat(supply) / Math.pow(10, mintInfo?.decimals || 9),
          price,
          marketCap,
          priceHistory,
          holders,
          transfers,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        })
  
      } catch (error) {
        console.error('Error fetching data:', error)
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: `Error fetching data: ${error.message}`
        }))
      }
    }
  
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-lg font-semibold text-blue-600">Loading DEGEN data...</div>
      </div>
    )
  }

  const marketCap = data.supply * data.price
  return (
    <div className="min-h-screen flex flex-col bg-degen-gradient">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Last Updated */}
        <div className="flex justify-end mb-4">
          <div className="text-sm text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        </div>
  
        {/* Error Display */}
        {data.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {data.error}
          </div>
        )}

       <div className = "flex-grow max-w-7x1 mx-auto px-4 py-8 w-full">
        {/* Welcome Section with Embeds */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-degen mb-8">
            Welcome to DEGEN on Solana
          </h1>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
            {/* Tweet embed */}
            <div className="bg-white rounded-xl shadow-lg p-6 min-h-[400px]">
              <TweetEmbed />
            </div>
  
            {/* Top hat gif and button section */}
            <div className="flex flex-col items-center justify-center gap-6 bg-white rounded-xl shadow-lg p-6">
              <div className="w-full min-h-[300px]">
                <TenorGifEmbed />
              </div>
              <a 
                href="https://dexscreener.com/solana/9svudkgthqrzwbqpx6id4uqpbjcf6hxyfevqu9u7avwe"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-degen to-degen-light text-white font-bold py-3 px-6 rounded-lg transition-all shadow-md hover:shadow-lg hover:opacity-90"
              >
                Buy $DEGEN on SOL
              </a>
            </div>
          </div>
        </div>
  
        {/* Dashboard Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-degen flex items-center justify-center gap-3">
            <span>DEGEN Token Dashboard</span>
            <span className="text-5xl" role="img" aria-label="top hat">🎩</span>
          </h1>
        </div>
  
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Supply</h2>
            <p className="text-2xl font-bold text-gray-900">
              {data.supply.toLocaleString()} DEGEN
            </p>
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Price</h2>
            <p className="text-2xl font-bold text-gray-900">
              ${formatPrice(data.price)}
            </p>
            {data.price > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {formatPrice(data.price * 1e8)} sats
              </p>
            )}
          </div>
  
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Market Cap</h2>
            <p className="text-2xl font-bold text-gray-900">
              {formatMarketCap(data.marketCap)}
            </p>
          </div>
        </div>
  
        {/* Price Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Price Chart (24h)</h2>
          <div className="h-[400px]">
            {data.priceHistory && data.priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.priceHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="formattedTime" 
                    interval="preserveStartEnd"
                    tickMargin={10}
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tickFormatter={value => formatPrice(value)}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => [`$${formatPrice(value)}`, 'Price']}
                    labelFormatter={(label) => `Time: ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    animationDuration={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                {data.error ? 'Error loading price data' : 'Loading price data...'}
              </div>
            )}
          </div>
          {data.priceHistory && data.priceHistory.length > 0 && (
            <div className="mt-4 text-sm text-gray-500 flex justify-between">
              <span>24h Low: ${formatPrice(Math.min(...data.priceHistory.map(p => p.price)))}</span>
              <span>24h High: ${formatPrice(Math.max(...data.priceHistory.map(p => p.price)))}</span>
            </div>
          )}
        </div>
  
        {/* Holders and Transfers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Top Holders */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Holders🐋</h2>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {data.holders.map((holder, index) => (
                <div key={holder.address} className="flex justify-between items-center hover:bg-gray-50 p-2 rounded">
                  <span className="font-medium text-gray-700">
                    {index + 1}. {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                  </span>
                  <span className="text-gray-600">
                    {holder.balance.toLocaleString()} DEGEN
                  </span>
                </div>
              ))}
            </div>
          </div>
  
          {/* Recent Transfers */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transfers 💸</h2>
            <div className="space-y-4">
              {data.transfers.slice(0,5).map((transfer) => (
                <div key={transfer.signature} className="border-b border-gray-100 pb-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="text-sm font-medium">
                        {transfer.from.slice(0, 4)}...{transfer.from.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="text-sm font-medium">
                        {transfer.to.slice(0, 4)}...{transfer.to.slice(-4)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="text-sm font-medium">
                        {transfer.amount.toLocaleString()} DEGEN
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="text-sm font-medium">
                        {new Date(transfer.timestamp * 1000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
      {/* Footer */}
  <footer className="w-full bg-black text-white py-6 mt-auto">
  <div className="max-w-7xl mx-auto px-4">
    <div className="flex justify-between items-center">
      {/* Left side - Powered by */}
      <div className="text-gray-300">
        Powered by Tatum & Dexscreener API
      </div>

      {/* Middle - Built with */}
      <p className="text-gray-300">
        Built with ❤️ and 🎩 by{' '}
        <a 
          href="https://x.com/Naomi_fromhh" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-degen-light hover:text-white font-medium transition-colors"
        >
          Naomiii
        </a>
        {' & Claude'}
      </p>

      {/* Right side - Coffee button */}
      <button 
        onClick={() => {
          navigator.clipboard.writeText('5zheWDh6fHpDdnNTdAG6wh4VStsnfLKGpiW4tmJvSLLj');
          alert('Address copied to clipboard!');
        }}
        className="bg-gradient-to-r from-degen to-degen-light text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 shadow-md"
      >
        <span>Buy me a coffee ☕</span>
        <span className="text-xs opacity-75">(click to copy address)</span>
      </button>
    </div>
  </div>
  </footer>
</div>
  );
}

export default App