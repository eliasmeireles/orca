import type React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

type SelectFieldOption = { value: string; label: string }

type PcTransferSelectFieldProps = {
  id: string
  label: string
  placeholder: string
  value: string | null
  options: readonly SelectFieldOption[]
  onChange: (value: string) => void
  disabled?: boolean
  hint?: React.ReactNode
}

/** Labelled full-width select used by each step of the send dialog. */
export function PcTransferSelectField(props: PcTransferSelectFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select value={props.value ?? ''} onValueChange={props.onChange} disabled={props.disabled}>
        <SelectTrigger id={props.id} className="w-full">
          <SelectValue placeholder={props.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {props.hint}
    </div>
  )
}
