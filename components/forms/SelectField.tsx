import { Label } from "@/components/ui/label";
import { Controller, useFormContext } from "react-hook-form";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface SelectFieldProps {
    name: string;
    label: string;
    placeholder?: string;
    options: Array<{ value: string; label: string }>;
    error?: any;
    required?: boolean;
}

const SelectField = ({
                         name,
                         label,
                         placeholder,
                         options,
                         error,
                         required = false
                     }: SelectFieldProps) => {
    const { control } = useFormContext();
    return (
        <div className="space-y-2">
            <Label htmlFor={name} className="form-label">
                {label}
            </Label>
            <Controller
                name={name}
                control={control}
                rules={{
                    required: required ? `${label} is required` : false,
                }}
                render={({ field }) => (
                    <>
                        <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                        >
                            <SelectTrigger className="select-trigger">
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                <SelectGroup>
                                    {options.map((option) => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="focus:bg-gray-600 focus:text-white hover:bg-gray-700"
                                        >
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        {error && (
                            <p className="text-red-500 text-sm mt-1">
                                {error.message}
                            </p>
                        )}
                    </>
                )}
            />
        </div>
    );
};

export default SelectField;