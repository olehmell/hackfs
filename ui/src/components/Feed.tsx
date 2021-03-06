import React, { useState, useEffect } from 'react';
import { PostDto } from './posts/types';
import { PostsList } from './posts/Posts';
import { pluralize, Loading, getIdFromFullPath } from './utils';
import { useOrbitDbContext, openStore, openIdCounter } from './orbitdb';
import EventStore from 'orbit-db-eventstore';
import { useFollowSpaceStoreContext } from './spaces/FollowSpaceContext';
import { PostStore } from './posts/PostsContext';

type Feed = EventStore<PostDto>

export const Feed = () => {
  const { followSpaceStore } = useFollowSpaceStoreContext()
  const { orbitdb } = useOrbitDbContext()
  const [ posts, setPosts ] = useState<PostDto[] | undefined>()

  useEffect(() => {
    const loadFeed = async () => {
      const followSpace = followSpaceStore.get('')

      const feed: Feed = await orbitdb.eventlog('feed')

      await feed.load()

      console.log('Init a feed')

      for (const { spacePath, lastKnownPostId, links } of followSpace) {

        const postStore = await openStore<PostStore>(orbitdb, links.postStore)
        const postIdCounter = await openIdCounter(orbitdb, links.postIdCounter || '')

        await postStore.load()
        await postIdCounter.load()

        const { value: lastPostId } = postIdCounter

        if (lastKnownPostId < lastPostId) {

          const ids: string[] = []
          for (let i = lastKnownPostId + 1; i <= lastPostId; i++) {
            ids.push(i.toString())
          }
  
          const posts = postStore.query(({ path }) => ids.includes(getIdFromFullPath(path))).sort((a, b) => b.created.time - a.created.time)

          for (const post of posts) {
            await feed.add(post)
          }
  
          followSpaceStore.put({ spacePath, lastKnownPostId: lastPostId })
        }

        postStore.close()
        postIdCounter.close()

        console.log('Success calculate feed')
      }

      setPosts(feed.iterator({ limit: -1 })
      .collect()
      .map((e) => e.payload.value))

      feed.close()
    }
    loadFeed().catch(err => console.error(err))
  }, [])

  return posts
    ? <PostsList
        posts={posts}
        header={<h2>
          {pluralize(posts.length, 'post in your feed')}
        </h2>}
      />
    : <Loading label='Calculate feed...'/>;
}