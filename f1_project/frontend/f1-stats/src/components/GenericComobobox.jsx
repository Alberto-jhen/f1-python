import React, { useState } from "react"
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

export function GenericCombobox({ options = [], value, onChange, placeholder, disabled }) {
    const [open, setOpen] = useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
                "w-full justify-between bg-slate-950 border-slate-700 text-white hover:bg-slate-900 hover:text-white",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            >
            {value 
                ? options.find((opt) => opt.value === value)?.label || value
                : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0 bg-slate-900 border-slate-700">
            <Command className="bg-slate-900 text-white">
            <CommandInput placeholder={`Buscar...`} className="h-9 text-white" />
            <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>
                <CommandGroup>
                {options.map((opt) => (
                    <CommandItem
                    key={opt.value}
                    value={opt.value}
                    onSelect={(currentValue) => {
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