import React, { useState } from 'react'
import { Comment, Avatar, Form, Button, Input } from 'antd';
import { CommentDto, CommentValue } from './types';
import { useOrbitDbContext } from '../orbitdb';
import { useCommentsContext } from './СommentContext';
import Jdenticon from 'react-jdenticon';

const { TextArea } = Input;

type EditorProps = {
  value?: string,
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void,
  onSubmit?: () => void,
  submitting?: boolean
}

const Editor = ({ onChange, onSubmit, submitting, value = '' }: EditorProps) => {
  const { state: { isReady } } = useCommentsContext()
  return <>
    <Form.Item>
      <TextArea rows={4} onChange={onChange} value={value} />
    </Form.Item>
    <Form.Item>
      <Button htmlType="submit" loading={submitting || !isReady} disabled={!isReady} onClick={onSubmit} type="primary">
        Add Comment
      </Button>
    </Form.Item>
  </>
};

type CommentEditorProps = {
  onCommentAdded?: (comment: CommentDto) => void,
  parentId?: string | null
}

export const CommentEditor = ({ parentId = null, onCommentAdded }: CommentEditorProps) => {
  const [ submitting, setSubmitting ] = useState(false)
  const [ value, setValue ] = useState('')

  const { owner } = useOrbitDbContext()
  const { state: { commentStore } } = useCommentsContext()

  const addComment = async (body: string) => {
    const comment: CommentValue = {
      owner,
      body: body?.trim(),
      created: {
        account: owner,
        time: new Date().getTime()
      },
      parentId
    }
    const hash = await commentStore.add(comment)
    console.log('Added to OrbitDB log under hash:', hash)

    const storedComment = { id: hash, ...comment }
    onCommentAdded && onCommentAdded(storedComment)
  }

  const handleSubmit = async () => {
    if (!value) {
      return;
    }

    setSubmitting(true);
    
    await addComment(value)
    
    setSubmitting(false)
    setValue('')
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    setValue(e.target.value)
  };

  return <Comment
  avatar={
    <Avatar icon={<Jdenticon value={owner}/>} />
  }
  content={
    <Editor
      onChange={handleChange}
      onSubmit={handleSubmit}
      value={value}
      submitting={submitting}
    />
  }
/>
}

export default CommentEditor