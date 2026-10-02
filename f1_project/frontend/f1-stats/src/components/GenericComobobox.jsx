import React, { useState, useId } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function GenericCombobox({
    options = [],
    value,
    onChange,
    placeholder,
    disabled,
    triggerBackgroundClassName = "bg-slate-950 hover:bg-slate-900",
    popoverBackgroundClassName = "bg-slate-900",
}) {
    const [open, setOpen] = useState(false)
    const listboxId = useId()

    return (
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            disabled={disabled}
            className={cn(
                "w-full justify-between border-slate-700 text-white hover:text-white",
                triggerBackgroundClassName,
                disabled && "opacity-50 cursor-not-allowed"
            )}
            >
            {value 
                ? options.find((opt) => opt.value === value)?.label || value
                : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className={cn("w-(--radix-popover-trigger-width) p-0 border-slate-700", popoverBackgroundClassName)}>
            <Command className={cn("text-white", popoverBackgroundClassName)}>
            <CommandInput placeholder={`Buscar...`} className="h-9 text-white" />
            <CommandList id={listboxId}>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                <CommandGroup>
                {options.map((opt) => (
                    <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={() => {
                        onChange(opt.value)
                        setOpen(false)
                    }}
                    className="text-white data-highlighted:bg-red-600 data-highlighted:text-white cursor-pointer"
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === opt.value ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {opt.label}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
    )
}