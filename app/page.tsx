import HomeExperience from '@/components/home/HomeExperience';
import { getInspirationPool } from '@/lib/arena';

export const revalidate = 3600;

export default async function Home() {
  const pool = await getInspirationPool();
  return <HomeExperience pool={pool} />;
}
