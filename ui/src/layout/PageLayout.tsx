import * as React from 'react';
import { PageHeader } from 'antd';
import { useRouter } from 'next/router';
import { HomeOutlined } from '@ant-design/icons';
import { statusTag } from '../components/utils';
import { useBucketContext } from '../components/buckets/BucketsContext';
import { useOrbitDbContext } from '../components/orbitdb';
import Link from 'next/link';

type EntityStatusProps = {
  title: string,
  isReady: boolean
}

const EntityStatus = ({ title, isReady }: EntityStatusProps) => statusTag(title, isReady)

export const PageLayout = ({ children }: React.PropsWithChildren<{}>) => {
  const router = useRouter()

  const { isReady: isBucket } = useBucketContext()
  const { isReady: isOrbitDb } = useOrbitDbContext()

  const isAppReady = isBucket && isOrbitDb

  const orbitDBStatus = <EntityStatus title='OrbitDB' isReady={isOrbitDb} />
  const bucketStatus = <EntityStatus title='Buckets' isReady={isBucket} />

  return <>
    <PageHeader
      title={<span className='d-flex w-50'>{orbitDBStatus}{bucketStatus}</span>}
      subTitle={<>
        <Link href='/myspaces' as='/myspaces'><a className='mr-3 ant-btn'>My spaces</a></Link>
        <Link href='/myspaces/follow' as='/myspaces/follow'><a className='mr-3 ant-btn'>My following spaces</a></Link>
      </>}
      style={{ borderBottom: '1px solid #ddd' }}
      onBack={() => router.push('/', '/')}
      backIcon={<HomeOutlined />}
    />
    <div className='PageContent'>
      {isAppReady && children}
    </div>
  </>
}

export default PageLayout