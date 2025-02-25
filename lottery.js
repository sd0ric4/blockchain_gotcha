import { ethers } from 'ethers';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取team.json
const rawData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'public/team.json'), 'utf8')
);

// 确保我们正确获取数组数据
const teamData = Array.isArray(rawData[0]) ? rawData[0] : rawData;
console.log('数据类型:', typeof teamData);
console.log('是否为数组:', Array.isArray(teamData));
console.log('数据长度:', teamData.length);

// 提取选手信息并过滤掉无效数据
const players = teamData
  .filter((player) => player && player.name && player.token)
  .map((player) => ({
    name: player.name,
    token: player.token,
    score: player.score, // 添加分数信息
  }));

console.log(`总共有效参与者: ${players.length} 人`);
console.log('第一个有效参与者示例:', players[0]);

// 生成选手哈希
const playerHashes = players.map((player) => ({
  name: player.name,
  hash: ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'string'],
      [player.name, player.token]
    )
  ),
}));

// 使用更可靠的 Sepolia RPC
const provider = new ethers.JsonRpcProvider('https://sepolia.drpc.org');

async function drawLottery() {
  // 获取当前区块
  const currentBlock = await provider.getBlockNumber();
  const futureBlockNumber = currentBlock + 10; // 改为只等待10个区块
  console.log(`当前区块: ${currentBlock}`);
  console.log(`目标区块: ${futureBlockNumber}`);
  console.log('等待新区块被挖出...\n');

  // 等待目标区块（添加轮询机制）
  let randomBlock = null;
  const maxAttempts = 60; // 增加最大尝试次数
  let attempts = 0;

  // 添加进度条
  const progressChar = '█';
  const emptyChar = '░';
  const progressWidth = 30;

  while (!randomBlock && attempts < maxAttempts) {
    try {
      const latestBlock = await provider.getBlockNumber();
      const blocksLeft = futureBlockNumber - latestBlock;
      const progress = Math.min(
        1,
        (latestBlock - currentBlock) / (futureBlockNumber - currentBlock)
      );
      const progressBlocks = Math.floor(progress * progressWidth);

      // 清除上一行
      process.stdout.write('\x1B[1A\x1B[2K');

      // 显示进度条
      console.log(
        `[${progressChar.repeat(progressBlocks)}${emptyChar.repeat(
          progressWidth - progressBlocks
        )}] ` + `${Math.floor(progress * 100)}% (还需等待 ${blocksLeft} 个区块)`
      );

      if (latestBlock >= futureBlockNumber) {
        randomBlock = await provider.getBlock(futureBlockNumber);
        if (!randomBlock || !randomBlock.hash) {
          throw new Error('获取区块哈希失败');
        }
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // 每3秒检查一次
      attempts++;
    } catch (error) {
      console.log('等待区块时发生错误:', error);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }
  }

  if (!randomBlock || !randomBlock.hash) {
    throw new Error('无法获取目标区块，请稍后重试');
  }

  const blockHash = randomBlock.hash;
  console.log(`成功获取区块 ${futureBlockNumber} 的哈希:`, blockHash);

  // 计算最终排序值
  const finalResults = playerHashes.map((player) => {
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

  // 输出结果
  console.log('\n中奖名单：');
  winners.forEach((winner, index) => {
    console.log(`${index + 1}. ${winner.name}`);
  });

  // 保存抽奖结果
  const result = {
    blockNumber: futureBlockNumber,
    blockHash: blockHash,
    timestamp: new Date().toISOString(),
    winners: winners.map((w) => w.name),
  };

  fs.writeFileSync('lottery_result.json', JSON.stringify(result, null, 2));
  console.log('\n抽奖结果已保存到 lottery_result.json');
}

// 运行抽奖
drawLottery().catch((error) => {
  console.error('抽奖过程发生错误:', error);
  process.exit(1);
});
