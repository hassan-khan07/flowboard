
import { DefaultSession } from "next-auth"
// then use & DefaultSession['user']

declare module 'next-auth'{
    interface Session {
        user:{
            id:string;
        }&DefaultSession['user'];
}
interface User {
    id:string;
}
}

declare module 'next-auth/jwt' {
    interface JWT {
        id?:string;
    }
}