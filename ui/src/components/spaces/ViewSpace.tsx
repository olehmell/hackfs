import * as React from 'react';
import { useRouter } from 'next/router';
import { SpaceDto } from './types';
import { Loading, IconText } from '../utils';
import { Avatar, Empty, Card } from 'antd';
import { NextPage } from 'next';
import { useSpaceStoreContext } from './SpaceContext';
import Jdenticon from 'react-jdenticon';
import DynamicPosts from '../posts/Posts';
import Link from 'next/link';
import { CSSProperties } from 'react';
import Meta from 'antd/lib/card/Meta';
import { EditOutlined } from '@ant-design/icons';

type ViewSpaceProps = {
  space: SpaceDto,
  isPreview?: boolean
}

type SpaceLinkProps = {
  id: string,
  children: React.ReactNode,
  className?: string,
  style?: CSSProperties
}
const SpaceLink = ({ id, children, className, style }: SpaceLinkProps) => <Link href='/spaces/[spaceId]' as={`/spaces/${id}`} >
  <a className={className} style={style}>
    {children}
  </a>
</Link>

export const ViewSpace = ({ space: { id, owner, content: { avatar, desc, title } }, isPreview }: ViewSpaceProps) => {
  const editLink = <Link href='/spaces/[spaceId]/edit' as={`/spaces/${id}/edit`}>
    <a style={{ color: '#8c8c8c' }}>
      <IconText icon={EditOutlined} text='Edit' key='space-edit' />
    </a>
  </Link>

  const viewSpace = <Card style={{ width: '100%', marginTop: 16 }} >
    <Meta
      avatar={
        <Avatar size={54} src={avatar} icon={avatar && <Jdenticon value={owner} />} />
      }
    title={<span className='d-flex justify-content-between'><span>{title}</span>{editLink}</span>}
    description={desc}
    />
  </Card>

  return isPreview ? <SpaceLink id={id}>{viewSpace}</SpaceLink> : viewSpace
}

const SpacePage: NextPage<ViewSpaceProps> = ({ space }: ViewSpaceProps) => {
  return <div className='SpacePage'>
    <ViewSpace space={space} />
    <DynamicPosts />
  </div>
}

export function withLoadSpaceFromUrl (
  Component: React.ComponentType<ViewSpaceProps>
) {
  return function (props: ViewSpaceProps): React.ReactElement<ViewSpaceProps> {
    const { spaceStore } = useSpaceStoreContext()
    const spaceId = useRouter().query.spaceId as string
    const [ isLoaded, setIsLoaded ] = React.useState(false)
    const [ space, setSpace ] = React.useState<SpaceDto>()

    React.useEffect(() => {
      const loadSpace = async () => {
        const post = await spaceStore.get(spaceId).pop()
        post && setSpace(post)
        setIsLoaded(true)
      }
      loadSpace().catch(err => console.error('Failed load space from OrbitDB:', err))
    })

    if (!isLoaded) return <Loading label='Loading the space...' />

    if (!space) return <Empty description='Space not found' />

    return <Component {...props} space={space} />
  }
}

export const DynamicSpace = withLoadSpaceFromUrl(SpacePage)

export default DynamicSpace