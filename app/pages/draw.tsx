import { useState, useEffect } from 'react';
import { useLoaderData } from 'react-router';
import { processPlayers, drawLottery } from '~/compute/lottery';
import type { PlayerInfo, LotteryResult } from '~/types/lottery';

export async function loader() {
  // Use window.location.origin to get the base URL in browser environment
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173';
  const response = await fetch(`${baseUrl}/team.json`);
  const data = await response.json();
  const processedPlayers = processPlayers(data);
  return { players: processedPlayers };
}

// 删除 getProgressBar 函数，不再使用字符串方式显示进度

export default function Lottery() {
  const { players } = useLoaderData() as { players: PlayerInfo[] };
  const [progress, setProgress] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [targetBlock, setTargetBlock] = useState(0);
  const [blocksLeft, setBlocksLeft] = useState(0);
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDraw = async () => {
    setLoading(true);
    try {
      const result = await drawLottery(
        players,
        (progress, current, target, left) => {
          setProgress(progress * 100);
          setCurrentBlock(current);
          setTargetBlock(target);
          setBlocksLeft(left);
        }
      );
      setResult(result);
    } catch (error) {
      console.error('抽奖失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-4xl font-bold text-center mb-8'>HGAME抽奖</h1>

        {/* 使用 grid 实现响应式布局 */}
        <div className='grid place-items-center'>
          {/* 右侧/下方抽奖区域 */}
          <div className='w-full max-w-2xl space-y-8'>
            <div className='bg-gray-800 rounded-lg p-8 shadow-xl backdrop-blur-lg border border-gray-700/50'>
              <div className='text-center'>
                <div className='inline-flex items-center px-4 py-2 bg-gray-700/50 rounded-full mb-6'>
                  <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2'></div>
                  <p className='text-lg'>符合抽奖条件人数: {players.length}</p>
                </div>

                {loading ? (
                  <div className='space-y-8'>
                    <div className='text-center space-y-6'>
                      <div className='text-4xl font-bold mb-8 text-gray-500 animate-pulse'>
                        抽奖进行中...
                      </div>

                      <div className='relative pt-4'>
                        <div className='flex justify-between text-sm text-gray-400 mb-2'>
                          <span>进度</span>
                          <span>{progress.toFixed(1)}%</span>
                        </div>
                        <div className='w-full h-3 bg-gray-700/50 rounded-full overflow-hidden'>
                          <div
                            className='h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-yellow-400 to-orange-500'
                            style={{ width: `${progress}%` }}
                          >
                            <div className='w-full h-full opacity-75 bg-sparkle animate-shine'></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDraw}
                    className='group relative w-full bg-orange-500 text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 
                    shadow-[0_8px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] 
                    ease-out hover:translate-y-1 transform-gpu text-xl overflow-hidden active:shadow-none active:translate-y-2'
                  >
                    <span className='relative z-10 flex items-center justify-center'>
                      <svg
                        className='w-6 h-6 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 6v6m0 0v6m0-6h6m-6 0H6'
                        />
                      </svg>
                      开始抽奖
                    </span>
                  </button>
                )}
              </div>
            </div>

            {result && (
              <div className='bg-gray-800 rounded-lg p-8 shadow-xl border border-gray-700/50'>
                <div className='flex items-center justify-center space-x-3 mb-8'>
                  <span className='text-4xl'>🎉</span>
                  <h2 className='text-3xl font-bold text-orange-500'>
                    中奖名单
                  </h2>
                  <span className='text-4xl'>🎉</span>
                </div>
                <div className='grid grid-cols-2 gap-4 mb-8'>
                  {result.winners.map((winner, index) => (
                    <div
                      key={index}
                      className='bg-gray-700/50 backdrop-blur rounded-xl p-6 text-center transform hover:scale-[1.02] transition duration-300 border border-gray-600/50'
                    >
                      <div className='text-orange-500 font-bold text-xl mb-2'>
                        #{index + 1}
                      </div>
                      <p className='text-lg font-medium text-white'>{winner}</p>
                    </div>
                  ))}
                </div>
                <div className='flex flex-col space-y-4 text-center text-sm text-gray-400 p-4 bg-gray-700/30 rounded-xl'>
                  <div className='space-y-2'>
                    <p className='flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M13 10V3L4 14h7v7l9-11h-7z'
                        />
                      </svg>
                      区块号: {result.blockNumber}
                    </p>
                    <p className='truncate'>区块哈希: {result.blockHash}</p>
                    <p className='flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      {new Date(result.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const jsonStr = JSON.stringify(result, null, 2);
                      const blob = new Blob([jsonStr], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `lottery-result-${result.blockNumber}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className='group relative w-full bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 
                    shadow-[0_4px_0_rgb(75,85,99)] hover:shadow-[0_2px_0_rgb(75,85,99)]
                    ease-out hover:translate-y-1 transform-gpu text-sm overflow-hidden active:shadow-none active:translate-y-2'
                  >
                    <span className='relative z-10 flex items-center justify-center'>
                      <svg
                        className='w-4 h-4 mr-2'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                        />
                      </svg>
                      下载抽奖结果
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
