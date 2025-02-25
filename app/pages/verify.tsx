import { useState } from 'react';
import { useLoaderData } from 'react-router';
import { processPlayers, verifyLottery } from '~/compute/lottery';
import type { PlayerInfo, LotteryResult } from '~/types/lottery';

export async function loader() {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:5173';
  const response = await fetch(`${baseUrl}/team.json`);
  const data = await response.json();
  const processedPlayers = processPlayers(data);
  return { players: processedPlayers };
}

export default function Verify() {
  const { players } = useLoaderData() as { players: PlayerInfo[] };
  const [result, setResult] = useState<LotteryResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<boolean | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        setResult(content);
      } catch (error) {
        console.error('JSON解析失败:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleVerify = async () => {
    if (!result) return;
    setVerifying(true);
    try {
      const isValid = await verifyLottery(result, players);
      setVerified(isValid);
    } catch (error) {
      console.error('验证失败:', error);
      setVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8'>
      <div className='max-w-7xl mx-auto'>
        <h1 className='text-4xl font-bold text-center mb-8'>验证抽奖结果</h1>

        <div className='grid place-items-center'>
          <div className='w-full max-w-2xl space-y-8'>
            <div className='bg-gray-800 rounded-lg p-8 shadow-xl backdrop-blur-lg border border-gray-700/50'>
              <div className='space-y-6'>
                <div className='flex items-center justify-center w-full'>
                  <label
                    htmlFor='file-upload'
                    className='group relative w-full bg-gray-600 text-white font-bold py-6 px-8 rounded-xl transition-all duration-200 
                    shadow-[0_8px_0_rgb(75,85,99)] hover:shadow-[0_4px_0_rgb(75,85,99)] 
                    ease-out hover:translate-y-1 transform-gpu text-xl overflow-hidden active:shadow-none active:translate-y-2 cursor-pointer text-center'
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
                          d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L7 8m4-4v12'
                        />
                      </svg>
                      上传结果文件
                    </span>
                    <input
                      id='file-upload'
                      type='file'
                      accept='.json'
                      className='hidden'
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {result && (
                  <div className='space-y-4'>
                    <div className='text-sm text-gray-400 space-y-2'>
                      <p>区块号: {result.blockNumber}</p>
                      <p className='truncate'>区块哈希: {result.blockHash}</p>
                      <p>
                        时间戳: {new Date(result.timestamp).toLocaleString()}
                      </p>
                      <p>获奖人数: {result.winners.length}</p>
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      className='group relative w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 
                      shadow-[0_6px_0_rgb(194,65,12)] hover:shadow-[0_3px_0_rgb(194,65,12)] 
                      ease-out hover:translate-y-1 transform-gpu overflow-hidden active:shadow-none active:translate-y-2
                      disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span className='relative z-10 flex items-center justify-center'>
                        {verifying ? '验证中...' : '开始验证'}
                      </span>
                    </button>

                    {verified !== null && (
                      <div
                        className={`text-center p-4 rounded-lg ${
                          verified
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {verified ? '✅ 验证通过' : '❌ 验证失败'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
