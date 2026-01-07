"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler, FormProvider } from "react-hook-form";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, RISK_TOLERANCE_OPTIONS, PREFERRED_INDUSTRIES} from "@/lib/constants";
import CountrySelectField from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";

const SignUp = () => {
    const methods = useForm<SignUpFormData>();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = methods;

    const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
        console.log(data);
    };

    return (
        <div>
            <h1 className="form-title">Sign Up & Personalize</h1>
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <InputField
                        name="fullName"
                        label="Full Name"
                        placeholder="Example : Ronic TK"
                        register={register}
                        errors = {errors.fullName}
                        validation={{ required: 'Full name is required' , minLength: { value: 3, message: 'Full name must be at least 3 characters'}}}
                    />
                    <InputField
                        name="email"
                        label="Email"
                        placeholder="contact@stock.com"
                        register={register}
                        errors = {errors.email}
                        validation={{ required: 'Email is required' , pattern: { value: /^\S+@\S+$/i, message: 'Email must be valid' }}}
                    />
                    <InputField
                        name="password"
                        label="Password"
                        type="password"
                        placeholder="Enter a strong password"
                        register={register}
                        errors = {errors.password}
                        validation={{ required: 'Password is required' , minLength: { value: 8, message: 'Password must be at least 8 characters'}}}
                    />
                    <CountrySelectField
                        name="country"
                        label="Country"
                        error={errors.country}
                        required
                    />
                    <SelectField
                        name="investmentGoals"
                        label="Investment Goals"
                        placeholder="Select your investment goals"
                        options={INVESTMENT_GOALS}
                        error={errors.investmentGoals}
                        required
                    />
                    <SelectField
                        name="riskTolerance"
                        label="Risk Tolerance"
                        placeholder="Select your risk level"
                        options={RISK_TOLERANCE_OPTIONS}
                        error={errors.riskTolerance}
                        required
                    />
                    <SelectField
                        name="preferredIndustry"
                        label="Preferred Industry"
                        placeholder="Select your preferred industry"
                        options={PREFERRED_INDUSTRIES}
                        error={errors.preferredIndustry}
                        required
                    />
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="green-btn w-full mt-5"
                    >
                        {isSubmitting ? 'Creating account...' : 'Start your Journey'}
                    </Button>
                    <FooterLink
                        text="Already have an account?"
                        linkText="Sign in"
                        href="/sign-in"
                    />
                </form>
            </FormProvider>
        </div>
    );
};

export default SignUp;