import React, { useState, useEffect } from 'react'
import { Form, Input, Empty, Button, notification } from 'antd'
import { useRouter } from 'next/router'
import { SpaceDto, SpaceContent } from './types'
import TextArea from 'antd/lib/input/TextArea'
import { maxLenError, minLenError, TITLE_MIN_LEN, TITLE_MAX_LEN, DESC_MAX_LEN } from '../utils'
import { useOrbitDbContext } from '../orbitdb'
import { useSpaceStoreContext } from './SpaceContext'
import { BucketDragDrop } from '../drag-drop'
import { FormInstance } from 'antd/lib/form'

const layout = {
  labelCol: { span: 4 },
  wrapperCol: { span: 20 },
};

type Content = SpaceContent

type FormValues = Partial<Content> & {
  spaceId?: string
}

type FieldName = keyof FormValues

const fieldName = (name: FieldName): FieldName => name

type FormProps ={
  space?: SpaceDto
}

function getInitialValues ({  space }: FormProps): FormValues {
  if (space) {
    return { ...space.content }
  }
  return {}
}

export const isValidForm = async (form: FormInstance) => {
  try {
    await form.validateFields()
    const isChanged = form.isFieldsTouched()
    if (!isChanged) {
      notification.info({
        message: 'Nothing to update',
        description: 'Form has not been changed'
      })
    }
    return isChanged
  } catch (err) {
    // Form is invalid
    notification.error({
      message: 'Form is invalid',
      description: 'Fix form errors and try again'
    })
    return false
  }
}

export function InnerForm (props: FormProps) {
  const { space } = props
  const [ submitting, setSubmitting ] = useState(false)
  const [ form ] = Form.useForm()
  const router = useRouter()

  const { owner } = useOrbitDbContext()
  const { spaceStore, nextSpaceId } = useSpaceStoreContext()

  const isNew = !space

  const editType = isNew ? 'New' : 'Edit'

  const initialValues = getInitialValues({ space })

  const getFieldValues = (): FormValues => {
    return form.getFieldsValue() as FormValues
  }

  const fieldValuesToContent = (): Content => {
    return getFieldValues() as Content
  }

  const goToView = (spaceId: string) => {
    router.push('/spaces/[spaceId]', `/spaces/${spaceId}`)
      .catch(err => console.error(`Failed to redirect to a space page. ${err}`))
  }

  const onBodyChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    form.setFieldsValue({ [fieldName('desc')]: e.target.value })
  }

  const onImageUpload = (url: string) => {
    form.setFieldsValue({ [fieldName('avatar')]: url })
  }

  const addSpace = async (content: SpaceContent) => {
    isNew && await nextSpaceId.inc()
    const spaceId = nextSpaceId.value.toString()

    const space: SpaceDto = {
      id: spaceId,
      owner,
      created: {
        account: owner,
        time: new Date().getTime()
      },
      content: content
    }
    
    setSubmitting(true)

    await spaceStore.put(space)

    setSubmitting(false)

    goToView(spaceId)
  }

  const onSubmit = async () => {
    const isValid = await isValidForm(form)
    if (isValid) {
      addSpace(fieldValuesToContent())
    }
  }

  return <>
    <h2>{editType} space</h2>
    <Form form={form} initialValues={initialValues} {...layout}>
      <Form.Item
        name={fieldName('title')}
        label='Space title'
        hasFeedback
        rules={[
          { required: true, message: 'Space title is required.' },
          { min: TITLE_MIN_LEN, message: minLenError('Space title',TITLE_MIN_LEN) },
          { max: TITLE_MAX_LEN, message:  maxLenError('Space title',TITLE_MAX_LEN) }
        ]}
      >
        <Input placeholder='Optional: A title of your space' />
      </Form.Item>

      <Form.Item
        name={fieldName('desc')}
        label='Space'
        hasFeedback
        rules={[
          { required: true, message: 'Space body is required.' },
          { max: DESC_MAX_LEN, message: maxLenError('Space body', DESC_MAX_LEN) }
        ]}
      >
        <TextArea rows={5} onChange={onBodyChanged} />
      </Form.Item>

      <Form.Item
        name={fieldName('avatar')}
        label={'Avatar'}
      >
        <BucketDragDrop onUpload={onImageUpload} accept='image' />
      </Form.Item>

      <div className='RigthButtonGroup'>
        <Button onClick={() => form.resetFields()}>
          Reset form
        </Button>
        <Button htmlType="submit" loading={submitting} onClick={onSubmit} type="primary">
          New Space
        </Button>
      </div>
      {/* // TODO impl Move space to another space. See component SelectSpacePreview */}
    </Form>
  </>
}

function LoadSpaceThenEdit (props: FormProps) {
  const { spaceId } = useRouter().query
  const [ isLoaded, setIsLoaded ] = useState(false)
  const [ space, setSpace ] = useState<SpaceDto>()

  const { owner: myAddress } = useOrbitDbContext()
  const { spaceStore } = useSpaceStoreContext()

  useEffect(() => {
    const loadSpace = async () => {
      const space = await spaceStore.get(spaceId).pop()
      space && setSpace(space)
      setIsLoaded(true)
    }
    loadSpace().catch(err => console.error('Failed load space from OrbitDB:', err))
  })

  if (!isLoaded) return <em>Loading the space...</em>

  if (!space) return <Empty description='Space not found' />

  const isOwner = myAddress === space.owner
  if (!isOwner) return <Empty description='You do not have permission to edit this space' />

  return <InnerForm {...props} space={space} />
}

export const NewSpace = InnerForm

export const EditSpace = LoadSpaceThenEdit

export default NewSpace
