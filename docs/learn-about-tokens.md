# Understanding Tokens: A Beginner's Guide

This guide explains crypto tokens for people new to the space. By the end, you'll understand what TFET and tBNB are, how wallet addresses work, and how to send/receive tokens using MetaMask.

## Table of Contents

- [What Are Tokens?](#what-are-tokens)
- [Understanding Blockchains and Networks](#understanding-blockchains-and-networks)
- [How FET Works on BNB Smart Chain](#how-fet-works-on-bnb-smart-chain)
- [TFET and tBNB Explained](#tfet-and-tbnb-explained)
- [Understanding Wallet Addresses](#understanding-wallet-addresses)
- [Setting Up MetaMask](#setting-up-metamask)
- [Adding Networks to MetaMask](#adding-networks-to-metamask)
- [Adding TFET Token to MetaMask](#adding-tfet-token-to-metamask)
- [Receiving Tokens](#receiving-tokens)
- [Sending Tokens](#sending-tokens)
- [Getting Free Testnet Tokens](#getting-free-testnet-tokens)
- [Common Questions](#common-questions)

---

## What Are Tokens?

Think of tokens like digital coins that exist on a blockchain (a shared, public ledger).

**Key concepts:**

| Term | What It Means |
|------|---------------|
| **Token** | A digital asset on a blockchain (like digital money or points) |
| **Wallet** | Software that holds your tokens (like a digital bank account) |
| **Address** | Your unique identifier for receiving tokens (like an account number) |
| **Private Key** | Your secret password that controls your wallet (NEVER share this) |
| **Transaction** | Moving tokens from one address to another |
| **Gas Fee** | A small fee paid to process transactions (paid in the network's native token) |

---

## Understanding Blockchains and Networks

Before diving into specific tokens, let's understand how different blockchains relate to each other.

### What is a Blockchain?

A blockchain is like a shared spreadsheet that thousands of computers maintain together. No single person controls it, and once something is written, it can't be changed.

Different blockchains are like different countries — each has its own currency, rules, and infrastructure:

| Blockchain | Native Token | What It's Known For |
|------------|--------------|---------------------|
| Ethereum | ETH | The original smart contract platform |
| BNB Smart Chain (BSC) | BNB | Faster and cheaper than Ethereum |
| Fetch.ai Network | FET | AI agent infrastructure |
| Solana | SOL | Very fast transactions |
| Bitcoin | BTC | The original cryptocurrency |

### Why Are There So Many?

Each blockchain makes different tradeoffs:

- **Ethereum:** Most secure and decentralized, but expensive and slow
- **BSC:** Faster and cheaper, slightly less decentralized
- **Fetch.ai:** Specialized for AI agents, uses Cosmos SDK

Think of it like choosing between shipping companies — FedEx, UPS, and DHL all deliver packages, but have different prices, speeds, and coverage areas.

### Networks vs Tokens

This is where it gets confusing:

- A **network/blockchain** is the infrastructure (like the postal system)
- A **token** is the asset that moves on that infrastructure (like letters and packages)

Some tokens (like FET) exist on MULTIPLE networks. Same token, different "postal systems."

---

## How FET Works on BNB Smart Chain

This is the key concept that confuses most beginners: **FET exists on multiple blockchains**.

### FET's Multiple Homes

FET (Fetch.ai's token) lives on several blockchains:

| Network | Token Version | Use Case |
|---------|---------------|----------|
| Fetch.ai Network | Native FET | Agent-to-agent payments, staking |
| BNB Smart Chain | FET (BEP-20) | Trading, DeFi, AgentLaunch |
| Ethereum | FET (ERC-20) | Trading, DeFi |

They're all "FET" and have the same value, but they exist on different networks.

### Why Does AgentLaunch Use BSC?

AgentLaunch chose BNB Smart Chain because:

1. **Low fees:** Transactions cost fractions of a cent (vs $5-50 on Ethereum)
2. **Fast:** 3-second block times (vs 12+ seconds on Ethereum)
3. **Wide adoption:** Easy to trade on PancakeSwap and other DEXs
4. **MetaMask compatible:** Uses the same wallet as Ethereum

### The Two-Token System

On BSC, you need two tokens to do anything:

```
┌─────────────────────────────────────────────────────────┐
│                    BNB Smart Chain                       │
│                                                          │
│   ┌─────────┐           ┌─────────┐                     │
│   │   BNB   │           │   FET   │                     │
│   │  (Gas)  │           │ (Value) │                     │
│   └────┬────┘           └────┬────┘                     │
│        │                     │                          │
│        ▼                     ▼                          │
│   Pays for ALL          Used in apps                    │
│   transactions          like AgentLaunch                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**BNB** = The "gas" that powers every transaction on BSC
**FET** = The currency used specifically in the Fetch.ai/AgentLaunch ecosystem

### Real-World Analogy

Imagine BSC is a highway system:

- **BNB** = Gasoline for your car (you need it to drive anywhere)
- **FET** = The cargo you're transporting (the actual value you're moving)

To transport cargo (FET), you need gasoline (BNB). You can't do one without the other.

### Bridging Between Networks

If you have FET on Ethereum and want it on BSC, you use a "bridge":

1. Send FET to the bridge contract on Ethereum
2. Bridge locks your tokens
3. Bridge mints equivalent FET on BSC
4. You receive FET on BSC

Popular bridges:
- [Multichain](https://multichain.org) (formerly Anyswap)
- [cBridge](https://cbridge.celer.network)

For testnet, you don't need to bridge — just get free TFET from the faucet.

---

## TFET and tBNB Explained

We use two tokens on the BSC Testnet:

### tBNB (Test BNB)

- **What it is:** The native token of BSC Testnet
- **What it's for:** Paying gas fees (transaction costs)
- **Real value:** None (it's play money for testing)
- **Mainnet equivalent:** BNB (which has real value)

Think of tBNB like the electricity that powers the network. Every transaction needs a tiny bit of tBNB to process.

### TFET (Test FET)

- **What it is:** Test version of the FET token
- **What it's for:** Deploying agents, trading agent tokens, paying for agent services
- **Real value:** None (it's play money for testing)
- **Mainnet equivalent:** FET (which has real value)
- **Contract address:** `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7`

TFET is what you use in the AgentLaunch ecosystem. Deploying an agent costs 120 TFET, trading tokens uses TFET, etc.

### Why Two Tokens?

| Token | Purpose | Analogy |
|-------|---------|---------|
| tBNB | Pays for transaction processing | Like postage stamps for mail |
| TFET | Used in the AgentLaunch platform | Like the actual money you're sending |

You need BOTH: tBNB to pay the "postage" and TFET to do things on AgentLaunch.

---

## Understanding Wallet Addresses

A wallet address is like a bank account number, but public and permanent.

### What an Address Looks Like

```
0x742d35Cc6634C0532925a3b844Bc9e7595f8dE21
```

- Always starts with `0x`
- 42 characters total (0x + 40 hex characters)
- Mix of numbers (0-9) and letters (a-f, A-F)
- Case doesn't matter for sending (but some wallets show checksummed addresses with mixed case)

### Address Facts

| Fact | Explanation |
|------|-------------|
| **Public** | Anyone can see your address and balance (blockchain is public) |
| **Permanent** | Your address never changes |
| **Reusable** | You can receive unlimited transactions to one address |
| **Unique** | No two wallets have the same address |

### Address vs Private Key

| | Address | Private Key |
|-|---------|-------------|
| **Share it?** | Yes, give it to people to receive tokens | NEVER share |
| **Like** | Your email address | Your email password |
| **If stolen** | Nothing happens | You lose everything |

---

## Setting Up MetaMask

MetaMask is the most popular browser wallet. Here's how to set it up:

### Step 1: Install MetaMask

1. Go to [metamask.io](https://metamask.io)
2. Click "Download"
3. Choose your browser (Chrome, Firefox, Edge, or Brave)
4. Click "Add to Chrome" (or your browser)
5. Pin the extension to your toolbar for easy access

### Step 2: Create a Wallet

1. Click the MetaMask icon in your browser
2. Click "Get Started"
3. Click "Create a Wallet"
4. Create a password (this is for this device only)
5. **CRITICAL:** Write down your 12-word Secret Recovery Phrase on paper
   - Store it somewhere safe (not on your computer)
   - Anyone with these words can steal your funds
   - If you lose these words, you lose access forever
6. Confirm your phrase by clicking the words in order
7. Done! You now have a wallet

### Step 3: Find Your Address

1. Click the MetaMask icon
2. Your address is shown at the top (starts with 0x...)
3. Click it to copy the full address

---

## Adding Networks to MetaMask

By default, MetaMask only shows Ethereum. We need to add BNB Smart Chain networks.

### Understanding Network Types

| Network | Chain ID | Purpose | Tokens |
|---------|----------|---------|--------|
| BSC Mainnet | 56 | Real transactions with real money | BNB, FET |
| BSC Testnet | 97 | Testing with play money | tBNB, TFET |

**Start with testnet!** Use testnet until you're comfortable, then switch to mainnet for real transactions.

### Method 1: ChainList (Easiest)

ChainList is a website that adds networks to MetaMask with one click.

**Adding BSC Testnet:**

1. Open MetaMask and make sure it's unlocked
2. Go to [chainlist.org](https://chainlist.org)
3. **Important:** Check the "Include Testnets" checkbox at the top
4. Search for "BSC Testnet" or type "97" (the chain ID)
5. Find "BNB Smart Chain Testnet" with Chain ID 97
6. Click "Add to MetaMask"
7. MetaMask will pop up — click "Approve"
8. Click "Switch to Network" to start using it

**Adding BSC Mainnet:**

1. Go to [chainlist.org](https://chainlist.org)
2. Search for "BNB Smart Chain" or type "56"
3. Find "BNB Smart Chain Mainnet" with Chain ID 56
4. Click "Add to MetaMask"
5. Approve in MetaMask

### Method 2: Manual Setup (Step-by-Step)

If ChainList doesn't work, add networks manually:

**Step 1: Open Network Settings**

1. Click the MetaMask fox icon in your browser toolbar
2. Look at the top center — you'll see the current network name (probably "Ethereum Mainnet")
3. Click on that network name to open the dropdown
4. Scroll to the bottom and click "Add Network"
5. Click "Add a network manually" at the bottom of the page

**Step 2: Enter BSC Testnet Details**

Fill in EXACTLY these values (copy-paste to avoid typos):

| Field | Value to Enter |
|-------|----------------|
| Network Name | `BNB Smart Chain Testnet` |
| New RPC URL | `https://data-seed-prebsc-1-s1.binance.org:8545/` |
| Chain ID | `97` |
| Currency Symbol | `tBNB` |
| Block Explorer URL | `https://testnet.bscscan.com` |

**Step 3: Save and Switch**

1. Click "Save"
2. MetaMask will ask if you want to switch to this network — click "Switch to BNB Smart Chain Testnet"
3. You should now see "BNB Smart Chain Testnet" at the top of MetaMask
4. Your balance will show "0 tBNB" (we'll get tokens later)

### Adding BSC Mainnet Manually

For when you're ready for real transactions:

| Field | Value to Enter |
|-------|----------------|
| Network Name | `BNB Smart Chain` |
| New RPC URL | `https://bsc-dataseed.binance.org/` |
| Chain ID | `56` |
| Currency Symbol | `BNB` |
| Block Explorer URL | `https://bscscan.com` |

### Switching Between Networks

Once you've added networks, switching is easy:

1. Click the network name at the top of MetaMask
2. Click the network you want to use
3. Your view switches instantly

**Remember:** Each network has separate balances. If you have 100 FET on mainnet, you'll see 0 TFET on testnet (they're different tokens on different networks).

### Troubleshooting Network Issues

**"Could not fetch chain ID"**
- The RPC URL might be down. Try an alternative:
  - BSC Testnet: `https://data-seed-prebsc-2-s1.binance.org:8545/`
  - BSC Mainnet: `https://bsc-dataseed1.binance.org/`

**"Chain ID already exists"**
- You've already added this network. Look in your network dropdown.

**Network added but can't switch**
- Close and reopen MetaMask
- If that fails, try removing and re-adding the network

### Alternative RPC URLs

If the default RPC is slow, try these alternatives:

**BSC Testnet:**
```
https://data-seed-prebsc-1-s1.binance.org:8545/
https://data-seed-prebsc-2-s1.binance.org:8545/
https://data-seed-prebsc-1-s2.binance.org:8545/
```

**BSC Mainnet:**
```
https://bsc-dataseed.binance.org/
https://bsc-dataseed1.binance.org/
https://bsc-dataseed2.binance.org/
https://bsc-dataseed3.binance.org/
```

---

## Adding TFET Token to MetaMask

MetaMask won't show your TFET balance until you add the token:

1. Make sure you're on BSC Testnet
2. Click "Import tokens" at the bottom of the asset list
3. Enter the TFET contract address:
   ```
   0x304ddf3eE068c53514f782e2341B71A80c8aE3C7
   ```
4. Token Symbol and Decimals should auto-fill (TFET, 18)
5. Click "Add Custom Token"
6. Click "Import Tokens"

Now you'll see your TFET balance alongside tBNB.

---

## Receiving Tokens

Receiving is the easy part:

1. Open MetaMask
2. Click your address at the top to copy it
3. Give this address to whoever is sending you tokens
4. Wait for the transaction to confirm (usually 3-15 seconds on BSC)
5. Your balance updates automatically

That's it! You don't need to "accept" incoming tokens. They just arrive.

### Viewing Transaction Details

1. Click on the transaction in MetaMask
2. Click "View on block explorer"
3. See full details: sender, amount, time, gas used

---

## Sending Tokens

### Sending tBNB

1. Open MetaMask (make sure you're on BSC Testnet)
2. Click "Send"
3. Paste the recipient's address (starts with 0x)
4. Enter the amount of tBNB to send
5. Review the gas fee (usually tiny, like 0.0001 tBNB)
6. Click "Confirm"
7. Wait a few seconds for confirmation

### Sending TFET

1. Open MetaMask (make sure you're on BSC Testnet)
2. Click on "TFET" in your asset list
3. Click "Send"
4. Paste the recipient's address
5. Enter the amount of TFET to send
6. Review the gas fee (paid in tBNB, not TFET)
7. Click "Confirm"
8. Wait for confirmation

### Important: Gas Fees

Even when sending TFET, you pay the gas fee in tBNB. Always keep a small tBNB balance for fees:

| Transaction Type | Typical Gas Cost |
|------------------|------------------|
| Simple tBNB transfer | ~0.0001 tBNB |
| TFET transfer | ~0.0002 tBNB |
| Complex contract interaction | ~0.001 tBNB |

---

## Getting Free Testnet Tokens

Since testnet tokens have no real value, you can get them for free:

### Getting tBNB

**BSC Testnet Faucet:**
1. Go to [testnet.bnbchain.org/faucet-smart](https://testnet.bnbchain.org/faucet-smart)
2. Paste your wallet address
3. Complete the captcha
4. Click "Give me BNB"
5. Wait ~30 seconds for tokens to arrive

You'll receive 0.1-0.5 tBNB, enough for hundreds of transactions.

### Getting TFET

**Option 1: $GIFT Agent (Recommended)**

Message the $GIFT agent on Agentverse:
1. Visit: [agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9)
2. Send message: `claim 0xYOUR_WALLET_ADDRESS`
3. Receive: 200 TFET + 0.001 tBNB (up to 3 claims)

**Option 2: Ask in Discord**

Join the Fetch.ai Discord and ask in the testnet channel.

---

## Common Questions

### "Why is my balance showing 0?"

- **Wrong network:** Make sure you're on BSC Testnet, not Ethereum or BSC Mainnet
- **Token not added:** For TFET, you need to add the token contract address
- **Transaction pending:** Wait a few seconds and refresh

### "My transaction is stuck/pending"

- **Insufficient gas:** You need tBNB to pay for any transaction
- **Network congestion:** Wait a few minutes (rare on testnet)
- **Try speeding up:** Click the pending transaction, then "Speed Up"

### "I sent to the wrong address"

Unfortunately, blockchain transactions are irreversible. Always:
- Double-check addresses before sending
- Send a small test amount first for large transfers
- Copy-paste addresses instead of typing

### "What's the difference between testnet and mainnet?"

| | Testnet | Mainnet |
|-|---------|---------|
| **Tokens** | Free, no value | Cost real money |
| **Purpose** | Testing and development | Real transactions |
| **Risk** | None (play money) | Real financial risk |
| **Addresses** | Same format | Same format |

Your same wallet address works on both, but they have separate balances.

### "Can I convert testnet tokens to real money?"

No. Testnet tokens (tBNB, TFET) have no value and cannot be exchanged for mainnet tokens or real money. They're purely for testing.

### "What's a contract address?"

It's the address of a smart contract (code living on the blockchain). For tokens like TFET, the contract address tells MetaMask which token you're talking about. The TFET contract is:
```
0x304ddf3eE068c53514f782e2341B71A80c8aE3C7
```

### "How do I see my transaction history?"

1. Go to [testnet.bscscan.com](https://testnet.bscscan.com)
2. Paste your wallet address in the search box
3. See all your transactions, token transfers, and balances

### "Why is FET on BNB Smart Chain and not its own network?"

FET actually exists on MULTIPLE networks:
- **Fetch.ai Network:** The native home (used for agent-to-agent payments)
- **BNB Smart Chain:** For trading and DeFi (where AgentLaunch lives)
- **Ethereum:** For trading on Ethereum DEXs

AgentLaunch uses BSC because it's cheap and fast. The FET on BSC is "bridged" from the native network — it has the same value but exists on BSC's infrastructure.

### "Do I need FET on the Fetch.ai network too?"

For AgentLaunch: No. Everything happens on BSC.

For running agents on Agentverse: Agents have their own wallets on the Fetch.ai network, but you don't need to fund them directly. The platform handles that.

### "How do I know which network I'm on?"

Look at the top of MetaMask — the network name is displayed prominently. Common indicators:

| You See | You're On |
|---------|-----------|
| "BNB Smart Chain Testnet" + tBNB | BSC Testnet (safe for testing) |
| "BNB Smart Chain" + BNB | BSC Mainnet (real money!) |
| "Ethereum Mainnet" + ETH | Wrong network for AgentLaunch |

Always double-check before sending transactions!

### "I have BNB but my transaction says 'insufficient funds for gas'"

Make sure you're on the right network:
- If you have BNB on **mainnet**, it won't work on **testnet**
- If you have tBNB on **testnet**, it won't work on **mainnet**

Switch to the network where you have funds.

---

## Quick Reference

### Key Addresses

| What | Address |
|------|---------|
| TFET Contract | `0x304ddf3eE068c53514f782e2341B71A80c8aE3C7` |
| $GIFT Agent Token | `0xF7e2F77f014a5ad3C121b1942968be33BA89e03c` |

### Useful Links

| Resource | URL |
|----------|-----|
| MetaMask | [metamask.io](https://metamask.io) |
| BSC Testnet Faucet | [testnet.bnbchain.org/faucet-smart](https://testnet.bnbchain.org/faucet-smart) |
| BSC Testnet Explorer | [testnet.bscscan.com](https://testnet.bscscan.com) |
| $GIFT Agent | [agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9) |

### Network Details

**BSC Testnet (for testing)**

| Setting | Value |
|---------|-------|
| Network Name | BNB Smart Chain Testnet |
| RPC URL | `https://data-seed-prebsc-1-s1.binance.org:8545/` |
| Chain ID | 97 |
| Currency | tBNB |
| Explorer | `https://testnet.bscscan.com` |

**BSC Mainnet (real money)**

| Setting | Value |
|---------|-------|
| Network Name | BNB Smart Chain |
| RPC URL | `https://bsc-dataseed.binance.org/` |
| Chain ID | 56 |
| Currency | BNB |
| Explorer | `https://bscscan.com` |

---

## Moving to Mainnet (Real Money)

Once you're comfortable with testnet, here's how to use real tokens:

### Getting Real BNB

You need BNB to pay for gas on BSC Mainnet:

1. **Buy on an exchange:** Binance, Coinbase, Kraken, etc.
2. **Withdraw to your MetaMask address:**
   - Copy your MetaMask address
   - On the exchange, go to Withdraw
   - Select BNB and choose "BEP-20" or "BSC" network (NOT BEP-2)
   - Paste your address and confirm

**Warning:** Always use BEP-20/BSC network when withdrawing to MetaMask. BEP-2 is a different network and won't show up!

### Getting Real FET

1. **Buy on an exchange:** Binance, Coinbase, Crypto.com
2. **Withdraw to MetaMask:**
   - Select FET and choose "BEP-20" or "BSC" network
   - Paste your MetaMask address
   - Confirm the withdrawal

Or buy directly on DEXs:
- [PancakeSwap](https://pancakeswap.finance) — swap BNB for FET
- [1inch](https://app.1inch.io) — finds best prices across DEXs

### Adding FET to MetaMask (Mainnet)

Same process as TFET, but use the mainnet contract:

1. Switch to "BNB Smart Chain" (mainnet, chain 56)
2. Click "Import tokens"
3. Enter the FET mainnet contract: `0x031b41e504677879370e9DBcF937283A8691Fa7f`
4. Click "Add Custom Token" then "Import Tokens"

### Cost Comparison

| Action | Testnet | Mainnet |
|--------|---------|---------|
| Deploy agent token | 120 TFET (free) | 120 FET (~$50-100) |
| Gas per transaction | ~0.0001 tBNB (free) | ~0.0001 BNB (~$0.05) |
| Graduation threshold | 30,000 TFET | 30,000 FET (~$15,000-25,000) |

### Safety Checklist

Before doing mainnet transactions:

- [ ] Triple-check you're on BSC Mainnet (chain 56)
- [ ] Verify the token contract address
- [ ] Start with small test amounts
- [ ] Keep your seed phrase offline and secure
- [ ] Never share your private key with anyone

---

## Visual Summary

Here's how everything connects:

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR WALLET                              │
│                    (One MetaMask, One Address)                   │
│                     0x742d35Cc6634...                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────────┐       ┌─────────────────────┐        │
│   │   BSC TESTNET       │       │   BSC MAINNET       │        │
│   │   (Chain ID: 97)    │       │   (Chain ID: 56)    │        │
│   │                     │       │                     │        │
│   │   tBNB (gas)        │       │   BNB (gas)         │        │
│   │   TFET (value)      │       │   FET (value)       │        │
│   │                     │       │                     │        │
│   │   FREE from faucet  │       │   Costs real $$$    │        │
│   └─────────────────────┘       └─────────────────────┘        │
│                                                                  │
│   Same address, DIFFERENT balances on each network              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                        AGENTLAUNCH                               │
│                  agent-launch.ai                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Deploy Agent Token ──────────────────────▶ 120 FET/TFET       │
│                                                                  │
│   Trade on Bonding Curve ──────────────────▶ 2% fee             │
│                                                                  │
│   Graduate to DEX ─────────────────────────▶ 30,000 FET/TFET    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

Now that you understand tokens:

1. **Set up MetaMask** and add BSC Testnet
2. **Get testnet tokens** from the faucet and $GIFT agent
3. **Try sending** a small amount between addresses
4. **Deploy an agent** using `npx agentlaunch`
5. **Tokenize it** and trade on [agent-launch.ai](https://agent-launch.ai)

Welcome to the AgentLaunch ecosystem!
