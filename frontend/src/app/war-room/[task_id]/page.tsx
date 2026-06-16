import dynamic from 'next/dynamic'
import WarRoomInner from '@/components/war-room/WarRoomInner'

const WarRoom = dynamic(() => Promise.resolve(WarRoomInner), { ssr: false })

interface PageProps {
  params: Promise<{ task_id: string }>
}

export default async function WarRoomPage({ params }: PageProps) {
  const { task_id } = await params
  return <WarRoom taskId={task_id} />
}
