export function formatZolanaError(cause: unknown): string {
  if (!cause) return 'Could not complete the private payment.';

  if (typeof cause === 'string') {
    return translateCode(cause) ?? cause;
  }

  if (typeof cause === 'object') {
    const err = cause as {
      message?: string;
      code?: string;
      causeCode?: string;
      causeCodes?: string[];
      details?: Record<string, unknown>;
      cause?: unknown;
    };

    // Check inner cause codes first (they represent the actual underlying failure)
    const allCodes: string[] = [];
    if (Array.isArray(err.causeCodes)) allCodes.push(...err.causeCodes);
    if (typeof err.causeCode === 'string') allCodes.push(err.causeCode);
    if (typeof err.code === 'string') allCodes.push(err.code);
    if (typeof err.message === 'string') allCodes.push(err.message);

    for (const c of allCodes) {
      const translated = translateCode(c);
      if (translated) return translated;
    }

    // Check nested cause object if present
    if (err.cause) {
      const nested = formatZolanaError(err.cause);
      if (nested && !nested.startsWith('WALLET_') && !nested.startsWith('RING_') && !nested.startsWith('CLIENT_')) {
        return nested;
      }
    }

    if (err.message && !err.message.startsWith('WALLET_') && !err.message.startsWith('RING_') && !err.message.startsWith('CLIENT_')) {
      return err.message;
    }
  }

  return 'Could not build private transfer. If you recently deposited USDC, please wait a moment for the Helius indexer to confirm and refresh your balance.';
}

function translateCode(code: string): string | null {
  switch (code) {
    case 'WALLET_INSUFFICIENT_BALANCE':
      return 'Your private USDC balance is insufficient for this payment. If you recently deposited, please wait 15–30 seconds for Helius to index your deposit and refresh your balance.';
    case 'WALLET_RECIPIENT_NOT_REGISTERED':
      return 'The recipient has not registered their SwiftPay private wallet yet. They must sign in to SwiftPay to receive private transfers.';
    case 'WALLET_MULTIPLE_INPUT_TREES':
      return 'Your private balance notes are spread across multiple trees. Please refresh your balance or deposit a new note to consolidate.';
    case 'WALLET_NO_INPUTS':
    case 'WALLET_UNSIGNED_INPUT_UNAVAILABLE':
    case 'WALLET_INPUT_UTXO_UNAVAILABLE':
      return 'No spendable private USDC notes were found. If you recently deposited, please refresh your balance in a moment and try again.';
    case 'WALLET_INVALID_AMOUNT':
      return 'Please enter a valid transfer amount greater than 0.';
    case 'TRANSACTION_ED25519_PAYER_MISMATCH':
    case 'CLIENT_FEE_PAYER_MISMATCH':
      return 'Wallet account mismatch. Please disconnect and sign in again.';
    case 'CLIENT_RPC':
      return 'Solana devnet RPC is taking longer than usual to respond. Please try again.';
    case 'CLIENT_INDEXER_TIMEOUT':
      return 'Helius indexer is still processing your transaction. Please wait a few seconds and refresh.';
    case 'WALLET_BUILD_TRANSFER':
      return 'Could not build private transfer. If you recently deposited USDC, please wait 15–30 seconds for the Helius indexer to confirm, then click "Sign and send" again.';
    case 'WALLET_BUILD_DEPOSIT':
      return 'Could not prepare the deposit. Please make sure you have sufficient USDC and Devnet SOL.';
    default:
      if (code.startsWith('WALLET_') || code.startsWith('RING_') || code.startsWith('CLIENT_')) {
        return 'Could not build private transfer. If you recently deposited USDC, please wait 15–30 seconds for the Helius indexer to confirm, then click "Sign and send" again.';
      }
      return null;
  }
}
