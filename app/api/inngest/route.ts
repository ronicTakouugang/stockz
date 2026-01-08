import {serve} from "inngest/next";
import {inngestClient} from "@/lib/inngest/client";
import {sendSignUpEmail} from "@/lib/inngest/function";

export const { GET, POST, PUT} = serve({
    client : inngestClient,
    functions : [sendSignUpEmail],
})