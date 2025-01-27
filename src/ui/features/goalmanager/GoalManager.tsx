import { faCalendarAlt, faSmile } from '@fortawesome/free-regular-svg-icons'
import { faDollarSign, IconDefinition, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { MaterialUiPickersDate } from '@material-ui/pickers/typings/date'
import 'date-fns'
import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { updateGoal as updateGoalApi } from '../../../api/lib'
import { Goal } from '../../../api/types'
import { selectGoalsMap, updateGoal as updateGoalRedux } from '../../../store/goalsSlice'
import { useAppDispatch, useAppSelector } from '../../../store/hooks'
import DatePicker from '../../components/DatePicker'
import { Theme } from '../../components/Theme'
import { BaseEmoji } from 'emoji-mart'
import EmojiPicker from '../../components/EmojiPicker'
import { setIsOpen } from '../../../store/modalSlice'

type Props = { 
  goal: Goal
  onClose?: () => void
}

export function GoalManager(props: Props) {
  const dispatch = useAppDispatch()
  const goalsMap = useAppSelector(selectGoalsMap)

  const goal = goalsMap[props.goal.id]

  const [name, setName] = useState<string | null>(null)
  const [targetDate, setTargetDate] = useState<Date | null>(null)
  const [targetAmount, setTargetAmount] = useState<number | null>(null)
  const [emojiPickerIsOpen, setEmojiPickerIsOpen] = useState(false)
  const [icon, setIcon] = useState<string | null>(props.goal.icon)

  useEffect(() => {
    setName(props.goal.name)
    setTargetDate(props.goal.targetDate)
    setTargetAmount(props.goal.targetAmount)
  }, [
    props.goal.id,
    props.goal.name,
    props.goal.targetDate,
    props.goal.targetAmount,
  ])

  useEffect(() => {
    setName(goal.name)
  }, [goal.name])

  const updateNameOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextName = event.target.value
    setName(nextName)
    const updatedGoal: Goal = {
      ...props.goal,
      name: nextName,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(props.goal.id, updatedGoal)
  }

  const updateTargetAmountOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextTargetAmount = parseFloat(event.target.value)
    setTargetAmount(nextTargetAmount)
    const updatedGoal: Goal = {
      ...props.goal,
      name: name ?? props.goal.name,
      targetDate: targetDate ?? props.goal.targetDate,
      targetAmount: nextTargetAmount,
    }
    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(props.goal.id, updatedGoal)
  }

  const pickDateOnChange = (date: MaterialUiPickersDate) => {
    if (date != null) {
      setTargetDate(date)
      const updatedGoal: Goal = {
        ...props.goal,
        name: name ?? props.goal.name,
        targetDate: date ?? props.goal.targetDate,
        targetAmount: targetAmount ?? props.goal.targetAmount,
      }
      dispatch(updateGoalRedux(updatedGoal))
      updateGoalApi(props.goal.id, updatedGoal)
    }
  }

  const hasIcon = () => icon != null

  const pickEmojiOnClick = (emoji: BaseEmoji, event: React.MouseEvent) => {
    event.stopPropagation()

    setIcon(emoji.native)
    setEmojiPickerIsOpen(false)

    const updatedGoal: Goal = {
      ...props.goal,
      icon: emoji.native,
      name: name ?? props.goal.name,
      targetDate: targetDate ?? props.goal.targetDate,
      targetAmount: targetAmount ?? props.goal.targetAmount,
    }

    dispatch(updateGoalRedux(updatedGoal))
    updateGoalApi(props.goal.id, updatedGoal)
  }

  const handleSave = async () => {
    const updatedGoal: Goal = {
      ...props.goal,
      icon: icon ?? props.goal.icon,
      name: name || props.goal.name,
      targetDate: targetDate || props.goal.targetDate,
      targetAmount: targetAmount || props.goal.targetAmount,
    }

    console.log('Before update - Redux state:', goalsMap)
    
    // 1. UPDATE REDUX
    dispatch(updateGoalRedux(updatedGoal))
    
    console.log('After update - Redux state:', goalsMap)
    console.log('updatedGoal', updatedGoal)

    // 2. TRY UPDATE DATABASE
    const success = await updateGoalApi(props.goal.id, updatedGoal)

    if (success) {
      dispatch(updateGoalRedux({ ...updatedGoal }))
      dispatch(setIsOpen(false))
      console.log('Goal updated successfully')
    } else {
      console.error('Failed to save goal')
    }
  }

  const handleCancel = () => {
    dispatch(setIsOpen(false))
  }

  return (
    <GoalManagerContainer>
      <IconSection>
        {icon ? (
          <GoalIcon onClick={() => setEmojiPickerIsOpen(true)}>
            {icon}
          </GoalIcon>
        ) : (
          <AddIconButton onClick={() => setEmojiPickerIsOpen(true)}>
            <FontAwesomeIcon icon={faSmile} size="2x" />
            <AddIconText>Add Icon</AddIconText>
          </AddIconButton>
        )}
      </IconSection>

      <EmojiPickerContainer
        isOpen={emojiPickerIsOpen}
        hasIcon={hasIcon()}
        onClick={(event) => event.stopPropagation()}
      >
        <EmojiPicker onClick={pickEmojiOnClick} />
      </EmojiPickerContainer>

      <NameInput value={name ?? ''} onChange={updateNameOnChange} />

      <Group>
        <Field name="Target Date" icon={faCalendarAlt} />
        <Value>
          <DatePicker value={targetDate} onChange={pickDateOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Target Amount" icon={faDollarSign} />
        <Value>
          <StringInput value={targetAmount ?? ''} onChange={updateTargetAmountOnChange} />
        </Value>
      </Group>

      <Group>
        <Field name="Balance" icon={faDollarSign} />
        <Value>
          <StringValue>{props.goal.balance}</StringValue>
        </Value>
      </Group>

      <Group>
        <Field name="Date Created" icon={faCalendarAlt} />
        <Value>
          <StringValue>{new Date(props.goal.created).toLocaleDateString()}</StringValue>
        </Value>
      </Group>

      <ButtonContainer>
        <Button variant="secondary" onClick={handleCancel}>
          <FontAwesomeIcon icon={faTimes} />
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          <FontAwesomeIcon icon={faCheck} />
          Save
        </Button>
      </ButtonContainer>
    </GoalManagerContainer>
  )
}

type FieldProps = { name: string; icon: IconDefinition }
type AddIconButtonContainerProps = { shouldShow: boolean }
type GoalIconContainerProps = { shouldShow: boolean }
type EmojiPickerContainerProps = { isOpen: boolean; hasIcon: boolean }

const Field = (props: FieldProps) => (
  <FieldContainer>
    <FontAwesomeIcon icon={props.icon} size="2x" />
    <FieldName>{props.name}</FieldName>
  </FieldContainer>
)

const GoalManagerContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  width: 100%;
  position: relative;
`

const Group = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  margin-top: 1.25rem;
  margin-bottom: 1.25rem;
`
const NameInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 4rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const FieldName = styled.h1`
  font-size: 1.8rem;
  margin-left: 1rem;
  color: rgba(174, 174, 174, 1);
  font-weight: normal;
`
const FieldContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 20rem;

  svg {
    color: rgba(174, 174, 174, 1);
  }
`
const StringValue = styled.h1`
  font-size: 1.8rem;
  font-weight: bold;
`
const StringInput = styled.input`
  display: flex;
  background-color: transparent;
  outline: none;
  border: none;
  font-size: 1.8rem;
  font-weight: bold;
  color: ${({ theme }: { theme: Theme }) => theme.text};
`

const Value = styled.div`
  margin-left: 2rem;
`

const EmojiPickerContainer = styled.div<EmojiPickerContainerProps>`
  display: ${(props) => (props.isOpen ? 'flex' : 'none')};
  position: absolute;
  top: ${(props) => (props.hasIcon ? '10rem' : '2rem')};
  left: 0;
  z-index: 1000;
`

const IconSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`

const GoalIcon = styled.div`
  font-size: 2rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`

const AddIconButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }: { theme: Theme }) => theme.text};
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
`

const AddIconText = styled.span`
  margin-left: 0.5rem;
  font-size: 1rem;
`

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  width: 100%;
`

const Button = styled.button<{ variant: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  background-color: ${props => props.variant === 'primary' ? '#4CAF50' : '#f44336'};
  color: white;
  
  &:hover {
    opacity: 0.9;
  }

  svg {
    margin-right: 0.5rem;
  }
`
