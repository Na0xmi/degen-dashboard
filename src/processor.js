import { Connection, PublicKey } from '@solana/web3.js'

const DEGEN_TOKEN_ADDRESS = '4w6bnjMbj8G7Ga8SGYgEMYVRRbEiFV54Nt8DiF1Hpump'

class DegenProcessor {
  constructor() {
    this.connection = new Connection('https://api.mainnet-beta.solana.com')
    this.degenMint = new PublicKey(DEGEN_TOKEN_ADDRESS)
  }

  async getTokenData() {
    try {
      // Get token supply
      const supplyInfo = await this.connection.getTokenSupply(this.degenMint)

      // Get largest holders
      const accounts = await this.connection.getTokenLargestAccounts(this.degenMint)
      const holders = accounts.value.slice(0, 5).map(account => ({
        address: account.address.toString(),
        balance: account.uiAmount || 0
      }))

      // Get recent transfers
      const signatures = await this.connection.getSignaturesForAddress(
        this.degenMint,
        { limit: 10 }
      )

      const transfers = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getParsedTransaction(sig.signature)
          return {
            signature: sig.signature,
            timestamp: sig.blockTime || 0,
            from: tx?.meta?.preTokenBalances?.[0]?.owner || 'unknown',
            to: tx?.meta?.postTokenBalances?.[0]?.owner || 'unknown',
            amount: tx?.meta?.preTokenBalances?.[0]?.uiTokenAmount?.uiAmount || 0
          }
        })
      )

      return {
        supply: supplyInfo.value.uiAmount || 0,
        holders,
        transfers,
        lastUpdated: Date.now()
      }
    } catch (error) {
      console.error('Error processing token data:', error)
      throw error
    }
  }

  async startProcessing() {
    try {
      const data = await this.getTokenData()
      console.log('Initial data loaded:', data)
      
      // Set up subscription for new transfers
      this.connection.onLogs(
        this.degenMint,
        (logs) => {
          if (logs.err) return
          console.log('New transfer detected:', logs)
          this.processNewTransfer(logs)
        },
        'confirmed'
      )

      return data
    } catch (error) {
      console.error('Error starting processor:', error)
      throw error
    }
  }
}

export default DegenProcessor