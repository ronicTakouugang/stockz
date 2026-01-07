"use client";

import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Définition du type des props
interface FormInputProps {
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
    register: any;
    errors: any;
    validation?: {
        required?: boolean | string;
        minLength?: number | { value: number; message: string };
        pattern?: { value: RegExp; message: string };
    };
    disabled?: boolean;
    value?: string;
}

const InputField = ({
                        name,
                        label,
                        placeholder,
                        type = "text",
                        register,
                        errors,
                        validation,
                        disabled,
                        value
                    }: FormInputProps) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
            </Label>
            <Input
                type={type}
                id={name}
                placeholder={placeholder}
                {...register(name, {
                    required: validation?.required,
                    minLength: validation?.minLength,
                    pattern: validation?.pattern,
                })}
                disabled={disabled}
                defaultValue={value}
                className={cn(
                    'form-input',
                    {
                        'opacity-50 cursor-not-allowed': disabled,
                        'border-red-500': errors?.[name]
                    }
                )}
            />
            {errors?.[name] && (
                <p className="text-red-500 text-sm mt-1">
                    {errors[name]?.message || `${label} is required`}
                </p>
            )}
        </div>
    );
};

export default InputField;