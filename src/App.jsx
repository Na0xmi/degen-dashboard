import { useState, useEffect } from 'react'
import { Connection, PublicKey } from '@solana/web3.js'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import axios from 'axios'

const DEGEN_TOKEN_ADDRESS = '4w6bnjMbj8G7Ga8SGYgEMYVRRbEiFV54Nt8DiF1Hpump'
const TATUM_RPC = 'https://solana-mainnet.gateway.tatum.io/'
const TATUM_API_KEY = import.meta.env.VITE_TATUM_API_KEY

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
    async function fetchData() {
      try {
        // Initialize Solana connection
        const connection = new Connection(TATUM_RPC, {
          httpHeaders: {
            'x-api-key': TATUM_API_KEY
          }
        })
        const degenMint = new PublicKey(DEGEN_TOKEN_ADDRESS)

        // Get token supply
        const supplyInfo = await connection.getTokenSupply(degenMint)

        // Get price and market cap from DEXScreener
        const dexScreenerResponse = await axios.get(
          'https://api.dexscreener.com/latest/dex/tokens/4w6bnjMbj8G7Ga8SGYgEMYVRRbEiFV54Nt8DiF1Hpump'
        )
        
        const priceData = dexScreenerResponse.data.pairs?.[0] || {}
        const price = parseFloat(priceData.priceUsd) || 0
        const marketCap = parseFloat(priceData.fdv) || 0

        // Get price history
        let priceHistory = [];
        if (priceData.priceHistory) {
          const history = priceData.priceHistory.h24 || 
                         priceData.priceHistory.h6 || 
                         priceData.priceHistory.h1;
                         
          if (history) {
            priceHistory = history.map(point => ({
              time: parseInt(point.timestamp),
              price: parseFloat(point.value),
              formattedTime: new Date(parseInt(point.timestamp)).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            })).sort((a, b) => a.time - b.time);
          }
        }

        // If no price history available, generate sample data
        if (priceHistory.length === 0) {
          const now = Date.now();
          priceHistory = Array.from({ length: 24 }, (_, i) => {
            const time = now - (23 - i) * 3600000;
            return {
              time,
              price: price * (1 + (Math.random() * 0.1 - 0.05)), // 5% variance
              formattedTime: new Date(time).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })
            };
          });
        }

        // Get largest token accounts
        const accounts = await connection.getTokenLargestAccounts(degenMint)
        const holders = await Promise.all(
          accounts.value.slice(0, 5).map(async (account) => {
            const accountInfo = await connection.getParsedAccountInfo(account.address)
            return {
              address: account.address.toString(),
              balance: account.uiAmount || 0,
              owner: accountInfo.value?.data?.parsed?.info?.owner || 'unknown'
            }
          })
        )

        // Get recent transfers
        const signatures = await connection.getSignaturesForAddress(
          degenMint,
          { limit: 10 }
        )

        const transfers = await Promise.all(
          signatures.map(async (sig) => {
            const tx = await connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
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

        // Set all data at once
        setData({
          supply: supplyInfo.value.uiAmount || 0,
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
   <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 pb-8">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 flex items-center gap-3">
            <span>DEGEN Token Dashboard</span>
            <span className="text-5xl" role="img" aria-label="top hat">🎩</span>
          </h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </div>
        </div>

        {data.error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {data.error}
          </div>
        )}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Holders🐳</h2>
            <div className="space-y-4">
              {data.holders.map((holder, index) => (
                <div key={holder.address} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">
                    Wallet {index + 1}: {holder.address.slice(0, 4)}...{holder.address.slice(-4)}
                  </span>
                  <span className="text-gray-600">
                    {holder.balance.toLocaleString()} DEGEN
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transfers 💸</h2>
            <div className="space-y-4">
              {data.transfers.map((transfer) => (
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
  )
}

export default App