Gm, 

This dashboard is built with Claude by someone who's coding skills are minimal. So excuse any weird code, it was crowd wisdom 😹

It uses Dexscreener API for price data, and Tatum for the rest of onchain data. Tatum API gives you 1 million requests for free so not a bad deal. 

Anyway, the hat stays on. 🎩 

# DEGEN Dashboard

A real-time dashboard tracking $DEGEN token metrics on Solana including:
- Current price and market cap
- Token supply
- Top holders
- Recent transfers
- Price chart (24h)

## Setup
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Add your API keys to `.env`
4. Run `npm install`
5. Run `npm run dev`

## Environment Variables Required
- VITE_TATUM_API_KEY: Your Tatum API key (Get one at https://dashboard.tatum.io/)

## APIs Used
- Dexscreener: Price and market data
- Tatum: On-chain data and transfers
- Solana Web3.js: Blockchain interaction

# Tech Stack
- React + Vite
- Tailwind CSS
- Recharts for visualizations
