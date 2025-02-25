import type { PlayerInfo } from '~/types/lottery';

interface PlayerListProps {
  players: PlayerInfo[];
}

export default function PlayerList({ players }: PlayerListProps) {
  return (
    <div className='bg-gray-800 rounded-lg p-6 shadow-xl'>
      <h2 className='text-2xl font-bold mb-4'>参与者名单</h2>
      <div className='overflow-auto max-h-[600px]'>
        <table className='w-full'>
          <thead className='bg-gray-700'>
            <tr>
              <th className='px-4 py-2 text-left'>序号</th>
              <th className='px-4 py-2 text-left'>名称</th>
              <th className='px-4 py-2 text-left'>分数</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-700'>
            {players.map((player, index) => (
              <tr key={index} className='hover:bg-gray-700'>
                <td className='px-4 py-2'>{index + 1}</td>
                <td className='px-4 py-2'>{player.name}</td>
                <td className='px-4 py-2'>{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
