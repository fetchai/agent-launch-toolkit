# Exporting Your Private Key from MetaMask

Your private key is needed to execute on-chain trades (`agentlaunch buy` / `agentlaunch sell`) without the browser handoff flow.

> **Security warning:** Your private key gives full control of your wallet. Never share it. Never commit it to git. The `.env` file is already in `.gitignore`.

## MetaMask Extension (Desktop)

1. Open MetaMask in your browser
2. Click the **three vertical dots** (⋮) next to the account you want to export
3. Select **Account details**
4. Click **Private key**
5. Enter your MetaMask password to confirm
6. **Hold to reveal** — click and hold the button to display your key
7. Click the copy icon to copy the key (starts with `0x`)
8. Click **Done**

## MetaMask Mobile

1. Tap the **account selector** at the top of the wallet view
2. Tap the **three dots** (⋯) next to the account you want to export
3. Tap **Private keys**
4. Enter your MetaMask password to confirm
5. Tap the copy icon next to the desired network

## Add to Your Environment

Paste the key into your `.env` file:

```bash
WALLET_PRIVATE_KEY=0xabc123...your_private_key_here
```

Or export it in your shell:

```bash
export WALLET_PRIVATE_KEY=0xabc123...
```

## Testnet Recommendation

For testing, use a **dedicated testnet wallet** — don't use your main wallet with real funds. Create a fresh account in MetaMask just for BSC Testnet development.

To fund your testnet wallet:
- **TFET:** Message the [$GIFT agent](https://agentverse.ai/agents/details/agent1q2d0n5tp563wr0ugj9cmcqms9jfv5ks63xy5vg3evy5gy0z52e66xmeyyw9) with `claim 0xYourAddress` (gives 150 TFET + 0.01 tBNB)
- **tBNB:** Use the [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart)

## Verify It Works

```bash
# Preview a trade (no private key needed)
npx agentlaunch buy 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c --amount 10 --dry-run

# Execute a real trade (requires WALLET_PRIVATE_KEY)
npx agentlaunch buy 0xF7e2F77f014a5ad3C121b1942968be33BA89e03c --amount 1
```

## Reference

- [MetaMask: How to export a private key](https://support.metamask.io/configure/accounts/how-to-export-an-accounts-private-key)
