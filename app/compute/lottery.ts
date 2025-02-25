import { ethers } from 'ethers';
import type {
  Player,
  PlayerInfo,
  PlayerHash,
  Winner,
  LotteryResult,
} from '~/types/lottery';

// 使用更可靠的 Sepolia RPC
const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');

// 处理选手数据
export function processPlayers(rawData: any): PlayerInfo[] {
  const teamData: Player[] = Array.isArray(rawData[0])
    ? (rawData[0] as Player[])
    : (rawData as Player[]);

  return teamData
    .filter((player): player is Player =>
      Boolean(player && player.name && player.token)
    )
    .map((player) => ({
      name: player.name,
      token: player.token,
      score: player.score,
    }));
}

// 生成选手哈希
export function generatePlayerHashes(players: PlayerInfo[]): PlayerHash[] {
  return players.map((player) => ({
    name: player.name,
    hash: ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['string', 'string'],
        [player.name, player.token]
      )
    ),
  }));
}

// 抽奖主函数
export async function drawLottery(
  players: PlayerInfo[],
  onProgress?: (
    progress: number,
    currentBlock: number,
    targetBlock: number,
    blocksLeft: number
  ) => void
): Promise<LotteryResult> {
  const playerHashes = generatePlayerHashes(players);

  // 获取当前区块
  const currentBlock = await provider.getBlockNumber();
  const futureBlockNumber = currentBlock + 2;

  // 等待目标区块
  let randomBlock = null;
  const maxAttempts = 60;
  let attempts = 0;

  while (!randomBlock && attempts < maxAttempts) {
    try {
      const latestBlock = await provider.getBlockNumber();
      const blocksLeft = futureBlockNumber - latestBlock;
      const progress = Math.min(
        1,
        (latestBlock - currentBlock) / (futureBlockNumber - currentBlock)
      );

      // 修改这里，传递更多信息
      if (onProgress) {
        onProgress(progress, latestBlock, futureBlockNumber, blocksLeft);
      }

      if (latestBlock >= futureBlockNumber) {
        randomBlock = await provider.getBlock(futureBlockNumber);
        if (!randomBlock || !randomBlock.hash) {
          throw new Error('获取区块哈希失败');
        }
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
  }

  if (!randomBlock || !randomBlock.hash) {
    throw new Error('无法获取目标区块，请稍后重试');
  }

  const blockHash = randomBlock.hash;

  // 计算最终排序值
  const finalResults: Winner[] = playerHashes.map((player) => {
    const finalHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['bytes32', 'bytes32'],
        [player.hash, blockHash]
      )
    );
    return {
      name: player.name,
      sortValue: BigInt(finalHash),
    };
  });

  // 排序并选出前20名
  const winners = finalResults
    .sort((a, b) => (a.sortValue < b.sortValue ? -1 : 1))
    .slice(0, 20);

  // 返回结果
  return {
    blockNumber: futureBlockNumber,
    blockHash: blockHash,
    timestamp: new Date().toISOString(),
    winners: winners.map((w) => w.name),
  };
}

// 验证抽奖结果
export async function verifyLottery(
  result: LotteryResult,
  players: PlayerInfo[]
): Promise<boolean> {
  try {
    // 1. 验证区块哈希
    const block = await provider.getBlock(result.blockNumber);
    if (!block || block.hash !== result.blockHash) {
      return false;
    }

    // 2. 重新计算获奖名单
    const playerHashes = generatePlayerHashes(players);
    const finalResults: Winner[] = playerHashes.map((player) => ({
      name: player.name,
      sortValue: BigInt(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes32', 'bytes32'],
            [player.hash, result.blockHash]
          )
        )
      ),
    }));

    // 3. 排序并获取前20名
    const calculatedWinners = finalResults
      .sort((a, b) => (a.sortValue < b.sortValue ? -1 : 1))
      .slice(0, 20)
      .map((w) => w.name);

    // 4. 比较结果
    return JSON.stringify(calculatedWinners) === JSON.stringify(result.winners);
  } catch (error) {
    console.error('验证失败:', error);
    return false;
  }
}
