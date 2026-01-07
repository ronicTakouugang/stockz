"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import FooterLink from "@/components/forms/FooterLink";

const SignIn = () => {
    const methods = useForm<SignInFormData>();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = methods;

    const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
        console.log(data);
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