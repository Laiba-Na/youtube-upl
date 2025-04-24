// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { z } from "zod";
import { PrismaClient } from '@prisma/client';

const f = createUploadthing();


const prisma = new PrismaClient();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB" } })
  .input(z.object({ projectId: z.string() }))  
  .middleware(async ({ input }) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new Error("Unauthorized");
  return { userId: session.user.id, projectId: input.projectId };
})
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        const { userId, projectId } = metadata;
    
        const project = await prisma.project.findFirst({
          where: { id: projectId, userId },
        });
        if (!project) throw new Error("Project not found or unauthorized");
    
        const asset = await prisma.asset.create({
          data: {
            name: file.name,
            type: "image",
            path: file.ufsUrl,
            projectId,
          },
        });
    
        console.log(`Upload complete for user ${userId}, asset ID: ${asset.id}`);
        return { url: file.ufsUrl, assetId: asset.id };
      } catch (error) {
        console.error("Error in onUploadComplete:", error);
        throw error; // Let UploadThing handle the error response
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;