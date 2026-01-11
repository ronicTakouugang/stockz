"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";

import {signInWithEmail} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

interface SignInFormData {
    email: string;
    password: string;
}

const SignIn = () => {
    const methods = useForm<SignInFormData>();
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = methods;

    const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
        try {
            const result = await signInWithEmail(data);
            if (result.success) {
                router.push("/");
                toast.success("Welcome back!");
            } else {
                toast.error("Sign in failed", {
                    description: result.error as string,
                });
            }
        } catch (e) {
            console.error(e);
            toast.error("Sign in failed", {
                description: e instanceof Error ? e.message : "An unexpected error occurred",
            });
        }
    };

    return (
        <div>
            <h1 className="form-title">Welcome Back !!!</h1>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <InputField
                        name="email"
                        label="Email"
                        placeholder="contact@stock.com"
                        register={register}
                        errors = {errors}
                        validation={{ required: 'Email is required' , pattern: { value: /^\S+@\S+$/i, message: 'Email must be valid' }}}
                    />
                    <InputField
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        register={register}
                        errors = {errors}
                        validation={{ required: 'Password is required' }}
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="green-btn w-full mt-5"
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <FooterLink
                        text="Don't have an account?"
                        linkText="Sign up"
                        href="/sign-up"
                    />
                </form>
            </FormProvider>
        </div>
    );
};

export default SignIn;