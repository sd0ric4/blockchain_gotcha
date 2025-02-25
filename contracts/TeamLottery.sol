// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TeamLottery {
    struct Player {
        string name;
        string token;
        uint256 score;
        bytes32 playerHash;
    }

    address public owner;
    Player[] public players;
    bool public lotteryOpen;
    uint256 public constant WINNERS_COUNT = 20;

    // 抽奖结果
    string[] public winners;
    bytes32 public usedBlockHash;
    uint256 public usedBlockNumber;

    event PlayerRegistered(string name, bytes32 playerHash);
    event LotteryCompleted(string[] winners, bytes32 blockHash);

    constructor() {
        owner = msg.sender;
        lotteryOpen = true;
    }

    // Internal function for registering a player
    function registerPlayer(
        string memory name,
        string memory token,
        uint256 score
    ) internal {
        require(lotteryOpen, "Lottery is closed");

        // 计算玩家哈希（与 JS 版本相同的逻辑）
        bytes32 playerHash = keccak256(abi.encode(name, token));

        players.push(
            Player({
                name: name,
                token: token,
                score: score,
                playerHash: playerHash
            })
        );

        emit PlayerRegistered(name, playerHash);
    }

    // External function for single player registration
    function addPlayer(
        string memory name,
        string memory token,
        uint256 score
    ) external {
        require(msg.sender == owner, "Only owner can register players");
        registerPlayer(name, token, score);
    }

    // Batch registration remains the same
    function batchRegisterPlayers(
        string[] memory names,
        string[] memory tokens,
        uint256[] memory scores
    ) external {
        require(msg.sender == owner, "Only owner can register players");
        require(
            names.length == tokens.length && tokens.length == scores.length,
            "Arrays length mismatch"
        );

        for (uint i = 0; i < names.length; i++) {
            registerPlayer(names[i], tokens[i], scores[i]);
        }
    }

    // 执行抽奖
    function drawLottery() external {
        require(msg.sender == owner, "Only owner can draw lottery");
        require(lotteryOpen, "Lottery already completed");
        require(players.length >= WINNERS_COUNT, "Not enough players");

        // 使用当前区块哈希作为随机源
        bytes32 blockHash = blockhash(block.number - 1);
        require(blockHash != 0, "Block hash not available");

        // 计算每个玩家的最终哈希值并排序
        uint256[] memory indices = new uint256[](players.length);
        bytes32[] memory finalHashes = new bytes32[](players.length);

        for (uint256 i = 0; i < players.length; i++) {
            indices[i] = i;
            finalHashes[i] = keccak256(
                abi.encode(players[i].playerHash, blockHash)
            );
        }

        // 排序（冒泡排序）
        for (uint256 i = 0; i < WINNERS_COUNT; i++) {
            for (uint256 j = 0; j < players.length - i - 1; j++) {
                if (uint256(finalHashes[j]) > uint256(finalHashes[j + 1])) {
                    // 交换哈希值
                    bytes32 tempHash = finalHashes[j];
                    finalHashes[j] = finalHashes[j + 1];
                    finalHashes[j + 1] = tempHash;

                    // 交换索引
                    uint256 tempIndex = indices[j];
                    indices[j] = indices[j + 1];
                    indices[j + 1] = tempIndex;
                }
            }
        }

        // 记录获奖者
        winners = new string[](WINNERS_COUNT);
        for (uint256 i = 0; i < WINNERS_COUNT; i++) {
            winners[i] = players[indices[i]].name;
        }

        usedBlockHash = blockHash;
        usedBlockNumber = block.number - 1;
        lotteryOpen = false;

        emit LotteryCompleted(winners, blockHash);
    }

    // 获取所有获奖者
    function getWinners() external view returns (string[] memory) {
        require(!lotteryOpen, "Lottery not completed yet");
        return winners;
    }

    // 获取参与者数量
    function getPlayersCount() external view returns (uint256) {
        return players.length;
    }
}
