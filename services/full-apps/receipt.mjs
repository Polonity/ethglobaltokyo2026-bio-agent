import { Interface, formatUnits } from 'ethers';
const erc20 = new Interface(['event Transfer(address indexed from,address indexed to,uint256 value)']);
export function tokenTransfers(receipt, tokens) {
  return receipt.logs.flatMap((log) => {
    const token = tokens.find((t) => t.address.toLowerCase() === log.address.toLowerCase());
    if (!token || log.topics[0] !== erc20.getEvent('Transfer').topicHash) return [];
    const event = erc20.parseLog(log);
    return [
      {
        token: log.address,
        symbol: token.symbol,
        decimals: token.decimals,
        from: event.args.from,
        to: event.args.to,
        rawAmount: String(event.args.value),
        amount: formatUnits(event.args.value, token.decimals),
      },
    ];
  });
}
