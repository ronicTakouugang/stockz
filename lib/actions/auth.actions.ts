"use server"

import {auth} from "@/lib/better-auth/auth";
import {inngestClient} from "@/lib/inngest/client";

export const signUpWithEmail = async(data: SignUpFormData) =>{
    const {email,password,fullName,country,investmentGoals,riskTolerance,preferredIndustry} = data;
    try {
        const response = await auth.api.signUpEmail({
            body : {
                email,
                password,
                name : fullName
            }
        })

        if(response){
            await inngestClient.send({
                name:"app/user.created",
                data : {
                    email,
                    name : fullName,
                    country,
                    investmentGoal: investmentGoals,
                    riskTolerance,
                    preferredIndustry
                }
            })
        }
        return {success: true, data : response}
    }catch(e){
        console.log("Sign up Failed",e)
        return {success: false, error : e instanceof Error ? e.message : "Sign up Failed"}
    }
}

export const signInWithEmail = async (data: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({
            body: {
                email: data.email,
                password: data.password,
            }
        });
        return { success: true, data: response };
    } catch (e) {
        console.log("Sign in Failed", e);
        return { success: false, error: e instanceof Error ? e.message : "Sign in Failed" };
    }
};