import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";


export async function POST(request: Request) {
     try {
        const { email, password, name } = await request.json();
        const existingUserByEmail = await prisma.user.findUnique({
            where: { email: email },
        })
        if (existingUserByEmail) {
            return Response.json({
                success: false,
                message: "Email already in use",
            },
            { status: 400 }
            )
        }
        const hashPassword = await bcrypt.hash(password,10)
        const newUser = await prisma.user.create({
         data: {
            email,
            password: hashPassword,
            name,
        },
        
    });

const newWorkspace = await prisma.workspace.create({
  data: {
    name: newUser.name?.concat(" workspace") || "My Workspace",
    ownerId: newUser.id,
  }
})

const newWorkspaceMember = await prisma.workspaceMember.create({
  data: {
    userId:newUser.id,
    workspaceId: newWorkspace.id,
    role: "OWNER"
  }
})
    
    return Response.json({
        success: true,
        message: "User registered successfully",
    });

   }  
    catch (error) {
    console.error("Error registering user:", error);
    return Response.json({
            success: false,
            message: "Error registering user",
        },
        { status: 500 }
    );
}
}
